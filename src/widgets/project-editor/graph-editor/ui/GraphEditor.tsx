import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CompressRoundedIcon from '@mui/icons-material/CompressRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandRoundedIcon from '@mui/icons-material/ExpandRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import { Box, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  EdgeTypes,
  MarkerType,
  NodeChange,
  NodeTypes,
  OnBeforeDelete,
  OnConnect,
  OnDelete,
  OnReconnect,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useOnSelectionChange,
  useReactFlow,
} from '@xyflow/react';
import { useStore } from 'react-redux';

import { useAlert } from '@/app/notifications';
import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from '@/app/providers/store';

import {
  buildCustomEdgeUiGradient,
  buildHandleColorLookup,
  getCustomEdgeUiGradient,
} from '@/widgets/project-editor/custom-edge';
import {
  CustomNode,
  CustomNodeConnectionRevealRuntime,
} from '@/widgets/project-editor/custom-node';
import { WidgetNode } from '@/widgets/project-editor/custom-node-widget/ui';
import {
  SubgraphNode,
  SubgraphPanelNode,
} from '@/widgets/project-editor/subgraph-node';

import { useNodeConnectionValidation } from '@/features/node/validate-node-connection';
import {
  AutoLayoutControlButton,
  calculateGraphAutoLayout,
  createGraphAutoLayoutSignature,
  getElkLayoutEngine,
} from '@/features/project-editor/auto-layout';
import { useAutoReconnectNodes } from '@/features/project-editor/auto-reconnect-nodes';
import { EdgeContextMenu } from '@/features/project-editor/edge-context-menu';
import {
  calculateNodeFocusViewport,
  type GraphNodeFocusRequest,
  resolveGraphNodeFocusPlan,
  useGraphNodeFocusRequest,
} from '@/features/project-editor/focus-node';
import {
  GraphNodeSearchPanel,
  GraphNodeSearchProvider,
} from '@/features/project-editor/graph-node-search';
import {
  useGraphChanges,
  useGraphCreates,
  useGraphDeletes,
  useGraphLoading,
} from '@/features/project-editor/manage-graph';
import { MultiNodeContextMenu } from '@/features/project-editor/multi-node-context-menu';
import { NodeContextMenu } from '@/features/project-editor/node-context-menu';
import { useSelectNode } from '@/features/project-editor/select-node';
import {
  buildSubgraphProjection,
  computePushAwayNodePositions,
  expandPanelToFitNode,
  getSubgraphIDFromPanelNodeID,
  type GraphEdgeWithSubgraph,
  type GraphEditorNode,
  mapSubgraphConnectionToReal,
  pointInRect,
  rectIntersects,
  type SubgraphPanelDropSide,
  type SubgraphPanelLayoutMap,
  useSubgraphActions,
} from '@/features/project-editor/subgraph';
import { useGraphViewport, useNodeDataModalUI } from '@/features/ui-layout';

import {
  buildInitialInputValues,
  selectNodeDefinitionByName,
} from '@/entities/node/node-definition';
import { useCurrentProject } from '@/entities/project/projects';
import { useEdgeContextMenuActions } from '@/entities/project-editor/edge-context-menu';
import {
  CustomNodeType,
  generateRandomSubgraphColor,
  generateShortEdgeID,
  generateShortNodeID,
  generateShortSubgraphID,
  selectGraphLastLoadedProjectID,
  updateGraphNodePositions,
} from '@/entities/project-editor/graph';
import { useMultiNodeContextMenuActions } from '@/entities/project-editor/multi-node-context-menu';
import { NodeLibraryContextMenu } from '@/entities/project-editor/node-library/ui/NodeLibraryContextMenu/NodeLibraryContextMenu';

import { NodeDefinition, SubgraphUiSchema } from '@/shared/gatewayClient';
import { isIoTypeCompatible } from '@/shared/lib/node-io';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import {
  buildDuplicateClipboardPayload,
  cloneIncomingEdgesForDuplicate,
  cloneNodeForDuplicate,
  type DuplicateClipboardPayload,
  findNearestFreeNodePosition,
  NODE_DUPLICATE_CLIPBOARD_MIME,
  parseDuplicateClipboardPayload,
} from '../lib/duplicateNode';
import { isSecondaryMouseButtonEvent } from '../lib/paneMenuInteraction';
import { shouldOpenMultiSelectionContextMenu } from '../lib/selectionContextMenuInteraction';

import { FloatingActionPanel } from './FloatingActionPanel';

import '@xyflow/react/dist/style.css';

interface GraphEditorProps {
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
}

type OnCreate = (payload: {
  nodes?: CustomNodeType[];
  edges?: Edge[];
  subgraphs?: SubgraphUiSchema[];
}) => Promise<void>;

type ScreenPoint = { x: number; y: number };
type SelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const RIGHT_SELECTION_DRAG_THRESHOLD = 4;
const SUBGRAPH_POSITION_PADDING = 40;
const SUBGRAPH_PANEL_DEFAULT_WIDTH = 520;
const SUBGRAPH_PANEL_DEFAULT_HEIGHT = 340;
const SUBGRAPH_PANEL_PADDING_X = SUBGRAPH_POSITION_PADDING;
const SUBGRAPH_PANEL_PADDING_TOP = SUBGRAPH_POSITION_PADDING + 12;
const SUBGRAPH_PANEL_PADDING_BOTTOM = SUBGRAPH_POSITION_PADDING;
const SUBGRAPH_EXPANDED_LAYER_Z_INDEX = 4;
const DEFAULT_NODE_WIDTH = 260;
const DEFAULT_NODE_HEIGHT = 120;
const SUBGRAPH_PANEL_NODE_TYPE = 'subgraphPanel';
const EMPTY_MATCH_NODE_IDS: string[] = [];
const EMPTY_MATCH_NODE_ID_SET: ReadonlySet<string> = new Set();
const SUBGRAPH_DROP_ENTRY_PADDING = 32;
const GRAPH_CLIPBOARD_NOTIFICATION_GROUP = 'graph-editor-node-duplicate';
const PANE_MENU_AUTO_CLOSE_LOCK_MS = 220;
const CONTEXT_MENU_OPEN_INTERACTION_LOCK_MS = 900;
const MULTI_NODE_CONTEXT_MENU_DEBUG_FLAG = 'dvt.debugMultiNodeContextMenu';

type GraphEdgeRenderCacheEntry = {
  baseEdge: GraphEdgeWithSubgraph;
  edge: GraphEdgeWithSubgraph;
  signature: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const SUBGRAPH_MENU_ITEM_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: 0,
  py: '4px',
  px: '10px',
  borderRadius: '10px',
  transition: 'all 120ms ease',
  userSelect: 'none',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  '&:active': {
    backgroundColor: '#eeeeee',
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    opacity: 0.5,
  },
} as const;

const SUBGRAPH_MENU_LABEL_SX = {
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  fontWeight: 500,
  color: '#4b5563',
  transition: 'color 120ms ease',
  '.MuiMenuItem-root:hover &': {
    color: '#111827',
  },
} as const;

const buildSubgraphMenuIconBoxSx = (
  variant: 'default' | 'error' = 'default'
) => {
  if (variant === 'error') {
    return {
      width: 32,
      height: 32,
      borderRadius: '10px',
      backgroundColor: '#fee2e2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 120ms ease',
      flexShrink: 0,
      '.MuiSvgIcon-root': {
        fontSize: 18,
        color: '#ef4444',
        transition: 'color 120ms ease',
      },
    } as const;
  }

  return {
    width: 32,
    height: 32,
    borderRadius: '10px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 120ms ease',
    flexShrink: 0,
    '.MuiSvgIcon-root': {
      fontSize: 18,
      color: '#6b7280',
      transition: 'color 120ms ease',
    },
    '.MuiMenuItem-root:hover &': {
      backgroundColor: '#f3f4f6',
    },
  } as const;
};

type SubgraphDropTargetPreview = {
  subgraphId: string;
  side: SubgraphPanelDropSide | null;
};

type DragEntryExpansion = {
  subgraphId: string;
  previousLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const areDropTargetPreviewEqual = (
  a: SubgraphDropTargetPreview | null,
  b: SubgraphDropTargetPreview | null
): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.subgraphId === b.subgraphId && a.side === b.side;
};

const resolveNearestPanelSide = (
  point: { x: number; y: number },
  layout: { x: number; y: number; width: number; height: number }
): SubgraphPanelDropSide => {
  const distances: Record<SubgraphPanelDropSide, number> = {
    left: Math.abs(point.x - layout.x),
    right: Math.abs(layout.x + layout.width - point.x),
    top: Math.abs(point.y - layout.y),
    bottom: Math.abs(layout.y + layout.height - point.y),
  };

  let bestSide: SubgraphPanelDropSide = 'left';
  let bestDistance = distances.left;
  for (const side of ['right', 'top', 'bottom'] as const) {
    const distance = distances[side];
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSide = side;
    }
  }
  return bestSide;
};

const resolveEntrySideFromPoints = (
  previousPoint: { x: number; y: number },
  nextPoint: { x: number; y: number },
  layout: { x: number; y: number; width: number; height: number }
): SubgraphPanelDropSide => {
  if (previousPoint.x < layout.x) {
    return 'left';
  }
  if (previousPoint.x > layout.x + layout.width) {
    return 'right';
  }
  if (previousPoint.y < layout.y) {
    return 'top';
  }
  if (previousPoint.y > layout.y + layout.height) {
    return 'bottom';
  }

  if (nextPoint.x < layout.x) {
    return 'left';
  }
  if (nextPoint.x > layout.x + layout.width) {
    return 'right';
  }
  if (nextPoint.y < layout.y) {
    return 'top';
  }
  if (nextPoint.y > layout.y + layout.height) {
    return 'bottom';
  }

  return resolveNearestPanelSide(nextPoint, layout);
};

const expandPanelLayoutToEntrySide = (
  layout: { x: number; y: number; width: number; height: number },
  side: SubgraphPanelDropSide,
  amount: number
): { x: number; y: number; width: number; height: number } => {
  if (amount <= 0) {
    return layout;
  }

  if (side === 'left') {
    return {
      ...layout,
      x: layout.x - amount,
      width: layout.width + amount,
    };
  }
  if (side === 'right') {
    return {
      ...layout,
      width: layout.width + amount,
    };
  }
  if (side === 'top') {
    return {
      ...layout,
      y: layout.y - amount,
      height: layout.height + amount,
    };
  }
  return {
    ...layout,
    height: layout.height + amount,
  };
};

const resolveDropEntryExpandAmount = (
  side: SubgraphPanelDropSide,
  size: { width: number; height: number },
  padding = SUBGRAPH_DROP_ENTRY_PADDING
): number => {
  if (side === 'left' || side === 'right') {
    return size.width + padding;
  }
  return size.height + padding;
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const buildNodeJiggleStyle = (
  nodeID: string,
  baseStyle: CustomNodeType['style']
): React.CSSProperties => {
  const seed = hashString(nodeID);
  const delayMs = -(seed % 320);

  const nextStyle: React.CSSProperties = {
    ...(baseStyle ?? {}),
    transformOrigin: 'center center',
  };
  const cssVars = nextStyle as Record<string, string | number>;
  cssVars['--subgraph-jiggle-delay'] = `${delayMs}ms`;

  return nextStyle;
};

const resolvePositiveSize = (
  value: number | string | null | undefined
): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 1) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 1) {
      return parsed;
    }
  }
  return null;
};

const isTextInputTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  if (el.isContentEditable) return true;
  if (el.getAttribute('role') === 'textbox') return true;
  if (el.closest('.nokey, .monaco-editor, .native-edit-context')) {
    return true;
  }
  return false;
};

const isDialogTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;

  if (el.closest('[role="dialog"], .MuiDialog-root')) {
    return true;
  }

  const activeElement = document.activeElement as HTMLElement | null;
  return Boolean(activeElement?.closest('[role="dialog"], .MuiDialog-root'));
};

const GraphEditor_: React.FC<GraphEditorProps> = ({ edgeTypes }) => {
  const theme = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const edgeUpdateSuccessful = useRef(true);
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  const {
    screenToFlowPosition,
    setViewport,
    fitView,
    getViewport,
    getInternalNode,
    getNode,
  } = useReactFlow<GraphEditorNode, GraphEdgeWithSubgraph>();

  const [nodes, setNodes, onNodesChanges] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChanges] =
    useEdgesState<GraphEdgeWithSubgraph>([]);
  const visibleEdgeRenderCacheRef = useRef<
    Map<string, GraphEdgeRenderCacheEntry>
  >(new Map());
  const [subgraphs, setSubgraphs] = useState<SubgraphUiSchema[]>([]);
  const [isAutoLayouting, setIsAutoLayouting] = useState(false);
  const [panelLayoutBySubgraphID, setPanelLayoutBySubgraphID] =
    useState<SubgraphPanelLayoutMap>({});
  const [panelEditModeBySubgraphID, setPanelEditModeBySubgraphID] = useState<
    Record<string, boolean>
  >({});
  const [isExtractModifierPressed, setIsExtractModifierPressed] =
    useState(false);
  const [dropTargetPreview, setDropTargetPreview] =
    useState<SubgraphDropTargetPreview | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const subgraphsRef = useRef(subgraphs);
  const autoLayoutRequestIDRef = useRef(0);
  const panelLayoutRef = useRef(panelLayoutBySubgraphID);
  const dropTargetPreviewRef = useRef<SubgraphDropTargetPreview | null>(null);
  const dragEntryPreviewByNodeIDRef = useRef<
    Map<string, SubgraphDropTargetPreview>
  >(new Map());
  const dragEntryExpansionByNodeIDRef = useRef<Map<string, DragEntryExpansion>>(
    new Map()
  );
  const prevExpandedSubgraphIDSetRef = useRef<Set<string>>(new Set());
  const extractIntentNodeIDsRef = useRef<Set<string>>(new Set());
  const draggingPanelSubgraphIDsRef = useRef<Set<string>>(new Set());
  const draggingMemberSubgraphIDsRef = useRef<Set<string>>(new Set());
  const panelDragAccumulatedDeltaBySubgraphIDRef = useRef<
    Map<string, { dx: number; dy: number }>
  >(new Map());
  const panelDragLastPositionBySubgraphIDRef = useRef<
    Map<string, { x: number; y: number }>
  >(new Map());
  const subgraphDragAccumulatedDeltaByIDRef = useRef<
    Map<string, { dx: number; dy: number }>
  >(new Map());
  const subgraphDragLastPositionByIDRef = useRef<
    Map<string, { x: number; y: number }>
  >(new Map());
  const extractModifierPressedRef = useRef(false);

  // --- State for Clean Context Menu ---
  const [paneMenu, setPaneMenu] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const paneMenuAutoCloseLockedUntilRef = useRef(0);
  const contextMenuInteractionLockedUntilRef = useRef(0);
  const [subgraphMenu, setSubgraphMenu] = useState<{
    subgraphId: string;
    x: number;
    y: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const prevNormalizedQueryRef = useRef<string>('');
  const [rightSelectionRect, setRightSelectionRect] =
    useState<SelectionRect | null>(null);
  const rightSelectionStartRef = useRef<ScreenPoint | null>(null);
  const isRightSelectingRef = useRef(false);
  const suppressNextPaneContextMenuRef = useRef(false);
  const suppressNextMultiSelectionContextMenuRef = useRef(false);
  const pendingMultiSelectionContextMenuRef = useRef<{
    nodeIDs: string[];
  } | null>(null);

  // --- State for Handle Context Menu ---
  const [handleMenu, setHandleMenu] = useState<{
    top: number;
    left: number;
    sourceNodeId: string;
    sourceHandleId: string;
    dataType: string | string[];
    direction: 'from-output' | 'from-input';
  } | null>(null);
  const suppressMoveStartCloseForHandleMenuRef = useRef(false);

  const { selectNode, clearSelectedNode } = useSelectNode();
  const graphNodeFocusRequest = useGraphNodeFocusRequest();
  const lastHandledNodeFocusRequestIDRef = useRef(0);
  const [pendingNodeFocus, setPendingNodeFocus] =
    useState<GraphNodeFocusRequest | null>(null);

  const lockContextMenuInteractions = useCallback(() => {
    contextMenuInteractionLockedUntilRef.current =
      Date.now() + CONTEXT_MENU_OPEN_INTERACTION_LOCK_MS;
  }, []);

  const openPaneMenu = useCallback(
    (position: { top: number; left: number }) => {
      lockContextMenuInteractions();
      paneMenuAutoCloseLockedUntilRef.current =
        Date.now() + PANE_MENU_AUTO_CLOSE_LOCK_MS;
      setPaneMenu(position);
    },
    [lockContextMenuInteractions]
  );

  const closePaneMenu = useCallback(
    ({ force = false }: { force?: boolean } = {}) => {
      if (!force && Date.now() < paneMenuAutoCloseLockedUntilRef.current) {
        return false;
      }

      setPaneMenu(null);
      return true;
    },
    []
  );

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    subgraphsRef.current = subgraphs;
  }, [subgraphs]);

  useEffect(() => {
    panelLayoutRef.current = panelLayoutBySubgraphID;
  }, [panelLayoutBySubgraphID]);

  const setDropTargetPreviewSafe = useCallback(
    (next: SubgraphDropTargetPreview | null) => {
      dropTargetPreviewRef.current = next;
      setDropTargetPreview(current =>
        areDropTargetPreviewEqual(current, next) ? current : next
      );
    },
    []
  );

  useEffect(() => {
    const setExtractModifierPressed = (next: boolean) => {
      extractModifierPressedRef.current = next;
      setIsExtractModifierPressed(current =>
        current === next ? current : next
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setExtractModifierPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setExtractModifierPressed(false);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      setExtractModifierPressed(Boolean(event.shiftKey));
    };

    const handleWindowBlur = () => {
      setExtractModifierPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      setExtractModifierPressed(false);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    const clearDraggingPanels = () => {
      draggingPanelSubgraphIDsRef.current.clear();
      draggingMemberSubgraphIDsRef.current.clear();
      dragEntryPreviewByNodeIDRef.current.clear();
      const pendingEntryExpansions = Array.from(
        dragEntryExpansionByNodeIDRef.current.values()
      );
      if (pendingEntryExpansions.length > 0) {
        setPanelLayoutBySubgraphID(current => {
          let didChange = false;
          let next = current;
          const restoredSubgraphIDs = new Set<string>();

          for (const entry of pendingEntryExpansions) {
            if (restoredSubgraphIDs.has(entry.subgraphId)) {
              continue;
            }
            const currentLayout = next[entry.subgraphId];
            if (!currentLayout) {
              continue;
            }
            if (
              currentLayout.x === entry.previousLayout.x &&
              currentLayout.y === entry.previousLayout.y &&
              currentLayout.width === entry.previousLayout.width &&
              currentLayout.height === entry.previousLayout.height
            ) {
              restoredSubgraphIDs.add(entry.subgraphId);
              continue;
            }
            if (!didChange) {
              next = { ...current };
              didChange = true;
            }
            next[entry.subgraphId] = entry.previousLayout;
            restoredSubgraphIDs.add(entry.subgraphId);
          }

          if (didChange) {
            panelLayoutRef.current = next;
            return next;
          }
          return current;
        });
      }
      dragEntryExpansionByNodeIDRef.current.clear();
      setDropTargetPreviewSafe(null);
    };

    const clearInterruptedDragState = () => {
      clearDraggingPanels();
      panelDragAccumulatedDeltaBySubgraphIDRef.current.clear();
      panelDragLastPositionBySubgraphIDRef.current.clear();
      subgraphDragAccumulatedDeltaByIDRef.current.clear();
      subgraphDragLastPositionByIDRef.current.clear();
    };

    window.addEventListener('pointerup', clearDraggingPanels);
    window.addEventListener('pointercancel', clearInterruptedDragState);
    window.addEventListener('blur', clearInterruptedDragState);

    return () => {
      window.removeEventListener('pointerup', clearDraggingPanels);
      window.removeEventListener('pointercancel', clearInterruptedDragState);
      window.removeEventListener('blur', clearInterruptedDragState);
    };
  }, [setDropTargetPreviewSafe]);

  const { currentProject } = useCurrentProject();
  const nodeDataModalUI = useNodeDataModalUI();
  const { viewport: savedViewport, setViewport: saveViewport } =
    useGraphViewport(currentProject?.id);
  const lastLoadedProjectID = useAppSelector(selectGraphLastLoadedProjectID);

  const { graphLoading, graphLoaded, loadGraph } = useGraphLoading();
  const nodeDefinitionsMap = useAppSelector(
    state => state.nodeDefinition.nodesDefinitionsMap
  );

  const {
    createSubgraphs,
    updateSubgraphs,
    deleteSubgraphs,
    bindNodesToSubgraph,
    bindEdgesToSubgraph,
  } = useSubgraphActions();

  const projection = useMemo(
    () =>
      buildSubgraphProjection({
        nodes,
        edges,
        subgraphs,
        nodeDefinitionsMap,
        panelLayoutBySubgraphID,
        panelEditModeBySubgraphID,
        extractMode: isExtractModifierPressed,
      }),
    [
      edges,
      isExtractModifierPressed,
      nodeDefinitionsMap,
      nodes,
      panelEditModeBySubgraphID,
      panelLayoutBySubgraphID,
      subgraphs,
    ]
  );

  const expandedSubgraphIDs = useMemo(() => {
    return subgraphs
      .filter(subgraph => Boolean(subgraph.expanded))
      .map(subgraph => subgraph.id)
      .sort();
  }, [subgraphs]);
  const expandedSubgraphIDsKey = useMemo(
    () => expandedSubgraphIDs.join('|'),
    [expandedSubgraphIDs]
  );
  const expandedSubgraphIDSet = useMemo(
    () => new Set(expandedSubgraphIDs),
    [expandedSubgraphIDs]
  );
  const subgraphColorByID = useMemo(() => {
    const result: Record<string, string> = {};
    for (const subgraph of subgraphs) {
      const color = subgraph.data.color;
      if (color) {
        result[subgraph.id] = color;
      }
    }
    return result;
  }, [subgraphs]);

  const visibleNodes = useMemo<GraphEditorNode[]>(() => {
    return projection.visibleNodes.map(node => {
      if (node.type !== 'custom' && node.type !== 'widget') {
        if (node.type !== SUBGRAPH_PANEL_NODE_TYPE) {
          return node;
        }

        const panelSubgraphID =
          (node.data as { subgraphId?: string } | undefined)?.subgraphId ??
          getSubgraphIDFromPanelNodeID(node.id);
        const isDropTarget =
          Boolean(panelSubgraphID) &&
          dropTargetPreview?.subgraphId === panelSubgraphID;

        if (!isDropTarget) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            dropHoverActive: true,
            ...(dropTargetPreview?.side
              ? { dropHoverSide: dropTargetPreview.side }
              : {}),
          },
        };
      }

      const subgraphID = node.subgraphId ?? null;
      if (!subgraphID || !expandedSubgraphIDSet.has(subgraphID)) {
        return node;
      }

      const editMode = Boolean(panelEditModeBySubgraphID[subgraphID]);
      const subgraphHeaderColor = subgraphColorByID[subgraphID];
      const memberBaseStyle: React.CSSProperties = {
        ...(node.style ?? {}),
        zIndex: SUBGRAPH_EXPANDED_LAYER_Z_INDEX,
      };
      const nextNodeData = subgraphHeaderColor
        ? {
            ...node.data,
            subgraphHeaderColor,
          }
        : node.data;
      const classNames = [
        node.className,
        editMode ? 'subgraph-member-editable' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (classNames) {
        return {
          ...node,
          data: nextNodeData,
          draggable: editMode,
          className: classNames,
          style: editMode
            ? buildNodeJiggleStyle(node.id, memberBaseStyle)
            : memberBaseStyle,
        };
      }

      return {
        ...node,
        data: nextNodeData,
        draggable: editMode,
        style: editMode
          ? buildNodeJiggleStyle(node.id, memberBaseStyle)
          : memberBaseStyle,
      };
    });
  }, [
    dropTargetPreview,
    expandedSubgraphIDSet,
    panelEditModeBySubgraphID,
    projection.visibleNodes,
    subgraphColorByID,
  ]);
  const handleColorLookup = useMemo(
    () =>
      buildHandleColorLookup({
        nodes,
        nodeDefinitionsMap,
        portsBySubgraphID: projection.portsBySubgraphID,
      }),
    [nodeDefinitionsMap, nodes, projection.portsBySubgraphID]
  );

  const visibleEdges = useMemo<GraphEdgeWithSubgraph[]>(() => {
    const nextCache = new Map<string, GraphEdgeRenderCacheEntry>();

    const nextVisibleEdges = projection.visibleEdges.map(edge => {
      const uiGradient = buildCustomEdgeUiGradient(edge, handleColorLookup);
      const baseData = isRecord(edge.data) ? edge.data : undefined;
      const currentGradient = getCustomEdgeUiGradient(baseData);
      const isProxyEdge =
        baseData?.['synthetic'] === true &&
        typeof baseData?.['realEdgeId'] === 'string';
      const signature = [
        edge.id,
        edge.source,
        edge.sourceHandle ?? '',
        edge.target,
        edge.targetHandle ?? '',
        edge.subgraphId ?? '',
        typeof baseData?.['realEdgeId'] === 'string'
          ? baseData['realEdgeId']
          : '',
        baseData?.['synthetic'] === true ? '1' : '0',
        uiGradient?.sourceColor ?? '',
        uiGradient?.targetColor ?? '',
      ].join('|');

      const cached = visibleEdgeRenderCacheRef.current.get(edge.id);
      if (
        cached &&
        cached.signature === signature &&
        (cached.baseEdge === edge || isProxyEdge)
      ) {
        nextCache.set(edge.id, cached);
        return cached.edge;
      }

      if (
        currentGradient?.sourceColor === uiGradient?.sourceColor &&
        currentGradient?.targetColor === uiGradient?.targetColor
      ) {
        const nextEntry = { baseEdge: edge, edge, signature };
        nextCache.set(edge.id, nextEntry);
        return edge;
      }

      const nextData = uiGradient
        ? {
            ...(baseData ?? {}),
            uiGradient,
          }
        : baseData;
      const nextEdge =
        nextData === edge.data
          ? edge
          : ({
              ...edge,
              data: nextData,
            } as GraphEdgeWithSubgraph);
      const nextEntry = {
        baseEdge: edge,
        edge: nextEdge,
        signature,
      };

      nextCache.set(edge.id, nextEntry);
      return nextEdge;
    });

    visibleEdgeRenderCacheRef.current = nextCache;
    return nextVisibleEdges;
  }, [handleColorLookup, projection.visibleEdges]);

  const nodeSubgraphByID = useMemo(() => {
    return Object.fromEntries(
      nodes.map(node => [node.id, node.subgraphId ?? null])
    ) as Record<string, string | null>;
  }, [nodes]);

  const edgesByID = useMemo(() => {
    return Object.fromEntries(edges.map(edge => [edge.id, edge])) as Record<
      string,
      GraphEdgeWithSubgraph
    >;
  }, [edges]);

  const subgraphByID = useMemo(
    () =>
      Object.fromEntries(subgraphs.map(subgraph => [subgraph.id, subgraph])),
    [subgraphs]
  );

  const getNodeSize = useCallback(
    (node: CustomNodeType) => {
      const internal = getInternalNode(node.id);
      const style = node.style as React.CSSProperties | undefined;
      const width =
        resolvePositiveSize(internal?.measured?.width) ??
        resolvePositiveSize(node.width) ??
        resolvePositiveSize(style?.width) ??
        DEFAULT_NODE_WIDTH;
      const height =
        resolvePositiveSize(internal?.measured?.height) ??
        resolvePositiveSize(node.height) ??
        resolvePositiveSize(style?.height) ??
        DEFAULT_NODE_HEIGHT;

      return {
        width,
        height,
      };
    },
    [getInternalNode]
  );

  const computePanelLayoutForSubgraph = useCallback(
    (subgraphId: string) => {
      const memberNodes = nodesRef.current.filter(
        node => node.subgraphId === subgraphId
      );

      if (memberNodes.length === 0) {
        const subgraph = subgraphByID[subgraphId];
        return {
          x: subgraph?.position.x ?? 0,
          y: subgraph?.position.y ?? 0,
          width: SUBGRAPH_PANEL_DEFAULT_WIDTH,
          height: SUBGRAPH_PANEL_DEFAULT_HEIGHT,
        };
      }

      const minX = Math.min(...memberNodes.map(node => node.position.x));
      const minY = Math.min(...memberNodes.map(node => node.position.y));
      const maxX = Math.max(
        ...memberNodes.map(node => node.position.x + getNodeSize(node).width)
      );
      const maxY = Math.max(
        ...memberNodes.map(node => node.position.y + getNodeSize(node).height)
      );

      return {
        x: minX - SUBGRAPH_PANEL_PADDING_X,
        y: minY - SUBGRAPH_PANEL_PADDING_TOP,
        width: Math.max(
          maxX - minX + SUBGRAPH_PANEL_PADDING_X * 2,
          SUBGRAPH_PANEL_DEFAULT_WIDTH
        ),
        height: Math.max(
          maxY -
            minY +
            SUBGRAPH_PANEL_PADDING_TOP +
            SUBGRAPH_PANEL_PADDING_BOTTOM,
          SUBGRAPH_PANEL_DEFAULT_HEIGHT
        ),
      };
    },
    [getNodeSize, subgraphByID]
  );

  const getPanelLayout = useCallback(
    (subgraphId: string) =>
      panelLayoutRef.current[subgraphId] ??
      computePanelLayoutForSubgraph(subgraphId),
    [computePanelLayoutForSubgraph]
  );

  const expandPanelByDropEntry = useCallback(
    (
      subgraphID: string,
      side: SubgraphPanelDropSide | null,
      amount: number
    ) => {
      if (!side || amount <= 0) {
        return;
      }

      setPanelLayoutBySubgraphID(current => {
        const baseLayout = current[subgraphID] ?? getPanelLayout(subgraphID);
        const expandedLayout = expandPanelLayoutToEntrySide(
          baseLayout,
          side,
          amount
        );
        if (
          expandedLayout.x === baseLayout.x &&
          expandedLayout.y === baseLayout.y &&
          expandedLayout.width === baseLayout.width &&
          expandedLayout.height === baseLayout.height
        ) {
          return current;
        }

        const next = {
          ...current,
          [subgraphID]: expandedLayout,
        };
        panelLayoutRef.current = next;
        return next;
      });
    },
    [getPanelLayout]
  );

  const refitPanelLayoutToMembers = useCallback(
    (subgraphID: string) => {
      if (draggingPanelSubgraphIDsRef.current.has(subgraphID)) {
        return;
      }
      const memberNodes = nodesRef.current.filter(
        node => node.subgraphId === subgraphID
      );
      if (memberNodes.length === 0) {
        return;
      }

      setPanelLayoutBySubgraphID(current => {
        const baseLayout =
          current[subgraphID] ?? computePanelLayoutForSubgraph(subgraphID);
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const memberNode of memberNodes) {
          const size = getNodeSize(memberNode);
          minX = Math.min(minX, memberNode.position.x);
          minY = Math.min(minY, memberNode.position.y);
          maxX = Math.max(maxX, memberNode.position.x + size.width);
          maxY = Math.max(maxY, memberNode.position.y + size.height);
        }

        const nextX = minX - SUBGRAPH_PANEL_PADDING_X;
        const nextY = minY - SUBGRAPH_PANEL_PADDING_TOP;

        const nextWidth = Math.max(
          maxX - minX + SUBGRAPH_PANEL_PADDING_X * 2,
          SUBGRAPH_PANEL_DEFAULT_WIDTH
        );
        const nextHeight = Math.max(
          maxY -
            minY +
            SUBGRAPH_PANEL_PADDING_TOP +
            SUBGRAPH_PANEL_PADDING_BOTTOM,
          SUBGRAPH_PANEL_DEFAULT_HEIGHT
        );

        if (
          nextX === baseLayout.x &&
          nextY === baseLayout.y &&
          nextWidth === baseLayout.width &&
          nextHeight === baseLayout.height
        ) {
          return current;
        }

        const nextLayoutByID = {
          ...current,
          [subgraphID]: {
            ...baseLayout,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          },
        };
        panelLayoutRef.current = nextLayoutByID;
        return nextLayoutByID;
      });
    },
    [computePanelLayoutForSubgraph, getNodeSize]
  );

  const schedulePanelLayoutRefit = useCallback(
    (subgraphID: string, options?: { deferInitial?: boolean }) => {
      const deferInitial = Boolean(options?.deferInitial);
      const run = () => {
        refitPanelLayoutToMembers(subgraphID);
      };

      const runWithFrames = (framesLeft: number) => {
        run();
        if (framesLeft <= 0) {
          return;
        }
        requestAnimationFrame(() => runWithFrames(framesLeft - 1));
      };

      if (deferInitial) {
        requestAnimationFrame(() => runWithFrames(10));
        return;
      }

      runWithFrames(10);
    },
    [refitPanelLayoutToMembers]
  );

  useEffect(() => {
    setPanelLayoutBySubgraphID(current => {
      let didChange = false;
      const next = { ...current };

      for (const subgraph of subgraphs) {
        if (!subgraph.expanded) {
          continue;
        }

        let layout = next[subgraph.id];
        if (!layout) {
          layout = computePanelLayoutForSubgraph(subgraph.id);
          next[subgraph.id] = layout;
          didChange = true;
        }

        if (!panelEditModeBySubgraphID[subgraph.id]) {
          continue;
        }
        if (draggingMemberSubgraphIDsRef.current.has(subgraph.id)) {
          // While a member node is being dragged, panel bounds are updated directly
          // from the drag handler; skip secondary auto-fit to avoid opposite-side jitter.
          continue;
        }
        if (
          isExtractModifierPressed ||
          extractIntentNodeIDsRef.current.size > 0
        ) {
          // During extract gesture we must not auto-expand panel to dragged members,
          // otherwise node can never leave the panel bounds.
          continue;
        }

        const memberNodes = nodes.filter(
          node => node.subgraphId === subgraph.id
        );
        for (const memberNode of memberNodes) {
          const size = getNodeSize(memberNode);
          const expandedLayout = expandPanelToFitNode(
            layout,
            {
              id: memberNode.id,
              position: memberNode.position,
              width: size.width,
              height: size.height,
            },
            {
              threshold: 0,
              padding: SUBGRAPH_POSITION_PADDING,
            }
          );

          if (
            expandedLayout.x !== layout.x ||
            expandedLayout.y !== layout.y ||
            expandedLayout.width !== layout.width ||
            expandedLayout.height !== layout.height
          ) {
            layout = expandedLayout;
            next[subgraph.id] = expandedLayout;
            didChange = true;
          }
        }
      }

      for (const id of Object.keys(next)) {
        if (!expandedSubgraphIDSet.has(id)) {
          delete next[id];
          didChange = true;
        }
      }

      if (didChange) {
        panelLayoutRef.current = next;
      }

      return didChange ? next : current;
    });
  }, [
    computePanelLayoutForSubgraph,
    expandedSubgraphIDSet,
    getNodeSize,
    isExtractModifierPressed,
    nodes,
    panelEditModeBySubgraphID,
    subgraphs,
  ]);

  useEffect(() => {
    const prevExpanded = prevExpandedSubgraphIDSetRef.current;
    for (const subgraphID of expandedSubgraphIDs) {
      if (!prevExpanded.has(subgraphID)) {
        schedulePanelLayoutRefit(subgraphID);
      }
    }
    prevExpandedSubgraphIDSetRef.current = new Set(expandedSubgraphIDs);
  }, [expandedSubgraphIDs, expandedSubgraphIDsKey, schedulePanelLayoutRefit]);

  useEffect(() => {
    if (nodes.length === 0 || expandedSubgraphIDs.length === 0) {
      return;
    }
    for (const subgraphID of expandedSubgraphIDs) {
      schedulePanelLayoutRefit(subgraphID);
    }
  }, [
    expandedSubgraphIDs,
    expandedSubgraphIDsKey,
    nodes.length,
    schedulePanelLayoutRefit,
  ]);

  useEffect(() => {
    if (!graphLoaded || expandedSubgraphIDs.length === 0) {
      return;
    }
    for (const subgraphID of expandedSubgraphIDs) {
      schedulePanelLayoutRefit(subgraphID);
    }
  }, [
    expandedSubgraphIDs,
    expandedSubgraphIDsKey,
    graphLoaded,
    schedulePanelLayoutRefit,
  ]);

  useEffect(() => {
    setPanelEditModeBySubgraphID(current => {
      let didChange = false;
      const next = { ...current };
      for (const id of Object.keys(next)) {
        if (!expandedSubgraphIDSet.has(id)) {
          delete next[id];
          didChange = true;
        }
      }
      return didChange ? next : current;
    });
  }, [expandedSubgraphIDSet]);

  const resolveRealEdge = useCallback(
    (edge: GraphEdgeWithSubgraph): GraphEdgeWithSubgraph | null => {
      const data = edge.data as { realEdgeId?: string } | undefined;
      const realEdgeId =
        data?.realEdgeId ?? projection.proxyToRealEdgeID[edge.id];
      if (!realEdgeId) {
        return edgesByID[edge.id] ?? edge;
      }
      return edgesByID[realEdgeId] ?? null;
    },
    [edgesByID, projection.proxyToRealEdgeID]
  );

  const {
    onGraphNodesChanges: onGraphNodesChangesRaw,
    onGraphEdgesChanges: onGraphEdgesChangesRaw,
  } = useGraphChanges({
    onGraphNodesChanges: onNodesChanges,
    onGraphEdgesChanges: onEdgesChanges,
  });

  const { createGraphNodes, createGraphEdges, createGraphEntities } =
    useGraphCreates({
      setGraphNodes: setNodes,
      setGraphEdges: setEdges,
      setSubgraphs,
    });

  const { deleteGraphEdges, deleteGraphEntities } = useGraphDeletes({
    setGraphNodes: setNodes,
    setGraphEdges: setEdges,
  });
  const { calculateReconnectionEdges } = useAutoReconnectNodes();
  const { confirm } = useConfirmDialog();
  const { showNotification } = useAlert();
  const { open: openEdgeContextMenu } = useEdgeContextMenuActions();
  const { open: openMultiNodeContextMenu, close: closeMultiNodeContextMenu } =
    useMultiNodeContextMenuActions();

  const handleAutoLayout = useCallback(async () => {
    if (isAutoLayouting || nodesRef.current.length === 0) {
      return;
    }

    const requestID = ++autoLayoutRequestIDRef.current;
    const snapshotNodes = nodesRef.current;
    const snapshotEdges = edgesRef.current;
    const snapshotSubgraphs = subgraphsRef.current;
    const snapshotSignature = createGraphAutoLayoutSignature({
      nodes: snapshotNodes,
      edges: snapshotEdges,
      subgraphs: snapshotSubgraphs,
    });

    const nodeSizesByID = Object.fromEntries(
      snapshotNodes.map(node => [node.id, getNodeSize(node)])
    );
    const collapsedSubgraphSizesByID = Object.fromEntries(
      snapshotSubgraphs.map(subgraph => {
        const internal = getInternalNode(subgraph.id);
        const projectedNode = projection.subgraphNodesByID[subgraph.id];
        const style = projectedNode?.style as React.CSSProperties | undefined;
        return [
          subgraph.id,
          {
            width:
              resolvePositiveSize(internal?.measured?.width) ??
              resolvePositiveSize(projectedNode?.width) ??
              resolvePositiveSize(style?.width) ??
              360,
            height:
              resolvePositiveSize(internal?.measured?.height) ??
              resolvePositiveSize(projectedNode?.height) ??
              resolvePositiveSize(style?.height) ??
              160,
          },
        ];
      })
    );

    setIsAutoLayouting(true);
    try {
      const result = await calculateGraphAutoLayout(
        {
          nodes: snapshotNodes,
          edges: snapshotEdges,
          subgraphs: snapshotSubgraphs,
          nodeSizesByID,
          collapsedSubgraphSizesByID,
        },
        getElkLayoutEngine()
      );

      if (requestID !== autoLayoutRequestIDRef.current) {
        return;
      }

      const currentSignature = createGraphAutoLayoutSignature({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        subgraphs: subgraphsRef.current,
      });
      if (currentSignature !== snapshotSignature) {
        showNotification({
          type: 'warning',
          title: 'Граф изменился во время авторасстановки',
          description: 'Повторите действие для актуального состояния графа.',
          group: 'graph-auto-layout',
        });
        return;
      }

      const nodePositionUpdates = Object.entries(result.nodePositions).map(
        ([nodeID, position]) => ({ nodeID, position })
      );
      const subgraphPatches = Object.entries(result.subgraphPositions).map(
        ([id, position]) => ({ id, position })
      );

      setNodes(current =>
        current.map(node => {
          const position = result.nodePositions[node.id];
          return position ? { ...node, position } : node;
        })
      );
      if (nodePositionUpdates.length > 0) {
        dispatch(updateGraphNodePositions(nodePositionUpdates));
      }

      setSubgraphs(current =>
        current.map(subgraph => {
          const position = result.subgraphPositions[subgraph.id];
          return position ? { ...subgraph, position } : subgraph;
        })
      );
      if (subgraphPatches.length > 0) {
        updateSubgraphs(subgraphPatches);
      }

      setPanelLayoutBySubgraphID(current => {
        const next = {
          ...current,
          ...result.subgraphLayouts,
        };
        panelLayoutRef.current = next;
        return next;
      });

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
      });
      void fitView({ padding: 0.15, duration: 320, maxZoom: 1 }).catch(
        error => {
          console.error('Failed to fit auto-layout view', error);
        }
      );
    } catch (error) {
      console.error('Failed to auto-layout graph', error);
      showNotification({
        type: 'error',
        title: 'Не удалось выполнить авторасстановку',
        description: 'Координаты графа не были изменены.',
        group: 'graph-auto-layout',
      });
    } finally {
      if (requestID === autoLayoutRequestIDRef.current) {
        setIsAutoLayouting(false);
      }
    }
  }, [
    dispatch,
    fitView,
    getInternalNode,
    getNodeSize,
    isAutoLayouting,
    projection.subgraphNodesByID,
    setNodes,
    showNotification,
    updateSubgraphs,
  ]);

  const logMultiNodeContextMenuDebug = useCallback(
    (label: string, payload: Record<string, unknown>) => {
      if (localStorage.getItem(MULTI_NODE_CONTEXT_MENU_DEBUG_FLAG) !== '1') {
        return;
      }

      console.info(`[multi-node-context-menu] ${label}`, payload);
    },
    []
  );
  const closeMultiNodeContextMenuWithDebug = useCallback(
    (label: string, payload: Record<string, unknown> = {}) => {
      logMultiNodeContextMenuDebug(label, payload);
      closeMultiNodeContextMenu();
    },
    [closeMultiNodeContextMenu, logMultiNodeContextMenuDebug]
  );

  const selectedNodeIDsRef = useRef<string[]>([]);
  const copiedNodePayloadRef = useRef<DuplicateClipboardPayload | null>(null);
  const hadMultiSelectionRef = useRef(false);
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: GraphEditorNode[] }) => {
      const regularNodeIDs = selectedNodes
        .filter(
          node =>
            node.type !== 'subgraph' && node.type !== SUBGRAPH_PANEL_NODE_TYPE
        )
        .map(node => node.id);

      selectedNodeIDsRef.current = regularNodeIDs;

      if (regularNodeIDs.length === 1) {
        selectNode(regularNodeIDs[0]);
      } else if (regularNodeIDs.length === 0 && nodeDataModalUI.open) {
        // Keep the side panel bound to the last explicitly opened node.
      } else {
        clearSelectedNode();
        if (nodeDataModalUI.open) {
          nodeDataModalUI.setOpen(false);
        }
      }

      const hasMultiSelection = regularNodeIDs.length >= 2;
      if (!hasMultiSelection && hadMultiSelectionRef.current) {
        closeMultiNodeContextMenuWithDebug('close-from-selection-change', {
          regularNodeIDs,
          hadMultiSelection: hadMultiSelectionRef.current,
        });
      }
      hadMultiSelectionRef.current = hasMultiSelection;
    },
    [
      closeMultiNodeContextMenuWithDebug,
      nodeDataModalUI,
      clearSelectedNode,
      selectNode,
    ]
  );
  useOnSelectionChange<GraphEditorNode, GraphEdgeWithSubgraph>({
    onChange: onSelectionChange,
  });

  const onCreate: OnCreate = useCallback(
    async ({ nodes = [], edges = [], subgraphs = [] }) => {
      await createGraphEntities(nodes, edges, subgraphs);
    },
    [createGraphEntities]
  );

  const resolveEdgeSubgraphId = useCallback(
    (
      edge: GraphEdgeWithSubgraph,
      nodeSubgraphMap: Record<string, string | null | undefined>
    ): string | null => {
      const sourceSubgraphId = nodeSubgraphMap[edge.source] ?? null;
      const targetSubgraphId = nodeSubgraphMap[edge.target] ?? null;
      if (sourceSubgraphId && sourceSubgraphId === targetSubgraphId) {
        return sourceSubgraphId;
      }
      return null;
    },
    []
  );

  const selectOnlyNode = useCallback(
    (nodeID: string) => {
      selectedNodeIDsRef.current = [nodeID];
      setNodes(current =>
        current.map(node => ({
          ...node,
          selected: node.id === nodeID,
        }))
      );
      selectNode(nodeID);
    },
    [selectNode, setNodes]
  );

  const expandDuplicatedNodeSubgraph = useCallback(
    (node: CustomNodeType) => {
      const subgraphID = node.subgraphId ?? null;
      if (!subgraphID || !expandedSubgraphIDSet.has(subgraphID)) {
        return;
      }

      const nodeSize = getNodeSize(node);
      const currentLayout = getPanelLayout(subgraphID);
      const nextLayout = expandPanelToFitNode(currentLayout, {
        id: node.id,
        position: node.position,
        width: nodeSize.width,
        height: nodeSize.height,
      });

      if (
        nextLayout.x === currentLayout.x &&
        nextLayout.y === currentLayout.y &&
        nextLayout.width === currentLayout.width &&
        nextLayout.height === currentLayout.height
      ) {
        return;
      }

      setPanelLayoutBySubgraphID(current => {
        const next = {
          ...current,
          [subgraphID]: nextLayout,
        };
        panelLayoutRef.current = next;
        return next;
      });

      const memberNodeIDSet = new Set([
        ...(projection.memberNodeIDsBySubgraphID[subgraphID] ?? []),
        node.id,
      ]);
      const nodesToShift = nodesRef.current
        .filter(existingNode => !memberNodeIDSet.has(existingNode.id))
        .map(existingNode => {
          const size = getNodeSize(existingNode);
          return {
            id: existingNode.id,
            position: existingNode.position,
            width: size.width,
            height: size.height,
          };
        });

      const shiftedPositions = computePushAwayNodePositions(
        nextLayout,
        nodesToShift
      );
      const shiftedNodeIDs = Object.keys(shiftedPositions);
      if (shiftedNodeIDs.length === 0) {
        return;
      }

      setNodes(current =>
        current.map(existingNode => {
          const nextPosition = shiftedPositions[existingNode.id];
          if (!nextPosition) {
            return existingNode;
          }
          return {
            ...existingNode,
            position: nextPosition,
          };
        })
      );
      dispatch(
        updateGraphNodePositions(
          shiftedNodeIDs.map(nodeID => ({
            nodeID,
            position: shiftedPositions[nodeID],
          }))
        )
      );
    },
    [
      dispatch,
      expandedSubgraphIDSet,
      getNodeSize,
      getPanelLayout,
      projection.memberNodeIDsBySubgraphID,
      setNodes,
    ]
  );

  const duplicateNodeFromPayload = useCallback(
    async (payload: DuplicateClipboardPayload) => {
      const sourceNode = payload.node;
      const sourceSubgraphID = sourceNode.subgraphId ?? null;
      const nodeSize = getNodeSize(sourceNode);
      const occupiedRects = nodesRef.current.map(node => {
        const size = getNodeSize(node);
        return {
          x: node.position.x,
          y: node.position.y,
          width: size.width,
          height: size.height,
        };
      });
      const blockedRects =
        sourceSubgraphID === null
          ? subgraphs
              .filter(subgraph => expandedSubgraphIDSet.has(subgraph.id))
              .map(subgraph => getPanelLayout(subgraph.id))
          : subgraphs
              .filter(
                subgraph =>
                  expandedSubgraphIDSet.has(subgraph.id) &&
                  subgraph.id !== sourceSubgraphID
              )
              .map(subgraph => getPanelLayout(subgraph.id));

      const nextPosition = findNearestFreeNodePosition({
        sourcePosition: sourceNode.position,
        nodeSize,
        occupiedRects,
        blockedRects,
      });

      const nextNodeID = generateShortNodeID();
      const nextNode = cloneNodeForDuplicate(
        sourceNode,
        nextNodeID,
        nextPosition
      );
      nextNode.subgraphId = sourceSubgraphID;

      const nextNodeSubgraphMap = Object.fromEntries(
        nodesRef.current.map(node => [node.id, node.subgraphId ?? null])
      ) as Record<string, string | null | undefined>;
      nextNodeSubgraphMap[nextNodeID] = sourceSubgraphID;

      const duplicatedIncomingEdges = cloneIncomingEdgesForDuplicate(
        payload.incomingEdges,
        nextNodeID,
        generateShortEdgeID,
        edge =>
          resolveEdgeSubgraphId(
            {
              ...edge,
              target: nextNodeID,
            },
            nextNodeSubgraphMap
          )
      );

      await createGraphEntities([nextNode], duplicatedIncomingEdges);
      expandDuplicatedNodeSubgraph(nextNode);
      selectOnlyNode(nextNodeID);
    },
    [
      createGraphEntities,
      expandDuplicatedNodeSubgraph,
      expandedSubgraphIDSet,
      getNodeSize,
      getPanelLayout,
      resolveEdgeSubgraphId,
      selectOnlyNode,
      subgraphs,
    ]
  );

  const duplicateNode = useCallback(
    async (nodeID: string) => {
      const sourceNode = nodesRef.current.find(node => node.id === nodeID);
      if (!sourceNode) {
        return;
      }

      const incomingEdges = edgesRef.current.filter(
        edge => edge.target === nodeID
      );
      await duplicateNodeFromPayload(
        buildDuplicateClipboardPayload(sourceNode, incomingEdges)
      );
    },
    [duplicateNodeFromPayload]
  );

  const showDuplicateSelectionWarning = useCallback(() => {
    showNotification({
      type: 'warning',
      title: 'Невозможно скопировать ноды',
      description:
        'Дублирование через буфер обмена работает только для одной выбранной ноды.',
      group: GRAPH_CLIPBOARD_NOTIFICATION_GROUP,
    });
  }, [showNotification]);

  const applyNodeSubgraphBindings = useCallback(
    (items: { id: string; subgraphId: string | null }[]) => {
      if (items.length === 0) {
        return;
      }

      const bindingByNodeID = new Map(
        items.map(item => [item.id, item.subgraphId] as const)
      );

      setNodes(current =>
        current.map(node => {
          if (!bindingByNodeID.has(node.id)) {
            return node;
          }
          return {
            ...node,
            subgraphId: bindingByNodeID.get(node.id) ?? null,
          };
        })
      );
      bindNodesToSubgraph(items);

      const currentNodeSubgraphMap: Record<string, string | null | undefined> =
        {};
      for (const node of nodesRef.current) {
        currentNodeSubgraphMap[node.id] =
          bindingByNodeID.get(node.id) ?? node.subgraphId ?? null;
      }

      const changedNodeIDSet = new Set(items.map(item => item.id));
      const edgeUpdates = edgesRef.current
        .filter(
          edge =>
            changedNodeIDSet.has(edge.source) ||
            changedNodeIDSet.has(edge.target)
        )
        .map(edge => ({
          id: edge.id,
          subgraphId: resolveEdgeSubgraphId(edge, currentNodeSubgraphMap),
        }))
        .filter(
          update => edgesByID[update.id]?.subgraphId !== update.subgraphId
        );

      if (edgeUpdates.length > 0) {
        const edgeUpdateByID = new Map(
          edgeUpdates.map(update => [update.id, update] as const)
        );
        setEdges(current =>
          current.map(edge => {
            const update = edgeUpdateByID.get(edge.id);
            if (!update) {
              return edge;
            }
            return {
              ...edge,
              subgraphId: update.subgraphId,
            };
          })
        );
        bindEdgesToSubgraph(edgeUpdates);
      }
    },
    [
      bindEdgesToSubgraph,
      bindNodesToSubgraph,
      edgesByID,
      resolveEdgeSubgraphId,
      setEdges,
      setNodes,
    ]
  );

  const createSubgraphFromNodeIDs = useCallback(
    async (nodeIDs: string[]) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const uniqueNodeIDs = Array.from(new Set(nodeIDs));
      const uniqueNodeIDSet = new Set(uniqueNodeIDs);
      const members = currentNodes.filter(node => {
        if (!uniqueNodeIDSet.has(node.id)) {
          return false;
        }
        return !node.subgraphId;
      });

      if (members.length < 2) {
        return;
      }

      const memberIDs = new Set(members.map(node => node.id));
      const subgraphId = generateShortSubgraphID();
      const color = generateRandomSubgraphColor();

      const minX = Math.min(...members.map(node => node.position.x));
      const minY = Math.min(...members.map(node => node.position.y));

      const subgraph: SubgraphUiSchema = {
        id: subgraphId,
        type: 'subgraph',
        position: {
          x: minX - SUBGRAPH_POSITION_PADDING,
          y: minY - SUBGRAPH_POSITION_PADDING,
        },
        selected: false,
        expanded: false,
        data: {
          name: 'Subgraph',
          displayName: 'Subgraph',
          color,
          comment: 'Группа узлов',
        },
      };

      const internalEdgeIDs = new Set(
        currentEdges
          .filter(
            edge => memberIDs.has(edge.source) && memberIDs.has(edge.target)
          )
          .map(edge => edge.id)
      );

      const nodeBindings = members.map(node => ({
        id: node.id,
        subgraphId,
      }));
      const edgeBindings = Array.from(internalEdgeIDs).map(id => ({
        id,
        subgraphId,
      }));

      setSubgraphs(current => [...current, subgraph]);
      setNodes(current =>
        current.map(node =>
          memberIDs.has(node.id)
            ? {
                ...node,
                subgraphId,
                selected: false,
              }
            : node
        )
      );
      setEdges(current =>
        current.map(edge =>
          internalEdgeIDs.has(edge.id)
            ? {
                ...edge,
                subgraphId,
              }
            : edge
        )
      );

      createSubgraphs([subgraph]);
      bindNodesToSubgraph(nodeBindings);
      if (edgeBindings.length > 0) {
        bindEdgesToSubgraph(edgeBindings);
      }
    },
    [
      bindEdgesToSubgraph,
      bindNodesToSubgraph,
      createSubgraphs,
      setEdges,
      setNodes,
    ]
  );

  const deleteSubgraphsByIDs = useCallback(
    async (subgraphIDs: string[]) => {
      const ids = Array.from(new Set(subgraphIDs));
      if (ids.length === 0) {
        return;
      }

      const subgraphIDSet = new Set(ids);
      const subgraphByID = new Map(
        subgraphs.map(subgraph => [subgraph.id, subgraph])
      );
      const shiftedNodePositionsByID = new Map<
        string,
        { x: number; y: number }
      >();

      const nodeBindings = nodes
        .filter(node => node.subgraphId && subgraphIDSet.has(node.subgraphId))
        .map(node => ({ id: node.id, subgraphId: null }));
      const edgeBindings = edges
        .filter(edge => edge.subgraphId && subgraphIDSet.has(edge.subgraphId))
        .map(edge => ({ id: edge.id, subgraphId: null }));

      for (const subgraphId of ids) {
        const subgraph = subgraphByID.get(subgraphId);
        if (!subgraph) {
          continue;
        }

        const memberNodes = nodes.filter(
          node => node.subgraphId === subgraphId
        );
        if (memberNodes.length === 0) {
          continue;
        }

        const anchorX =
          Math.min(...memberNodes.map(node => node.position.x)) -
          SUBGRAPH_POSITION_PADDING;
        const anchorY =
          Math.min(...memberNodes.map(node => node.position.y)) -
          SUBGRAPH_POSITION_PADDING;
        const deltaX = subgraph.position.x - anchorX;
        const deltaY = subgraph.position.y - anchorY;

        if (deltaX === 0 && deltaY === 0) {
          continue;
        }

        for (const node of memberNodes) {
          shiftedNodePositionsByID.set(node.id, {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          });
        }
      }

      const nodePositionUpdates = Array.from(
        shiftedNodePositionsByID.entries()
      ).map(([nodeID, position]) => ({
        nodeID,
        position,
      }));

      setSubgraphs(current =>
        current.filter(subgraph => !subgraphIDSet.has(subgraph.id))
      );
      setPanelLayoutBySubgraphID(current => {
        const next = { ...current };
        for (const id of ids) {
          delete next[id];
        }
        panelLayoutRef.current = next;
        return next;
      });
      setPanelEditModeBySubgraphID(current => {
        const next = { ...current };
        for (const id of ids) {
          delete next[id];
        }
        return next;
      });
      setNodes(current =>
        current.map(node =>
          node.subgraphId && subgraphIDSet.has(node.subgraphId)
            ? {
                ...node,
                subgraphId: null,
                position:
                  shiftedNodePositionsByID.get(node.id) ?? node.position,
              }
            : node
        )
      );
      setEdges(current =>
        current.map(edge =>
          edge.subgraphId && subgraphIDSet.has(edge.subgraphId)
            ? { ...edge, subgraphId: null }
            : edge
        )
      );

      deleteSubgraphs(ids);
      if (nodeBindings.length > 0) {
        bindNodesToSubgraph(nodeBindings);
      }
      if (nodePositionUpdates.length > 0) {
        dispatch(updateGraphNodePositions(nodePositionUpdates));
      }
      if (edgeBindings.length > 0) {
        bindEdgesToSubgraph(edgeBindings);
      }
    },
    [
      bindEdgesToSubgraph,
      bindNodesToSubgraph,
      dispatch,
      deleteSubgraphs,
      edges,
      nodes,
      setEdges,
      setNodes,
      subgraphs,
    ]
  );

  const setSubgraphExpanded = useCallback(
    (subgraphID: string, expanded: boolean) => {
      const subgraph = subgraphByID[subgraphID];
      if (!subgraph) {
        return;
      }
      if (Boolean(subgraph.expanded) === expanded) {
        return;
      }

      let nextPanelLayout = panelLayoutRef.current[subgraphID];
      if (expanded && !nextPanelLayout) {
        nextPanelLayout = computePanelLayoutForSubgraph(subgraphID);
        setPanelLayoutBySubgraphID(current => {
          const next = {
            ...current,
            [subgraphID]: nextPanelLayout!,
          };
          panelLayoutRef.current = next;
          return next;
        });
      }

      if (expanded && nextPanelLayout) {
        const memberNodeIDSet = new Set(
          projection.memberNodeIDsBySubgraphID[subgraphID] ?? []
        );
        const nodesToShift = nodesRef.current
          .filter(node => !memberNodeIDSet.has(node.id))
          .map(node => {
            const size = getNodeSize(node);
            return {
              id: node.id,
              position: node.position,
              width: size.width,
              height: size.height,
            };
          });

        const shiftedPositions = computePushAwayNodePositions(
          nextPanelLayout,
          nodesToShift
        );
        const shiftedNodeIDs = Object.keys(shiftedPositions);
        if (shiftedNodeIDs.length > 0) {
          setNodes(current =>
            current.map(node => {
              const nextPosition = shiftedPositions[node.id];
              if (!nextPosition) {
                return node;
              }
              return {
                ...node,
                position: nextPosition,
              };
            })
          );
          dispatch(
            updateGraphNodePositions(
              shiftedNodeIDs.map(nodeID => ({
                nodeID,
                position: shiftedPositions[nodeID],
              }))
            )
          );
        }
      }

      setSubgraphs(current =>
        current.map(item =>
          item.id === subgraphID ? { ...item, expanded } : item
        )
      );
      updateSubgraphs([{ id: subgraphID, expanded }]);

      if (!expanded) {
        setPanelEditModeBySubgraphID(current => ({
          ...current,
          [subgraphID]: false,
        }));
      }
    },
    [
      computePanelLayoutForSubgraph,
      dispatch,
      getNodeSize,
      projection.memberNodeIDsBySubgraphID,
      setNodes,
      subgraphByID,
      updateSubgraphs,
    ]
  );

  const setSubgraphExpandedRef = useRef(setSubgraphExpanded);
  const deleteSubgraphsByIDsRef = useRef(deleteSubgraphsByIDs);
  const pendingSubgraphColorByIDRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setSubgraphExpandedRef.current = setSubgraphExpanded;
  }, [setSubgraphExpanded]);

  useEffect(() => {
    deleteSubgraphsByIDsRef.current = deleteSubgraphsByIDs;
  }, [deleteSubgraphsByIDs]);

  const toggleSubgraphEditMode = useCallback((subgraphID: string) => {
    setPanelEditModeBySubgraphID(current => ({
      ...current,
      [subgraphID]: !current[subgraphID],
    }));
  }, []);

  const previewSubgraphColorValue = useCallback(
    (subgraphID: string, color: string) => {
      pendingSubgraphColorByIDRef.current.set(subgraphID, color);
      setSubgraphs(current =>
        current.map(item =>
          item.id === subgraphID
            ? {
                ...item,
                data: {
                  ...item.data,
                  color,
                },
              }
            : item
        )
      );
    },
    [setSubgraphs]
  );

  const persistSubgraphColorValue = useCallback(
    (subgraphID: string, explicitColor?: string) => {
      const color =
        explicitColor ?? pendingSubgraphColorByIDRef.current.get(subgraphID);
      if (!color) {
        return;
      }
      const currentSubgraph = subgraphByID[subgraphID];
      if (!currentSubgraph) {
        pendingSubgraphColorByIDRef.current.delete(subgraphID);
        return;
      }
      updateSubgraphs([
        {
          id: subgraphID,
          data: {
            ...currentSubgraph.data,
            color,
          },
        },
      ]);
      pendingSubgraphColorByIDRef.current.delete(subgraphID);
    },
    [subgraphByID, updateSubgraphs]
  );

  const onGraphNodesChanges = useCallback(
    async (changes: NodeChange<GraphEditorNode>[]) => {
      if (
        expandedSubgraphIDSet.size === 0 &&
        changes.length > 0 &&
        changes.every(change => {
          if (!('id' in change) || change.type !== 'position') {
            return false;
          }

          if (
            getSubgraphIDFromPanelNodeID(change.id) ||
            subgraphByID[change.id]
          ) {
            return false;
          }

          const node = nodesRef.current.find(item => item.id === change.id);
          return Boolean(node) && !node?.subgraphId;
        })
      ) {
        setDropTargetPreviewSafe(null);
        await onGraphNodesChangesRaw(changes as NodeChange<CustomNodeType>[]);
        return;
      }

      const regularChanges: NodeChange<CustomNodeType>[] = [];
      const localSubgraphPatches: (Partial<SubgraphUiSchema> & {
        id: string;
      })[] = [];
      const persistedSubgraphPatches: (Partial<SubgraphUiSchema> & {
        id: string;
      })[] = [];
      const nodeBindingUpdatesByID = new Map<string, string | null>();
      const memberMoveDeltaBySubgraphID = new Map<
        string,
        { dx: number; dy: number }
      >();
      const memberPersistDeltaBySubgraphID = new Map<
        string,
        { dx: number; dy: number }
      >();
      const subgraphsToPersistMovedMembers = new Set<string>();
      const autoEnableEditModeForSubgraphs = new Set<string>();
      const dimensionChangedSubgraphIDs = new Set<string>();
      const dropRefitSubgraphIDs = new Set<string>();
      const bindingChangedRefitSubgraphIDs = new Set<string>();
      const skipBindingRefitForSubgraphIDs = new Set<string>();
      const dropEntryExpandBySubgraphID = new Map<
        string,
        Record<SubgraphPanelDropSide, number>
      >();
      const dragHoverVotesBySubgraphID = new Map<
        string,
        {
          count: number;
          side: SubgraphPanelDropSide | null;
        }
      >();
      let hasRegularNodePositionChanges = false;
      let nextPanelLayoutByID: SubgraphPanelLayoutMap = panelLayoutRef.current;
      let didUpdatePanelLayout = false;
      const restoreEntryExpandedLayout = (
        entry: DragEntryExpansion | undefined
      ) => {
        if (!entry) {
          return;
        }
        const currentLayout =
          nextPanelLayoutByID[entry.subgraphId] ??
          computePanelLayoutForSubgraph(entry.subgraphId);
        if (
          currentLayout.x === entry.previousLayout.x &&
          currentLayout.y === entry.previousLayout.y &&
          currentLayout.width === entry.previousLayout.width &&
          currentLayout.height === entry.previousLayout.height
        ) {
          return;
        }
        nextPanelLayoutByID = {
          ...nextPanelLayoutByID,
          [entry.subgraphId]: entry.previousLayout,
        };
        didUpdatePanelLayout = true;
      };

      const nodeByID = new Map(nodesRef.current.map(node => [node.id, node]));
      const expandedSubgraphIDs = subgraphs
        .filter(item => Boolean(item.expanded))
        .map(item => item.id);

      for (const change of changes) {
        if (!('id' in change)) {
          regularChanges.push(change as NodeChange<CustomNodeType>);
          continue;
        }

        const panelSubgraphID = getSubgraphIDFromPanelNodeID(change.id);
        if (panelSubgraphID) {
          if (change.type === 'select') {
            const patch = {
              id: panelSubgraphID,
              selected: Boolean(change.selected),
            };
            localSubgraphPatches.push(patch);
            persistedSubgraphPatches.push(patch);
            continue;
          }

          if (change.type !== 'position') {
            continue;
          }

          const nextPosition = change.position ?? change.positionAbsolute;
          if (!nextPosition) {
            continue;
          }

          if (change.dragging) {
            draggingPanelSubgraphIDsRef.current.add(panelSubgraphID);
          } else {
            draggingPanelSubgraphIDsRef.current.delete(panelSubgraphID);
          }

          const prevLayout =
            nextPanelLayoutByID[panelSubgraphID] ??
            computePanelLayoutForSubgraph(panelSubgraphID);
          const prevPosition = panelDragLastPositionBySubgraphIDRef.current.get(
            panelSubgraphID
          ) ?? {
            x: prevLayout.x,
            y: prevLayout.y,
          };
          const dx = nextPosition.x - prevPosition.x;
          const dy = nextPosition.y - prevPosition.y;
          panelDragLastPositionBySubgraphIDRef.current.set(panelSubgraphID, {
            x: nextPosition.x,
            y: nextPosition.y,
          });

          if (dx !== 0 || dy !== 0) {
            nextPanelLayoutByID = {
              ...nextPanelLayoutByID,
              [panelSubgraphID]: {
                ...prevLayout,
                x: nextPosition.x,
                y: nextPosition.y,
              },
            };
            didUpdatePanelLayout = true;
            memberMoveDeltaBySubgraphID.set(panelSubgraphID, { dx, dy });
          }

          if (change.dragging) {
            if (dx !== 0 || dy !== 0) {
              const currentAccumulated =
                panelDragAccumulatedDeltaBySubgraphIDRef.current.get(
                  panelSubgraphID
                ) ?? {
                  dx: 0,
                  dy: 0,
                };
              panelDragAccumulatedDeltaBySubgraphIDRef.current.set(
                panelSubgraphID,
                {
                  dx: currentAccumulated.dx + dx,
                  dy: currentAccumulated.dy + dy,
                }
              );
            }
          } else {
            const accumulated =
              panelDragAccumulatedDeltaBySubgraphIDRef.current.get(
                panelSubgraphID
              ) ?? {
                dx: 0,
                dy: 0,
              };
            const totalDx = accumulated.dx + dx;
            const totalDy = accumulated.dy + dy;
            if (totalDx !== 0 || totalDy !== 0) {
              subgraphsToPersistMovedMembers.add(panelSubgraphID);
              // Persist uses current nodesRef positions plus pending delta
              // from this specific change cycle (not full drag delta).
              memberPersistDeltaBySubgraphID.set(panelSubgraphID, { dx, dy });
            }
            panelDragAccumulatedDeltaBySubgraphIDRef.current.delete(
              panelSubgraphID
            );
            panelDragLastPositionBySubgraphIDRef.current.delete(
              panelSubgraphID
            );
          }

          const subgraphPositionPatch = {
            id: panelSubgraphID,
            position: { x: nextPosition.x, y: nextPosition.y },
          };
          localSubgraphPatches.push(subgraphPositionPatch);
          if (!change.dragging) {
            persistedSubgraphPatches.push(subgraphPositionPatch);
          }
          continue;
        }

        const subgraph = subgraphByID[change.id];
        if (!subgraph) {
          if (change.type === 'dimensions') {
            const changedNode = nodeByID.get(change.id);
            const subgraphID = changedNode?.subgraphId ?? null;
            if (subgraphID && expandedSubgraphIDSet.has(subgraphID)) {
              dimensionChangedSubgraphIDs.add(subgraphID);
            }
          }

          if (change.type === 'position') {
            const nextPosition =
              change.position ??
              change.positionAbsolute ??
              (!change.dragging ? getNode(change.id)?.position : null) ??
              null;
            const node = nodeByID.get(change.id);
            if (nextPosition && node) {
              hasRegularNodePositionChanges = true;
              const currentSubgraphID = node.subgraphId ?? null;
              const size = getNodeSize(node);

              if (change.dragging) {
                if (extractModifierPressedRef.current) {
                  // Extract intent should stay sticky for the whole drag gesture.
                  extractIntentNodeIDsRef.current.add(change.id);
                }
                if (
                  currentSubgraphID &&
                  expandedSubgraphIDs.includes(currentSubgraphID) &&
                  panelEditModeBySubgraphID[currentSubgraphID]
                ) {
                  draggingMemberSubgraphIDsRef.current.add(currentSubgraphID);
                }
                const nextNodeRect = {
                  x: nextPosition.x,
                  y: nextPosition.y,
                  width: size.width,
                  height: size.height,
                };
                const prevNodeRect = {
                  x: node.position.x,
                  y: node.position.y,
                  width: size.width,
                  height: size.height,
                };
                const previousCenter = {
                  x: node.position.x + size.width / 2,
                  y: node.position.y + size.height / 2,
                };
                const nextCenter = {
                  x: nextPosition.x + size.width / 2,
                  y: nextPosition.y + size.height / 2,
                };
                let bestHoverPreview: SubgraphDropTargetPreview | null = null;
                let bestEntryPreview: SubgraphDropTargetPreview | null = null;
                let bestIntersectionArea = 0;
                let bestEntryIntersectionArea = 0;

                for (const candidateSubgraphID of expandedSubgraphIDs) {
                  if (candidateSubgraphID === currentSubgraphID) {
                    continue;
                  }
                  const layout =
                    nextPanelLayoutByID[candidateSubgraphID] ??
                    computePanelLayoutForSubgraph(candidateSubgraphID);
                  if (!rectIntersects(nextNodeRect, layout)) {
                    continue;
                  }
                  const didIntersectBefore = rectIntersects(
                    prevNodeRect,
                    layout
                  );

                  const overlapWidth =
                    Math.min(
                      nextNodeRect.x + nextNodeRect.width,
                      layout.x + layout.width
                    ) - Math.max(nextNodeRect.x, layout.x);
                  const overlapHeight =
                    Math.min(
                      nextNodeRect.y + nextNodeRect.height,
                      layout.y + layout.height
                    ) - Math.max(nextNodeRect.y, layout.y);
                  if (overlapWidth <= 0 || overlapHeight <= 0) {
                    continue;
                  }

                  const intersectionArea = overlapWidth * overlapHeight;
                  if (intersectionArea <= bestIntersectionArea) {
                    continue;
                  }

                  bestIntersectionArea = intersectionArea;
                  const nextPreview = {
                    subgraphId: candidateSubgraphID,
                    side: resolveEntrySideFromPoints(
                      previousCenter,
                      nextCenter,
                      layout
                    ),
                  };
                  bestHoverPreview = nextPreview;

                  if (
                    !didIntersectBefore &&
                    intersectionArea > bestEntryIntersectionArea
                  ) {
                    bestEntryIntersectionArea = intersectionArea;
                    bestEntryPreview = nextPreview;
                  }
                }

                if (bestHoverPreview) {
                  dragEntryPreviewByNodeIDRef.current.set(
                    change.id,
                    bestHoverPreview
                  );
                  const vote = dragHoverVotesBySubgraphID.get(
                    bestHoverPreview.subgraphId
                  );
                  dragHoverVotesBySubgraphID.set(bestHoverPreview.subgraphId, {
                    count: (vote?.count ?? 0) + 1,
                    side: vote?.side ?? bestHoverPreview.side,
                  });

                  const appliedExpansion =
                    dragEntryExpansionByNodeIDRef.current.get(change.id);
                  if (
                    appliedExpansion &&
                    bestEntryPreview &&
                    appliedExpansion.subgraphId !== bestEntryPreview.subgraphId
                  ) {
                    restoreEntryExpandedLayout(appliedExpansion);
                    dragEntryExpansionByNodeIDRef.current.delete(change.id);
                  }
                  const activeAppliedExpansion =
                    dragEntryExpansionByNodeIDRef.current.get(change.id);
                  const shouldApplyEntryExpansion =
                    Boolean(bestEntryPreview?.side) && !activeAppliedExpansion;
                  if (shouldApplyEntryExpansion && bestEntryPreview?.side) {
                    const targetLayout =
                      nextPanelLayoutByID[bestEntryPreview.subgraphId] ??
                      computePanelLayoutForSubgraph(
                        bestEntryPreview.subgraphId
                      );
                    const entryExpandAmount = resolveDropEntryExpandAmount(
                      bestEntryPreview.side,
                      size
                    );
                    const expandedByEntryLayout = expandPanelLayoutToEntrySide(
                      targetLayout,
                      bestEntryPreview.side,
                      entryExpandAmount
                    );
                    if (
                      expandedByEntryLayout.x !== targetLayout.x ||
                      expandedByEntryLayout.y !== targetLayout.y ||
                      expandedByEntryLayout.width !== targetLayout.width ||
                      expandedByEntryLayout.height !== targetLayout.height
                    ) {
                      nextPanelLayoutByID = {
                        ...nextPanelLayoutByID,
                        [bestEntryPreview.subgraphId]: expandedByEntryLayout,
                      };
                      didUpdatePanelLayout = true;
                    }
                    dragEntryExpansionByNodeIDRef.current.set(change.id, {
                      subgraphId: bestEntryPreview.subgraphId,
                      previousLayout: targetLayout,
                    });
                  }
                } else {
                  const appliedExpansion =
                    dragEntryExpansionByNodeIDRef.current.get(change.id);
                  restoreEntryExpandedLayout(appliedExpansion);
                  dragEntryPreviewByNodeIDRef.current.delete(change.id);
                  dragEntryExpansionByNodeIDRef.current.delete(change.id);
                }
              } else if (currentSubgraphID) {
                draggingMemberSubgraphIDsRef.current.delete(currentSubgraphID);
              }

              const isExtractIntent =
                extractModifierPressedRef.current ||
                extractIntentNodeIDsRef.current.has(change.id);

              if (
                change.dragging &&
                currentSubgraphID &&
                expandedSubgraphIDs.includes(currentSubgraphID) &&
                panelEditModeBySubgraphID[currentSubgraphID] &&
                !isExtractIntent
              ) {
                const layout =
                  nextPanelLayoutByID[currentSubgraphID] ??
                  computePanelLayoutForSubgraph(currentSubgraphID);
                const expandedLayout = expandPanelToFitNode(
                  layout,
                  {
                    id: node.id,
                    position: { x: nextPosition.x, y: nextPosition.y },
                    width: size.width,
                    height: size.height,
                  },
                  { threshold: 36, padding: 72 }
                );

                if (
                  expandedLayout.x !== layout.x ||
                  expandedLayout.y !== layout.y ||
                  expandedLayout.width !== layout.width ||
                  expandedLayout.height !== layout.height
                ) {
                  nextPanelLayoutByID = {
                    ...nextPanelLayoutByID,
                    [currentSubgraphID]: expandedLayout,
                  };
                  didUpdatePanelLayout = true;
                }
              }

              if (!change.dragging) {
                const dragEntryPreview =
                  dragEntryPreviewByNodeIDRef.current.get(change.id) ?? null;
                const appliedEntryExpansion =
                  dragEntryExpansionByNodeIDRef.current.get(change.id);
                const shouldExtract = isExtractIntent;
                const nodeRect = {
                  left: nextPosition.x,
                  top: nextPosition.y,
                  right: nextPosition.x + size.width,
                  bottom: nextPosition.y + size.height,
                };
                const center = {
                  x: nextPosition.x + size.width / 2,
                  y: nextPosition.y + size.height / 2,
                };
                const nodeRectAsRect = {
                  x: nodeRect.left,
                  y: nodeRect.top,
                  width: size.width,
                  height: size.height,
                };
                const isNodeInsidePanelBounds = (
                  layout: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                  },
                  margin = 8
                ) =>
                  nodeRect.left >= layout.x + margin &&
                  nodeRect.right <= layout.x + layout.width - margin &&
                  nodeRect.top >= layout.y + margin &&
                  nodeRect.bottom <= layout.y + layout.height - margin;

                let hoveredExpandedSubgraphID: string | null = null;
                let bestIntersectionArea = 0;
                for (const candidateSubgraphID of expandedSubgraphIDs) {
                  const layout =
                    nextPanelLayoutByID[candidateSubgraphID] ??
                    computePanelLayoutForSubgraph(candidateSubgraphID);
                  if (
                    candidateSubgraphID === currentSubgraphID &&
                    shouldExtract
                  ) {
                    if (isNodeInsidePanelBounds(layout, 12)) {
                      hoveredExpandedSubgraphID = candidateSubgraphID;
                      break;
                    }
                    continue;
                  }

                  if (pointInRect(center, layout, 8)) {
                    hoveredExpandedSubgraphID = candidateSubgraphID;
                    break;
                  }

                  if (!rectIntersects(nodeRectAsRect, layout)) {
                    continue;
                  }

                  const overlapWidth =
                    Math.min(
                      nodeRectAsRect.x + nodeRectAsRect.width,
                      layout.x + layout.width
                    ) - Math.max(nodeRectAsRect.x, layout.x);
                  const overlapHeight =
                    Math.min(
                      nodeRectAsRect.y + nodeRectAsRect.height,
                      layout.y + layout.height
                    ) - Math.max(nodeRectAsRect.y, layout.y);
                  if (overlapWidth <= 0 || overlapHeight <= 0) {
                    continue;
                  }

                  const intersectionArea = overlapWidth * overlapHeight;
                  if (intersectionArea > bestIntersectionArea) {
                    bestIntersectionArea = intersectionArea;
                    hoveredExpandedSubgraphID = candidateSubgraphID;
                  }
                }

                const currentBinding = currentSubgraphID;
                let nextBinding = currentBinding;

                if (
                  hoveredExpandedSubgraphID &&
                  hoveredExpandedSubgraphID !== currentBinding
                ) {
                  nextBinding = hoveredExpandedSubgraphID;
                  autoEnableEditModeForSubgraphs.add(hoveredExpandedSubgraphID);
                } else if (
                  currentBinding &&
                  !hoveredExpandedSubgraphID &&
                  shouldExtract
                ) {
                  nextBinding = null;
                }

                if (nextBinding !== currentBinding) {
                  nodeBindingUpdatesByID.set(node.id, nextBinding);
                  let entrySide: SubgraphPanelDropSide | null = null;
                  if (
                    nextBinding &&
                    dragEntryPreview?.subgraphId === nextBinding &&
                    dragEntryPreview.side
                  ) {
                    entrySide = dragEntryPreview.side;
                  } else if (nextBinding) {
                    const nextBindingLayout =
                      nextPanelLayoutByID[nextBinding] ??
                      computePanelLayoutForSubgraph(nextBinding);
                    entrySide = resolveNearestPanelSide(
                      center,
                      nextBindingLayout
                    );
                  }

                  if (nextBinding && entrySide) {
                    const alreadyExpandedByEntryDuringDrag =
                      appliedEntryExpansion?.subgraphId === nextBinding;
                    if (alreadyExpandedByEntryDuringDrag) {
                      skipBindingRefitForSubgraphIDs.add(nextBinding);
                    }

                    const currentEntryExpand = dropEntryExpandBySubgraphID.get(
                      nextBinding
                    ) ?? {
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                    };
                    if (!alreadyExpandedByEntryDuringDrag) {
                      const entryExpandAmount = resolveDropEntryExpandAmount(
                        entrySide,
                        size
                      );
                      currentEntryExpand[entrySide] = Math.max(
                        currentEntryExpand[entrySide],
                        entryExpandAmount
                      );
                      dropEntryExpandBySubgraphID.set(
                        nextBinding,
                        currentEntryExpand
                      );
                      skipBindingRefitForSubgraphIDs.add(nextBinding);
                    }
                  }

                  if (
                    currentBinding &&
                    expandedSubgraphIDSet.has(currentBinding)
                  ) {
                    bindingChangedRefitSubgraphIDs.add(currentBinding);
                  }
                  if (
                    nextBinding &&
                    expandedSubgraphIDSet.has(nextBinding) &&
                    !skipBindingRefitForSubgraphIDs.has(nextBinding)
                  ) {
                    bindingChangedRefitSubgraphIDs.add(nextBinding);
                  }
                }
                if (
                  currentSubgraphID &&
                  expandedSubgraphIDSet.has(currentSubgraphID) &&
                  panelEditModeBySubgraphID[currentSubgraphID] &&
                  !shouldExtract
                ) {
                  dropRefitSubgraphIDs.add(currentSubgraphID);
                }

                const extractedFromCurrentSubgraph =
                  currentBinding !== null && nextBinding === null;
                if (
                  appliedEntryExpansion &&
                  nextBinding !== appliedEntryExpansion.subgraphId
                ) {
                  restoreEntryExpandedLayout(appliedEntryExpansion);
                }
                if (shouldExtract && extractedFromCurrentSubgraph) {
                  // Keep extract mode one extra frame to prevent panel auto-fit
                  // from expanding width before the binding update is applied.
                  requestAnimationFrame(() => {
                    extractIntentNodeIDsRef.current.delete(change.id);
                  });
                } else {
                  extractIntentNodeIDsRef.current.delete(change.id);
                }
                dragEntryPreviewByNodeIDRef.current.delete(change.id);
                dragEntryExpansionByNodeIDRef.current.delete(change.id);
              }
            }
          }

          regularChanges.push(change as NodeChange<CustomNodeType>);
          continue;
        }

        if (change.type === 'position') {
          const nextPosition = change.position ?? change.positionAbsolute;
          if (!nextPosition) {
            continue;
          }
          const prevPosition =
            subgraphDragLastPositionByIDRef.current.get(change.id) ??
            subgraph.position;
          const dx = nextPosition.x - prevPosition.x;
          const dy = nextPosition.y - prevPosition.y;
          subgraphDragLastPositionByIDRef.current.set(change.id, {
            x: nextPosition.x,
            y: nextPosition.y,
          });

          if (change.dragging) {
            if (dx !== 0 || dy !== 0) {
              const currentAccumulated =
                subgraphDragAccumulatedDeltaByIDRef.current.get(change.id) ?? {
                  dx: 0,
                  dy: 0,
                };
              subgraphDragAccumulatedDeltaByIDRef.current.set(change.id, {
                dx: currentAccumulated.dx + dx,
                dy: currentAccumulated.dy + dy,
              });
            }
          } else {
            const accumulated = subgraphDragAccumulatedDeltaByIDRef.current.get(
              change.id
            ) ?? {
              dx: 0,
              dy: 0,
            };
            const totalDx = accumulated.dx + dx;
            const totalDy = accumulated.dy + dy;
            if (totalDx !== 0 || totalDy !== 0) {
              subgraphsToPersistMovedMembers.add(change.id);
              memberMoveDeltaBySubgraphID.set(change.id, {
                dx: totalDx,
                dy: totalDy,
              });
              memberPersistDeltaBySubgraphID.set(change.id, {
                dx: totalDx,
                dy: totalDy,
              });
            }
            subgraphDragAccumulatedDeltaByIDRef.current.delete(change.id);
            subgraphDragLastPositionByIDRef.current.delete(change.id);
          }

          const patch = {
            id: change.id,
            position: { x: nextPosition.x, y: nextPosition.y },
          };
          localSubgraphPatches.push(patch);
          if (!change.dragging) {
            persistedSubgraphPatches.push(patch);
          }
          continue;
        }

        if (change.type === 'select') {
          const patch = {
            id: change.id,
            selected: Boolean(change.selected),
          };
          localSubgraphPatches.push(patch);
          persistedSubgraphPatches.push(patch);
        }
      }

      if (hasRegularNodePositionChanges) {
        let nextPreview: SubgraphDropTargetPreview | null = null;
        let bestVoteCount = 0;
        for (const [subgraphId, vote] of dragHoverVotesBySubgraphID) {
          if (vote.count <= 0) {
            continue;
          }
          if (vote.count > bestVoteCount) {
            bestVoteCount = vote.count;
            nextPreview = {
              subgraphId,
              side: vote.side,
            };
          }
        }
        setDropTargetPreviewSafe(nextPreview);
      }

      if (memberMoveDeltaBySubgraphID.size > 0) {
        setNodes(current =>
          current.map(node => {
            const subgraphID = node.subgraphId ?? null;
            if (!subgraphID) {
              return node;
            }
            const delta = memberMoveDeltaBySubgraphID.get(subgraphID);
            if (!delta) {
              return node;
            }
            return {
              ...node,
              position: {
                x: node.position.x + delta.dx,
                y: node.position.y + delta.dy,
              },
            };
          })
        );
      }

      const persistedNodePositionUpdates: {
        nodeID: string;
        position: { x: number; y: number };
      }[] = [];
      for (const subgraphID of subgraphsToPersistMovedMembers) {
        const delta = memberPersistDeltaBySubgraphID.get(subgraphID) ?? {
          dx: 0,
          dy: 0,
        };
        for (const node of nodesRef.current) {
          if (node.subgraphId !== subgraphID) {
            continue;
          }
          persistedNodePositionUpdates.push({
            nodeID: node.id,
            position: {
              x: node.position.x + delta.dx,
              y: node.position.y + delta.dy,
            },
          });
        }
      }

      if (persistedNodePositionUpdates.length > 0) {
        dispatch(updateGraphNodePositions(persistedNodePositionUpdates));
      }

      if (dropEntryExpandBySubgraphID.size > 0) {
        for (const [subgraphID, expandBySide] of dropEntryExpandBySubgraphID) {
          const currentLayout =
            nextPanelLayoutByID[subgraphID] ??
            computePanelLayoutForSubgraph(subgraphID);
          let expandedLayout = currentLayout;

          for (const side of ['left', 'right', 'top', 'bottom'] as const) {
            const amount = expandBySide[side] ?? 0;
            if (amount <= 0) {
              continue;
            }
            expandedLayout = expandPanelLayoutToEntrySide(
              expandedLayout,
              side,
              amount
            );
          }

          if (
            expandedLayout.x === currentLayout.x &&
            expandedLayout.y === currentLayout.y &&
            expandedLayout.width === currentLayout.width &&
            expandedLayout.height === currentLayout.height
          ) {
            continue;
          }

          nextPanelLayoutByID = {
            ...nextPanelLayoutByID,
            [subgraphID]: expandedLayout,
          };
          didUpdatePanelLayout = true;
        }
      }

      if (didUpdatePanelLayout) {
        panelLayoutRef.current = nextPanelLayoutByID;
        setPanelLayoutBySubgraphID(nextPanelLayoutByID);
      }

      if (regularChanges.length > 0) {
        await onGraphNodesChangesRaw(regularChanges);
      }

      if (nodeBindingUpdatesByID.size > 0) {
        applyNodeSubgraphBindings(
          Array.from(nodeBindingUpdatesByID.entries()).map(
            ([id, subgraphId]) => ({
              id,
              subgraphId,
            })
          )
        );
      }

      const subgraphIDsToRefit = new Set<string>([
        ...dimensionChangedSubgraphIDs,
        ...dropRefitSubgraphIDs,
        ...bindingChangedRefitSubgraphIDs,
      ]);
      for (const subgraphID of skipBindingRefitForSubgraphIDs) {
        subgraphIDsToRefit.delete(subgraphID);
      }
      if (
        subgraphIDsToRefit.size > 0 &&
        draggingPanelSubgraphIDsRef.current.size === 0 &&
        draggingMemberSubgraphIDsRef.current.size === 0
      ) {
        for (const subgraphID of subgraphIDsToRefit) {
          schedulePanelLayoutRefit(subgraphID, {
            deferInitial: bindingChangedRefitSubgraphIDs.has(subgraphID),
          });
        }
      }

      if (autoEnableEditModeForSubgraphs.size > 0) {
        setPanelEditModeBySubgraphID(current => {
          const next = { ...current };
          for (const id of autoEnableEditModeForSubgraphs) {
            next[id] = true;
          }
          return next;
        });
      }

      if (localSubgraphPatches.length > 0) {
        const patchesByID = new Map(
          localSubgraphPatches.map(patch => [patch.id, patch])
        );

        setSubgraphs(current =>
          current.map(subgraph => {
            const patch = patchesByID.get(subgraph.id);
            if (!patch) {
              return subgraph;
            }
            return {
              ...subgraph,
              ...patch,
              data: patch.data
                ? {
                    ...subgraph.data,
                    ...patch.data,
                  }
                : subgraph.data,
            };
          })
        );
      }

      if (persistedSubgraphPatches.length > 0) {
        updateSubgraphs(persistedSubgraphPatches);
      }
    },
    [
      applyNodeSubgraphBindings,
      computePanelLayoutForSubgraph,
      dispatch,
      getNode,
      getNodeSize,
      onGraphNodesChangesRaw,
      panelEditModeBySubgraphID,
      schedulePanelLayoutRefit,
      expandedSubgraphIDSet,
      setDropTargetPreviewSafe,
      setNodes,
      setSubgraphs,
      subgraphByID,
      subgraphs,
      updateSubgraphs,
    ]
  );

  const onGraphEdgesChanges = useCallback(
    async (changes: EdgeChange<GraphEdgeWithSubgraph>[]) => {
      const realChanges = changes.map(change => {
        if (!('id' in change)) {
          return change;
        }

        const realEdgeId = projection.proxyToRealEdgeID[change.id];
        if (!realEdgeId) {
          return change;
        }

        if (change.type === 'replace' && 'item' in change) {
          return {
            ...change,
            id: realEdgeId,
            item: {
              ...change.item,
              id: realEdgeId,
            },
          } as EdgeChange<GraphEdgeWithSubgraph>;
        }

        return {
          ...change,
          id: realEdgeId,
        } as EdgeChange<GraphEdgeWithSubgraph>;
      });

      if (realChanges.length === 0) {
        return;
      }

      await onGraphEdgesChangesRaw(realChanges as EdgeChange<Edge>[]);
    },
    [onGraphEdgesChangesRaw, projection.proxyToRealEdgeID]
  );

  const tryOpenMultiNodeContextMenu = useCallback(
    (position: { x: number; y: number }, explicitNodeIDs?: string[]) => {
      const nodeIDs = explicitNodeIDs ?? selectedNodeIDsRef.current;
      if (nodeIDs.length < 2) {
        logMultiNodeContextMenuDebug('skip-open-too-few-nodes', {
          explicitNodeIDs,
          selectedNodeIDsRef: selectedNodeIDsRef.current,
        });
        return false;
      }

      logMultiNodeContextMenuDebug('open', {
        position,
        nodeIDs,
      });
      lockContextMenuInteractions();
      setPaneMenu(null);
      suppressMoveStartCloseForHandleMenuRef.current = false;
      setHandleMenu(null);
      setSubgraphMenu(null);
      openMultiNodeContextMenu({
        position,
        nodeIDs,
      });
      return true;
    },
    [
      lockContextMenuInteractions,
      logMultiNodeContextMenuDebug,
      openMultiNodeContextMenu,
    ]
  );

  const getSelectedNodeIDsSnapshot = useCallback(() => {
    const selectedFromDOM = Array.from(
      reactFlowWrapper.current?.querySelectorAll(
        '.react-flow__node.selected'
      ) ?? []
    )
      .map(node => node.getAttribute('data-id'))
      .filter((nodeID): nodeID is string => Boolean(nodeID));

    if (selectedFromDOM.length >= 2) {
      return selectedFromDOM;
    }

    if (selectedNodeIDsRef.current.length >= 2) {
      return selectedNodeIDsRef.current;
    }

    const selectedFromNodes = nodesRef.current
      .filter(node => Boolean(node.selected))
      .map(node => node.id);

    return selectedFromNodes;
  }, []);

  // --- Handlers for Pane Context Menu ---

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.react-flow__node, .react-flow__handle')) {
        return;
      }

      event.preventDefault();
      if (suppressNextPaneContextMenuRef.current) {
        suppressNextPaneContextMenuRef.current = false;
        return;
      }

      const handledByMultiNodeMenu = tryOpenMultiNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
      if (handledByMultiNodeMenu) {
        return;
      }

      // Устанавливаем позицию меню точно под курсором
      setSubgraphMenu(null);
      openPaneMenu({
        top: event.clientY,
        left: event.clientX,
      });
    },
    [openPaneMenu, tryOpenMultiNodeContextMenu]
  );

  const getSelectionRectInWrapper = useCallback(
    (start: ScreenPoint, end: ScreenPoint): SelectionRect | null => {
      const wrapperRect = reactFlowWrapper.current?.getBoundingClientRect();
      if (!wrapperRect) return null;

      const left = Math.min(start.x, end.x) - wrapperRect.left;
      const top = Math.min(start.y, end.y) - wrapperRect.top;
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      return { left, top, width, height };
    },
    []
  );

  const applyRightMouseSelection = useCallback(
    (start: ScreenPoint, end: ScreenPoint) => {
      const flowStart = screenToFlowPosition({ x: start.x, y: start.y });
      const flowEnd = screenToFlowPosition({ x: end.x, y: end.y });

      const minX = Math.min(flowStart.x, flowEnd.x);
      const maxX = Math.max(flowStart.x, flowEnd.x);
      const minY = Math.min(flowStart.y, flowEnd.y);
      const maxY = Math.max(flowStart.y, flowEnd.y);

      setNodes(currentNodes =>
        currentNodes.map(node => {
          const internal = getInternalNode(node.id);
          const position =
            internal?.internals?.positionAbsolute ?? node.position;
          const width = internal?.measured?.width ?? node.width ?? 0;
          const height = internal?.measured?.height ?? node.height ?? 0;

          const nodeMinX = position.x;
          const nodeMaxX = position.x + width;
          const nodeMinY = position.y;
          const nodeMaxY = position.y + height;

          const intersects =
            nodeMaxX >= minX &&
            nodeMinX <= maxX &&
            nodeMaxY >= minY &&
            nodeMinY <= maxY;

          if (node.selected === intersects) {
            return node;
          }

          return {
            ...node,
            selected: intersects,
          };
        })
      );

      setSubgraphs(currentSubgraphs =>
        currentSubgraphs.map(subgraph => {
          const internal = getInternalNode(subgraph.id);
          const position =
            internal?.internals?.positionAbsolute ?? subgraph.position;
          const width = internal?.measured?.width ?? 0;
          const height = internal?.measured?.height ?? 0;

          const nodeMinX = position.x;
          const nodeMaxX = position.x + width;
          const nodeMinY = position.y;
          const nodeMaxY = position.y + height;

          const intersects =
            nodeMaxX >= minX &&
            nodeMinX <= maxX &&
            nodeMaxY >= minY &&
            nodeMinY <= maxY;

          if (Boolean(subgraph.selected) === intersects) {
            return subgraph;
          }

          return {
            ...subgraph,
            selected: intersects,
          };
        })
      );
    },
    [getInternalNode, screenToFlowPosition, setNodes]
  );

  const captureMultiSelectionContextMenuIntent = useCallback(
    (event: React.MouseEvent<HTMLDivElement> | React.PointerEvent) => {
      if (event.button !== 2) {
        return false;
      }

      const nodeIDs = getSelectedNodeIDsSnapshot();
      if (shouldOpenMultiSelectionContextMenu(event.target, nodeIDs)) {
        logMultiNodeContextMenuDebug('capture-intent', {
          eventType: event.type,
          targetClass:
            event.target instanceof Element
              ? event.target.className.toString()
              : null,
          nodeIDs,
        });
        event.preventDefault();
        event.stopPropagation();
        pendingMultiSelectionContextMenuRef.current = {
          nodeIDs,
        };
        rightSelectionStartRef.current = { x: event.clientX, y: event.clientY };
        isRightSelectingRef.current = false;
        suppressNextPaneContextMenuRef.current = false;
        suppressNextMultiSelectionContextMenuRef.current = false;
        setRightSelectionRect(null);
        return true;
      }

      logMultiNodeContextMenuDebug('skip-capture-intent', {
        eventType: event.type,
        targetClass:
          event.target instanceof Element
            ? event.target.className.toString()
            : null,
        nodeIDs,
      });
      pendingMultiSelectionContextMenuRef.current = null;
      return false;
    },
    [getSelectedNodeIDsSnapshot, logMultiNodeContextMenuDebug]
  );

  const openMultiSelectionContextMenuFromEvent = useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      if (isRightSelectingRef.current) {
        if (event.type === 'contextmenu') {
          event.preventDefault();
          event.stopPropagation();
        }
        pendingMultiSelectionContextMenuRef.current = null;
        logMultiNodeContextMenuDebug('skip-open-during-right-selection', {
          eventType: event.type,
        });
        return false;
      }

      if (suppressNextMultiSelectionContextMenuRef.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextMultiSelectionContextMenuRef.current = false;
        pendingMultiSelectionContextMenuRef.current = null;
        logMultiNodeContextMenuDebug('skip-open-after-right-selection', {
          eventType: event.type,
        });
        return false;
      }

      const pending = pendingMultiSelectionContextMenuRef.current;
      const nodeIDs = getSelectedNodeIDsSnapshot();
      const effectiveNodeIDs = nodeIDs.length >= 2 ? nodeIDs : pending?.nodeIDs;

      if (
        !effectiveNodeIDs ||
        !shouldOpenMultiSelectionContextMenu(event.target, effectiveNodeIDs)
      ) {
        logMultiNodeContextMenuDebug('skip-open-from-event', {
          eventType: event.type,
          pendingNodeIDs: pending?.nodeIDs,
          snapshotNodeIDs: nodeIDs,
          targetClass:
            event.target instanceof Element
              ? event.target.className.toString()
              : null,
        });
        pendingMultiSelectionContextMenuRef.current = null;
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      pendingMultiSelectionContextMenuRef.current = null;
      return tryOpenMultiNodeContextMenu(
        {
          x: event.clientX,
          y: event.clientY,
        },
        effectiveNodeIDs
      );
    },
    [
      getSelectedNodeIDsSnapshot,
      logMultiNodeContextMenuDebug,
      tryOpenMultiNodeContextMenu,
    ]
  );

  const onWrapperPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      captureMultiSelectionContextMenuIntent(event);
    },
    [captureMultiSelectionContextMenuIntent]
  );

  const onWrapperPointerUpCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 2 || !pendingMultiSelectionContextMenuRef.current) {
        return;
      }

      openMultiSelectionContextMenuFromEvent(event);
    },
    [openMultiSelectionContextMenuFromEvent]
  );

  const onWrapperContextMenuCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      openMultiSelectionContextMenuFromEvent(event);
    },
    [openMultiSelectionContextMenuFromEvent]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, _node: GraphEditorNode) => {
      openMultiSelectionContextMenuFromEvent(event);
    },
    [openMultiSelectionContextMenuFromEvent]
  );

  const onDocumentMultiSelectionContextMenuCapture = useCallback(
    (event: MouseEvent | PointerEvent) => {
      if (event.button !== 2) {
        return;
      }

      const wrapper = reactFlowWrapper.current;
      const target = event.target;
      const isMuiBackdrop =
        target instanceof Element &&
        Boolean(target.closest('.MuiBackdrop-root'));
      if (
        !(target instanceof Node) ||
        (!wrapper?.contains(target) && !isMuiBackdrop)
      ) {
        return;
      }

      const nodeIDs = getSelectedNodeIDsSnapshot();
      if (isRightSelectingRef.current) {
        if (event.type === 'contextmenu') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
        pendingMultiSelectionContextMenuRef.current = null;
        logMultiNodeContextMenuDebug('native-skip-during-right-selection', {
          eventType: event.type,
          nodeIDs,
        });
        return;
      }

      if (suppressNextMultiSelectionContextMenuRef.current) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        suppressNextMultiSelectionContextMenuRef.current = false;
        pendingMultiSelectionContextMenuRef.current = null;
        logMultiNodeContextMenuDebug('native-skip-after-right-selection', {
          eventType: event.type,
          nodeIDs,
        });
        return;
      }

      if (!shouldOpenMultiSelectionContextMenu(target, nodeIDs)) {
        logMultiNodeContextMenuDebug('native-skip', {
          eventType: event.type,
          nodeIDs,
          targetClass:
            target instanceof Element ? target.className.toString() : null,
        });
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      logMultiNodeContextMenuDebug('native-open', {
        eventType: event.type,
        nodeIDs,
        targetClass:
          target instanceof Element ? target.className.toString() : null,
      });
      tryOpenMultiNodeContextMenu(
        {
          x: event.clientX,
          y: event.clientY,
        },
        nodeIDs
      );
    },
    [
      getSelectedNodeIDsSnapshot,
      logMultiNodeContextMenuDebug,
      tryOpenMultiNodeContextMenu,
    ]
  );

  useEffect(() => {
    document.addEventListener(
      'contextmenu',
      onDocumentMultiSelectionContextMenuCapture,
      true
    );
    document.addEventListener(
      'mouseup',
      onDocumentMultiSelectionContextMenuCapture,
      true
    );

    return () => {
      document.removeEventListener(
        'contextmenu',
        onDocumentMultiSelectionContextMenuCapture,
        true
      );
      document.removeEventListener(
        'mouseup',
        onDocumentMultiSelectionContextMenuCapture,
        true
      );
    };
  }, [onDocumentMultiSelectionContextMenuCapture]);

  const onWrapperMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (captureMultiSelectionContextMenuIntent(event)) {
        return;
      }

      if (event.button !== 2) return;

      const target = event.target as HTMLElement | null;
      const isPane = Boolean(target?.closest('.react-flow__pane'));
      if (!isPane) {
        return;
      }

      rightSelectionStartRef.current = { x: event.clientX, y: event.clientY };
      isRightSelectingRef.current = false;
      suppressNextPaneContextMenuRef.current = false;
      suppressNextMultiSelectionContextMenuRef.current = false;
      pendingMultiSelectionContextMenuRef.current = null;
      setRightSelectionRect(null);
      closePaneMenu();
      suppressMoveStartCloseForHandleMenuRef.current = false;
      setHandleMenu(null);
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-right-selection-start', {
        eventType: event.type,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [
      captureMultiSelectionContextMenuIntent,
      closeMultiNodeContextMenuWithDebug,
      closePaneMenu,
    ]
  );

  const onWrapperMouseUpCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 2 || !pendingMultiSelectionContextMenuRef.current) {
        return;
      }

      openMultiSelectionContextMenuFromEvent(event);
    },
    [openMultiSelectionContextMenuFromEvent]
  );

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const start = rightSelectionStartRef.current;
      if (!start) return;

      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      if (
        !isRightSelectingRef.current &&
        (dx > RIGHT_SELECTION_DRAG_THRESHOLD ||
          dy > RIGHT_SELECTION_DRAG_THRESHOLD)
      ) {
        isRightSelectingRef.current = true;
      }

      if (!isRightSelectingRef.current) {
        return;
      }

      const rect = getSelectionRectInWrapper(start, {
        x: event.clientX,
        y: event.clientY,
      });
      if (rect) {
        setRightSelectionRect(rect);
      }
    };

    const handleWindowMouseUp = (event: MouseEvent) => {
      if (event.button !== 2) return;

      const start = rightSelectionStartRef.current;
      if (!start) return;

      const end = { x: event.clientX, y: event.clientY };
      if (isRightSelectingRef.current) {
        suppressNextPaneContextMenuRef.current = true;
        suppressNextMultiSelectionContextMenuRef.current = true;
        pendingMultiSelectionContextMenuRef.current = null;
        applyRightMouseSelection(start, end);
      }

      rightSelectionStartRef.current = null;
      isRightSelectingRef.current = false;
      setRightSelectionRect(null);
    };

    const handleWindowBlur = () => {
      rightSelectionStartRef.current = null;
      isRightSelectingRef.current = false;
      setRightSelectionRect(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [applyRightMouseSelection, getSelectionRectInWrapper]);

  // 2. Закрытие меню при клике по холсту (ЛКМ)
  const onPaneClick = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if (Date.now() < contextMenuInteractionLockedUntilRef.current) {
        return;
      }

      if (isSecondaryMouseButtonEvent(event)) {
        return;
      }

      suppressMoveStartCloseForHandleMenuRef.current = false;
      closePaneMenu();
      setHandleMenu(null);
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-pane-click', {
        eventType: event.type,
      });
      if (!nodeDataModalUI.open) {
        clearSelectedNode();
      }
    },
    [
      closeMultiNodeContextMenuWithDebug,
      closePaneMenu,
      nodeDataModalUI,
      clearSelectedNode,
    ]
  );

  // 3. Закрытие при начале движения холста (панорамирование)
  const onMoveStart = useCallback(
    (event: MouseEvent | TouchEvent | null) => {
      if (event === null) {
        return;
      }

      if (Date.now() < contextMenuInteractionLockedUntilRef.current) {
        return;
      }

      if (isSecondaryMouseButtonEvent(event)) {
        return;
      }

      if (suppressMoveStartCloseForHandleMenuRef.current) {
        return;
      }

      closePaneMenu();
      suppressMoveStartCloseForHandleMenuRef.current = false;
      setHandleMenu(null);
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-move-start', {
        eventType: event.type,
        button: event instanceof MouseEvent ? event.button : null,
      });
    },
    [closeMultiNodeContextMenuWithDebug, closePaneMenu]
  );

  const onOutputContextMenu = useCallback(
    (
      event: React.MouseEvent,
      nodeId: string,
      handleId: string,
      type: string | string[]
    ) => {
      event.preventDefault();
      event.stopPropagation();

      lockContextMenuInteractions();
      suppressMoveStartCloseForHandleMenuRef.current = true;
      setHandleMenu({
        top: event.clientY,
        left: event.clientX,
        sourceNodeId: nodeId,
        sourceHandleId: handleId,
        dataType: type,
        direction: 'from-output',
      });
      closePaneMenu({ force: true }); // Закрываем обычное меню, если открыто
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-output-context-menu', {
        nodeId,
        handleId,
      });
    },
    [
      closeMultiNodeContextMenuWithDebug,
      closePaneMenu,
      lockContextMenuInteractions,
    ]
  );

  const onInputContextMenu = useCallback(
    (
      event: React.MouseEvent,
      nodeId: string,
      handleId: string,
      type: string | string[]
    ) => {
      event.preventDefault();
      event.stopPropagation();

      lockContextMenuInteractions();
      suppressMoveStartCloseForHandleMenuRef.current = true;
      setHandleMenu({
        top: event.clientY,
        left: event.clientX,
        sourceNodeId: nodeId,
        sourceHandleId: handleId,
        dataType: type,
        direction: 'from-input',
      });
      closePaneMenu({ force: true });
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-input-context-menu', {
        nodeId,
        handleId,
      });
    },
    [
      closeMultiNodeContextMenuWithDebug,
      closePaneMenu,
      lockContextMenuInteractions,
    ]
  );

  const onSelectedGroupContextMenu = useCallback(
    (event: React.MouseEvent, nodeID: string) => {
      const nodeIDs = selectedNodeIDsRef.current;
      if (nodeIDs.length < 2 || !nodeIDs.includes(nodeID)) {
        return false;
      }

      return tryOpenMultiNodeContextMenu(
        {
          x: event.clientX,
          y: event.clientY,
        },
        nodeIDs
      );
    },
    [tryOpenMultiNodeContextMenu]
  );

  const onSubgraphContextMenu = useCallback(
    (event: React.MouseEvent, subgraphId: string) => {
      event.preventDefault();
      event.stopPropagation();

      closePaneMenu({ force: true });
      suppressMoveStartCloseForHandleMenuRef.current = false;
      setHandleMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-subgraph-context-menu', {
        subgraphId,
      });
      setSubgraphMenu({
        subgraphId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [closeMultiNodeContextMenuWithDebug, closePaneMenu]
  );

  const onSubgraphExpand = useCallback((subgraphID: string) => {
    setSubgraphExpandedRef.current(subgraphID, true);
  }, []);

  const onSubgraphCollapse = useCallback((subgraphID: string) => {
    setSubgraphExpandedRef.current(subgraphID, false);
  }, []);

  const onSubgraphDelete = useCallback(async (subgraphID: string) => {
    await deleteSubgraphsByIDsRef.current([subgraphID]);
  }, []);

  const onSubgraphDisplayNameChange = useCallback(
    (subgraphID: string, displayName: string) => {
      const currentSubgraph = subgraphs.find(item => item.id === subgraphID);
      if (!currentSubgraph) {
        return;
      }

      setSubgraphs(current =>
        current.map(item =>
          item.id === subgraphID
            ? {
                ...item,
                data: {
                  ...item.data,
                  displayName,
                },
              }
            : item
        )
      );

      updateSubgraphs([
        {
          id: subgraphID,
          data: {
            ...currentSubgraph.data,
            displayName,
          },
        },
      ]);
    },
    [subgraphs, updateSubgraphs]
  );

  const nodeTypes = useMemo(
    () => ({
      custom: (props: any) => (
        <CustomNode
          {...props}
          onOutputContextMenu={onOutputContextMenu}
          onInputContextMenu={onInputContextMenu}
          onSelectedGroupContextMenu={onSelectedGroupContextMenu}
        />
      ),
      widget: (props: any) => <WidgetNode {...props} />,
      subgraph: (props: any) => (
        <SubgraphNode
          {...props}
          onDisplayNameChange={onSubgraphDisplayNameChange}
          onSubgraphContextMenu={onSubgraphContextMenu}
          onSelectedGroupContextMenu={onSelectedGroupContextMenu}
          onSubgraphExpand={onSubgraphExpand}
          onSubgraphDelete={onSubgraphDelete}
        />
      ),
      subgraphPanel: (props: any) => (
        <SubgraphPanelNode
          {...props}
          onDisplayNameChange={onSubgraphDisplayNameChange}
          onSubgraphCollapse={onSubgraphCollapse}
          onSubgraphContextMenu={onSubgraphContextMenu}
          onToggleEditMode={toggleSubgraphEditMode}
        />
      ),
    }),
    [
      onInputContextMenu,
      onSubgraphCollapse,
      onSubgraphDisplayNameChange,
      onSubgraphDelete,
      onSubgraphExpand,
      onOutputContextMenu,
      onSelectedGroupContextMenu,
      onSubgraphContextMenu,
      toggleSubgraphEditMode,
    ]
  );

  // 3. Логика создания ноды из меню коннектора
  const handleAddNodeFromHandle = useCallback(
    async (nodeDefinition: NodeDefinition) => {
      if (!handleMenu) return;

      const position = screenToFlowPosition({
        x: handleMenu.left,
        y: handleMenu.top,
      });

      position.x += handleMenu.direction === 'from-output' ? 150 : -350;

      const newNodeId = generateShortNodeID();
      const newNode: CustomNodeType = {
        id: newNodeId,
        type: nodeDefinition.category === 'Widgets' ? 'widget' : 'custom',
        position,
        data: {
          name: nodeDefinition.name,
          displayName: nodeDefinition.display_name || nodeDefinition.name,
          inputValues: buildInitialInputValues(nodeDefinition),
        },
      };

      await createGraphEntities([newNode], []);

      let sourceID, sourceHandle, targetID, targetHandle;

      if (handleMenu.direction === 'from-output') {
        sourceID = handleMenu.sourceNodeId;
        sourceHandle = handleMenu.sourceHandleId;
        targetID = newNodeId;

        const targetInput = Object.values(
          nodeDefinition.input_definitions ?? {}
        ).find(input => isIoTypeCompatible(handleMenu.dataType, input.type));

        if (targetInput) targetHandle = `input-${targetInput.attr_name}`;
      } else {
        sourceID = newNodeId;
        targetID = handleMenu.sourceNodeId;
        targetHandle = handleMenu.sourceHandleId;

        const sourceOutput = Object.values(
          nodeDefinition.output_definitions ?? {}
        ).find(output => isIoTypeCompatible(output.type, handleMenu.dataType));

        if (sourceOutput) sourceHandle = `output-${sourceOutput.attr_name}`;
      }

      if (sourceID && targetID && sourceHandle && targetHandle) {
        requestAnimationFrame(() => {
          requestAnimationFrame(async () => {
            const newEdge: Edge = {
              id: generateShortEdgeID(),
              source: sourceID,
              sourceHandle: sourceHandle,
              target: targetID,
              targetHandle: targetHandle,
              type: 'custom',
              markerEnd: { type: MarkerType.ArrowClosed },
            };
            await createGraphEntities([], [newEdge]);
          });
        });
      }

      suppressMoveStartCloseForHandleMenuRef.current = false;
      setHandleMenu(null);
    },
    [handleMenu, screenToFlowPosition, createGraphEntities]
  );

  // 4. Логика добавления ноды из контекстного меню
  const handleAddNodeFromMenu = useCallback(
    async (nodeDefinition: NodeDefinition) => {
      if (!paneMenu) return;

      // Конвертируем экранные координаты клика (где было открыто меню) в координаты графа
      const position = screenToFlowPosition({
        x: paneMenu.left,
        y: paneMenu.top,
      });

      const initialValues = buildInitialInputValues(nodeDefinition);
      const isWidget = nodeDefinition.category === 'Widgets';

      const newNode: CustomNodeType = {
        id: generateShortNodeID(),
        type: isWidget ? 'widget' : 'custom',
        position, // Используем позицию клика ПКМ
        data: {
          name: nodeDefinition.name,
          displayName: nodeDefinition.display_name || nodeDefinition.name,
          inputValues: initialValues,
        },
      };

      if (isWidget) {
        newNode.style = { width: 300, height: 150 };
      }

      await createGraphNodes([newNode]);
      setPaneMenu(null); // Закрываем меню после добавления
    },
    [paneMenu, screenToFlowPosition, createGraphNodes]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: GraphEdgeWithSubgraph) => {
      event.preventDefault();
      setPaneMenu(null); // Важно: закрыть меню создания нод, если открыли меню ребра
      setSubgraphMenu(null);
      closeMultiNodeContextMenuWithDebug('close-from-edge-context-menu', {
        edgeId: edge.id,
      });
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const realEdge = resolveRealEdge(edge);
      if (!realEdge) {
        return;
      }

      openEdgeContextMenu({
        position: { x: event.clientX, y: event.clientY },
        flowPosition,
        edge: realEdge,
      });
    },
    [
      closeMultiNodeContextMenuWithDebug,
      openEdgeContextMenu,
      resolveRealEdge,
      screenToFlowPosition,
    ]
  );

  const buildDeleteDialogContent = useCallback(
    (nodesToDelete: CustomNodeType[], edgesToDelete: Edge[]) => {
      const formatNodeLabel = (node: CustomNodeType) => {
        const data = node.data as Partial<CustomNodeType['data']> & {
          displayName?: string;
          name?: string;
        };
        return data?.displayName ?? data?.name ?? node.id;
      };

      const maxLines = 8;
      const nodeLines = nodesToDelete.map(
        node => `• ${formatNodeLabel(node)} (id: ${node.id})`
      );
      const linesShown = nodeLines.slice(0, maxLines);
      const hiddenCount = nodeLines.length - linesShown.length;

      const title =
        nodesToDelete.length + edgesToDelete.length > 1
          ? 'Удалить элементы?'
          : 'Удалить элемент?';

      let message: string;
      if (linesShown.length) {
        message = linesShown.join('\n');
        if (hiddenCount > 0) {
          message += `\n…и ещё ${hiddenCount}`;
        }
      } else if (edgesToDelete.length) {
        message = `Рёбер к удалению: ${edgesToDelete.length}`;
      } else {
        message = 'Будет выполнено удаление. Действие необратимо.';
      }

      return { title, message };
    },
    []
  );

  const mapVisibleEdgesToReal = useCallback(
    (edgesToDelete: GraphEdgeWithSubgraph[]): GraphEdgeWithSubgraph[] => {
      const mapped = new Map<string, GraphEdgeWithSubgraph>();

      for (const edge of edgesToDelete) {
        const realEdge = resolveRealEdge(edge);
        if (!realEdge) {
          continue;
        }
        mapped.set(realEdge.id, realEdge);
      }

      return Array.from(mapped.values());
    },
    [resolveRealEdge]
  );

  const onBeforeDelete = useCallback<
    OnBeforeDelete<GraphEditorNode, GraphEdgeWithSubgraph>
  >(
    async payload => {
      const nodesToDelete = payload?.nodes ?? [];
      const edgesToDelete = mapVisibleEdgesToReal(payload?.edges ?? []);

      const regularNodesToDelete = nodesToDelete.filter(
        (node): node is CustomNodeType =>
          node.type !== 'subgraph' && node.type !== SUBGRAPH_PANEL_NODE_TYPE
      );
      const subgraphNodesToDelete = nodesToDelete.filter(
        node =>
          node.type === 'subgraph' || node.type === SUBGRAPH_PANEL_NODE_TYPE
      );

      if (
        regularNodesToDelete.length === 0 &&
        subgraphNodesToDelete.length === 0 &&
        edgesToDelete.length === 0
      ) {
        return false;
      }

      const { title, message } = buildDeleteDialogContent(
        regularNodesToDelete,
        edgesToDelete
      );

      const subgraphLines = subgraphNodesToDelete.map(node => {
        const subgraphID =
          node.type === SUBGRAPH_PANEL_NODE_TYPE
            ? ((node.data as { subgraphId?: string } | undefined)?.subgraphId ??
              getSubgraphIDFromPanelNodeID(node.id))
            : node.id;
        return `• ${(node.data as any)?.displayName ?? node.id} (subgraph id: ${subgraphID ?? node.id})`;
      });
      const mergedMessage =
        subgraphLines.length > 0
          ? `${message}\n${subgraphLines.join('\n')}`
          : message;

      const isConfirmed = await confirm({
        title,
        message: mergedMessage,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
        maxWidth: 'sm',
      });

      return isConfirmed;
    },
    [buildDeleteDialogContent, confirm, mapVisibleEdgesToReal]
  );

  const onDelete: OnDelete<GraphEditorNode, GraphEdgeWithSubgraph> =
    useCallback(
      async entitiesToDelete => {
        const nodesToDelete = entitiesToDelete?.nodes ?? [];
        const edgesToDelete = mapVisibleEdgesToReal(
          entitiesToDelete?.edges ?? []
        );

        const subgraphIDsToDelete = nodesToDelete
          .filter(
            node =>
              node.type === 'subgraph' || node.type === SUBGRAPH_PANEL_NODE_TYPE
          )
          .map(node =>
            node.type === SUBGRAPH_PANEL_NODE_TYPE
              ? ((node.data as { subgraphId?: string } | undefined)
                  ?.subgraphId ?? getSubgraphIDFromPanelNodeID(node.id))
              : node.id
          )
          .filter((id): id is string => Boolean(id));

        if (subgraphIDsToDelete.length > 0) {
          await deleteSubgraphsByIDs(subgraphIDsToDelete);
        }

        const regularNodesToDelete = nodesToDelete.filter(
          (node): node is CustomNodeType =>
            node.type !== 'subgraph' && node.type !== SUBGRAPH_PANEL_NODE_TYPE
        );

        if (regularNodesToDelete.length === 0 && edgesToDelete.length === 0) {
          return;
        }

        const regularNodeIDs = new Set(
          regularNodesToDelete.map(node => node.id)
        );
        const connectedEdges = edges.filter(
          edge =>
            regularNodeIDs.has(edge.source) || regularNodeIDs.has(edge.target)
        );

        const edgesById = new Map<string, GraphEdgeWithSubgraph>();
        for (const edge of connectedEdges) {
          edgesById.set(edge.id, edge);
        }
        for (const edge of edgesToDelete) {
          edgesById.set(edge.id, edge);
        }
        const realEdgesToDelete = Array.from(edgesById.values());

        const reconnectionEdges = calculateReconnectionEdges(
          regularNodesToDelete,
          edges
        );

        await deleteGraphEntities(regularNodesToDelete, realEdgesToDelete);

        if (reconnectionEdges.length > 0) {
          await createGraphEdges(reconnectionEdges);
        }
      },
      [
        calculateReconnectionEdges,
        createGraphEdges,
        deleteGraphEntities,
        deleteSubgraphsByIDs,
        edges,
        mapVisibleEdgesToReal,
      ]
    );

  const deleteSelectedNodesByIDs = useCallback(
    async (nodeIDs: string[]) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const nodeIDSet = new Set(nodeIDs);
      const nodesToDelete = currentNodes.filter(node => nodeIDSet.has(node.id));
      const edgesToDelete = currentEdges.filter(
        edge => nodeIDSet.has(edge.source) || nodeIDSet.has(edge.target)
      );

      if (nodesToDelete.length === 0 && edgesToDelete.length === 0) {
        return;
      }

      const { title, message } = buildDeleteDialogContent(
        nodesToDelete,
        edgesToDelete
      );

      const isConfirmed = await confirm({
        title,
        message,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
        maxWidth: 'sm',
      });

      if (!isConfirmed) {
        return;
      }

      const reconnectionEdges = calculateReconnectionEdges(
        nodesToDelete,
        currentEdges
      );
      await deleteGraphEntities(nodesToDelete, edgesToDelete);
      if (reconnectionEdges.length > 0) {
        await createGraphEdges(reconnectionEdges);
      }
    },
    [
      buildDeleteDialogContent,
      calculateReconnectionEdges,
      confirm,
      createGraphEdges,
      deleteGraphEntities,
    ]
  );

  useEffect(() => {
    if (
      currentProject?.id &&
      !graphLoading &&
      (!graphLoaded || lastLoadedProjectID !== currentProject.id)
    ) {
      loadGraph(currentProject.id).then(graph => {
        if (!graph) throw Error('No Graph Data');
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setSubgraphs(graph.subgraphs ?? []);
      });
    }
  }, [
    currentProject?.id,
    graphLoaded,
    graphLoading,
    lastLoadedProjectID,
    loadGraph,
    setEdges,
    setNodes,
  ]);

  // Restore saved viewport when project is loaded
  useEffect(() => {
    if (savedViewport && graphLoaded) {
      setViewport(savedViewport, { duration: 0 });
    }
  }, [savedViewport, graphLoaded, setViewport]);

  const { isValidConnection } = useNodeConnectionValidation();

  const resolveConnectionToReal = useCallback(
    (
      connection: Pick<
        Connection | Edge,
        'source' | 'sourceHandle' | 'target' | 'targetHandle'
      >
    ) =>
      mapSubgraphConnectionToReal({
        source: connection.source,
        sourceHandle: connection.sourceHandle ?? null,
        target: connection.target,
        targetHandle: connection.targetHandle ?? null,
        projection,
        nodeSubgraphByID,
      }),
    [nodeSubgraphByID, projection]
  );

  const isValidVisibleConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      const resolvedConnection = resolveConnectionToReal(connection);
      if (!resolvedConnection) {
        return false;
      }

      return isValidConnection({
        source: resolvedConnection.source,
        sourceHandle: resolvedConnection.sourceHandle ?? null,
        target: resolvedConnection.target,
        targetHandle: resolvedConnection.targetHandle ?? null,
      });
    },
    [isValidConnection, resolveConnectionToReal]
  );

  const onConnect: OnConnect = useCallback(
    async (params: Connection | Edge) => {
      const resolvedConnection = resolveConnectionToReal(params);
      if (!resolvedConnection) {
        return;
      }

      const connectionToValidate: Connection = {
        source: resolvedConnection.source,
        sourceHandle: resolvedConnection.sourceHandle ?? null,
        target: resolvedConnection.target,
        targetHandle: resolvedConnection.targetHandle ?? null,
      };

      if (!isValidConnection(connectionToValidate)) {
        console.warn('Invalid connection attempt:', params);
        return;
      }

      const state = store.getState();
      const targetNodeName: string | undefined =
        state.graph.nodeDataByID[resolvedConnection.target]?.name;
      const targetNodeDefinition =
        targetNodeName &&
        state.nodeDefinition.nodesDefinitionsMap[targetNodeName]
          ? state.nodeDefinition.nodesDefinitionsMap[targetNodeName]
          : undefined;

      const targetInputName = resolvedConnection.targetHandle?.replace(
        /^input-/,
        ''
      );
      const targetInputDefinition =
        targetInputName &&
        (targetNodeDefinition?.input_definitions?.[targetInputName] ??
          Object.values(targetNodeDefinition?.input_definitions ?? {}).find(
            def => def.attr_name === targetInputName
          ));
      const allowMultipleConnections = Boolean(
        (targetInputDefinition as any)?.allow_multiple_connections
      );

      const duplicateEdge = edges.find(
        edge =>
          edge.source === resolvedConnection.source &&
          edge.target === resolvedConnection.target &&
          edge.sourceHandle === resolvedConnection.sourceHandle &&
          edge.targetHandle === resolvedConnection.targetHandle
      );
      if (duplicateEdge) {
        return;
      }

      const existingEdges = edges.filter(
        edge =>
          edge.target === resolvedConnection.target &&
          edge.targetHandle === resolvedConnection.targetHandle
      );

      if (!allowMultipleConnections && existingEdges.length > 0) {
        await deleteGraphEdges(existingEdges);
      }

      const newEdge: GraphEdgeWithSubgraph = {
        id: generateShortEdgeID(),
        source: resolvedConnection.source,
        sourceHandle: resolvedConnection.sourceHandle,
        target: resolvedConnection.target,
        targetHandle: resolvedConnection.targetHandle,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        subgraphId: resolvedConnection.subgraphId ?? null,
      };

      await createGraphEdges([newEdge]);
    },
    [
      createGraphEdges,
      deleteGraphEdges,
      edges,
      isValidConnection,
      resolveConnectionToReal,
      store,
    ]
  );

  const onReconnectStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onReconnect: OnReconnect = useCallback(
    async (oldVisibleEdge: Edge, newConnection: Connection) => {
      const oldEdge = resolveRealEdge(oldVisibleEdge as GraphEdgeWithSubgraph);
      if (!oldEdge) {
        return;
      }

      const resolvedConnection = resolveConnectionToReal(newConnection);
      if (!resolvedConnection) {
        console.warn('Invalid edge update attempt:', newConnection);
        return;
      }

      const connectionToValidate: Connection = {
        source: resolvedConnection.source,
        sourceHandle: resolvedConnection.sourceHandle ?? null,
        target: resolvedConnection.target,
        targetHandle: resolvedConnection.targetHandle ?? null,
      };

      if (!isValidConnection(connectionToValidate)) {
        console.warn('Invalid edge update attempt:', newConnection);
        return;
      }

      const existingEdge = edges.find(
        edge =>
          edge.id !== oldEdge.id &&
          edge.source === resolvedConnection.source &&
          edge.target === resolvedConnection.target &&
          edge.sourceHandle === resolvedConnection.sourceHandle &&
          edge.targetHandle === resolvedConnection.targetHandle
      );

      if (existingEdge) {
        edgeUpdateSuccessful.current = true;
        return;
      }

      edgeUpdateSuccessful.current = true;

      await deleteGraphEdges([oldEdge]);

      const newEdge: GraphEdgeWithSubgraph = {
        id: generateShortEdgeID(),
        source: resolvedConnection.source,
        sourceHandle: resolvedConnection.sourceHandle,
        target: resolvedConnection.target,
        targetHandle: resolvedConnection.targetHandle,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        subgraphId: resolvedConnection.subgraphId ?? null,
      };

      await createGraphEdges([newEdge]);
    },
    [
      createGraphEdges,
      deleteGraphEdges,
      edges,
      isValidConnection,
      resolveConnectionToReal,
      resolveRealEdge,
    ]
  );

  const onReconnectEnd = useCallback(
    async (_: unknown, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        const realEdge = resolveRealEdge(edge as GraphEdgeWithSubgraph);
        if (realEdge) {
          await deleteGraphEdges([realEdge]);
        }
      }
      edgeUpdateSuccessful.current = true;
    },
    [deleteGraphEdges, resolveRealEdge]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const activeDropPreview = dropTargetPreviewRef.current;
      setDropTargetPreviewSafe(null);
      if (!reactFlowWrapper.current) return;

      const nodeName = event.dataTransfer.getData('application/reactflow');
      if (!nodeName) return;

      const nodeDefinition = selectNodeDefinitionByName(
        store.getState(),
        nodeName
      );
      if (!nodeDefinition) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      let targetExpandedSubgraphID: string | null = null;
      let fallbackEntrySide: SubgraphPanelDropSide | null = null;
      for (const subgraph of subgraphs) {
        if (!subgraph.expanded) {
          continue;
        }
        const layout = getPanelLayout(subgraph.id);
        if (pointInRect(position, layout, 8)) {
          targetExpandedSubgraphID = subgraph.id;
          fallbackEntrySide = resolveNearestPanelSide(position, layout);
          break;
        }
      }
      const previewSide =
        targetExpandedSubgraphID &&
        activeDropPreview?.subgraphId === targetExpandedSubgraphID
          ? activeDropPreview.side
          : null;
      const entrySide = previewSide ?? fallbackEntrySide;

      const initialValues = buildInitialInputValues(nodeDefinition);
      const isWidget = nodeDefinition.category === 'Widgets';

      const newNode: CustomNodeType = {
        id: generateShortNodeID(),
        type: isWidget ? 'widget' : 'custom',
        position,
        data: {
          name: nodeDefinition.name,
          displayName: nodeDefinition.display_name || nodeName,
          inputValues: initialValues,
        },
        subgraphId: targetExpandedSubgraphID,
      };

      if (isWidget) {
        newNode.style = { width: 300, height: 150 };
      }

      await createGraphNodes([newNode]);

      if (targetExpandedSubgraphID) {
        const insertedNodeSize = isWidget
          ? { width: 300, height: 150 }
          : { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
        const entryExpandAmount = entrySide
          ? resolveDropEntryExpandAmount(entrySide, insertedNodeSize)
          : 0;
        expandPanelByDropEntry(
          targetExpandedSubgraphID,
          entrySide,
          entryExpandAmount
        );
        bindNodesToSubgraph([
          {
            id: newNode.id,
            subgraphId: targetExpandedSubgraphID,
          },
        ]);
        setPanelEditModeBySubgraphID(current => ({
          ...current,
          [targetExpandedSubgraphID!]: true,
        }));
      }
    },
    [
      bindNodesToSubgraph,
      createGraphNodes,
      expandPanelByDropEntry,
      getPanelLayout,
      screenToFlowPosition,
      setDropTargetPreviewSafe,
      store,
      subgraphs,
    ]
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const nodeName = event.dataTransfer.getData('application/reactflow');
      if (!nodeName) {
        setDropTargetPreviewSafe(null);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let nextPreview: SubgraphDropTargetPreview | null = null;
      for (const subgraph of subgraphs) {
        if (!subgraph.expanded) {
          continue;
        }
        const layout = getPanelLayout(subgraph.id);
        if (!pointInRect(position, layout, 8)) {
          continue;
        }
        nextPreview = {
          subgraphId: subgraph.id,
          side: resolveNearestPanelSide(position, layout),
        };
        break;
      }

      setDropTargetPreviewSafe(nextPreview);
    },
    [getPanelLayout, screenToFlowPosition, setDropTargetPreviewSafe, subgraphs]
  );

  const menuSubgraph = useMemo(() => {
    if (!subgraphMenu) {
      return null;
    }
    return subgraphByID[subgraphMenu.subgraphId] ?? null;
  }, [subgraphByID, subgraphMenu]);

  const menuSubgraphExpanded = Boolean(menuSubgraph?.expanded);
  const menuSubgraphEditMode = Boolean(
    menuSubgraph ? panelEditModeBySubgraphID[menuSubgraph.id] : false
  );
  const menuSubgraphColor = menuSubgraph?.data.color ?? '#3B82F6';

  useEffect(() => {
    if (subgraphMenu) {
      return;
    }
    const pendingEntries = Array.from(
      pendingSubgraphColorByIDRef.current.entries()
    );
    if (pendingEntries.length === 0) {
      return;
    }
    for (const [subgraphID, color] of pendingEntries) {
      persistSubgraphColorValue(subgraphID, color);
    }
  }, [persistSubgraphColorValue, subgraphMenu]);

  const onMoveEnd = useCallback(() => {
    const currentViewport = getViewport();
    saveViewport(currentViewport);
  }, [getViewport, saveViewport]);

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );
  const hasSearchQuery = normalizedQuery.length > 0;

  const matchNodeIds = useMemo(() => {
    if (!hasSearchQuery) return EMPTY_MATCH_NODE_IDS;

    return nodes
      .filter(n => {
        const displayName = String(n.data?.displayName ?? '');
        const matchesName = displayName.toLowerCase().includes(normalizedQuery);
        const matchesId = String(n.id).toLowerCase().includes(normalizedQuery);
        return matchesName || matchesId;
      })
      .map(n => n.id);
  }, [hasSearchQuery, nodes, normalizedQuery]);

  const matchNodeIdSet = useMemo(() => {
    if (!hasSearchQuery) {
      return EMPTY_MATCH_NODE_ID_SET;
    }
    return new Set(matchNodeIds) as ReadonlySet<string>;
  }, [hasSearchQuery, matchNodeIds]);

  const activeNodeId = useMemo(() => {
    if (!hasSearchQuery) return null;
    if (activeMatchIndex < 0) return null;
    return matchNodeIds[activeMatchIndex] ?? null;
  }, [activeMatchIndex, hasSearchQuery, matchNodeIds]);

  const searchContextValue = useMemo(
    () => ({
      query: searchQuery,
      matchNodeIds,
      matchNodeIdSet,
      activeIndex: activeMatchIndex,
      activeNodeId,
    }),
    [activeMatchIndex, activeNodeId, matchNodeIdSet, matchNodeIds, searchQuery]
  );

  const centerOnNode = useCallback(
    async (nodeId: string, fallbackNode?: CustomNodeType) => {
      const internal = getInternalNode(nodeId);
      const node =
        internal?.internals?.userNode ?? getNode(nodeId) ?? fallbackNode;
      if (!node) return false;

      const positionAbsolute =
        internal?.internals?.positionAbsolute ?? node.position;
      const wrapperRect = reactFlowWrapper.current?.getBoundingClientRect();
      if (!wrapperRect?.width || !wrapperRect.height) return false;

      const nextViewport = calculateNodeFocusViewport({
        nodePosition: positionAbsolute,
        nodeSize: {
          width: internal?.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
          height:
            internal?.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
        },
        viewportSize: {
          width: wrapperRect.width,
          height: wrapperRect.height,
        },
        zoom: getViewport().zoom,
      });

      // Persist the destination before applying it. A pending restore of the
      // previous viewport must not interrupt the camera move after one frame.
      saveViewport(nextViewport);
      await setViewport(nextViewport, { duration: 0 });
      return true;
    },
    [getInternalNode, getNode, getViewport, saveViewport, setViewport]
  );

  useEffect(() => {
    if (
      !graphNodeFocusRequest ||
      graphNodeFocusRequest.requestID <=
        lastHandledNodeFocusRequestIDRef.current
    ) {
      return;
    }

    const focusPlan = resolveGraphNodeFocusPlan(
      nodesRef.current,
      subgraphs,
      graphNodeFocusRequest.nodeID
    );
    if (!focusPlan) {
      return;
    }

    lastHandledNodeFocusRequestIDRef.current = graphNodeFocusRequest.requestID;

    if (focusPlan.subgraphIDToExpand) {
      setSubgraphExpanded(focusPlan.subgraphIDToExpand, true);
      setPendingNodeFocus(graphNodeFocusRequest);
    } else {
      setPendingNodeFocus(null);
      void centerOnNode(focusPlan.node.id, focusPlan.node);
    }

    selectOnlyNode(focusPlan.node.id);
  }, [
    centerOnNode,
    graphNodeFocusRequest,
    nodes,
    selectOnlyNode,
    setSubgraphExpanded,
    subgraphs,
  ]);

  useEffect(() => {
    if (!pendingNodeFocus) {
      return;
    }

    const visibleNode = visibleNodes.find(
      node => node.id === pendingNodeFocus.nodeID
    );
    if (!visibleNode) {
      return;
    }

    const fallbackNode = nodesRef.current.find(
      node => node.id === pendingNodeFocus.nodeID
    );
    if (!fallbackNode) {
      setPendingNodeFocus(current =>
        current?.requestID === pendingNodeFocus.requestID ? null : current
      );
      return;
    }

    let cancelled = false;
    const frameID = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      const nodeStillExists = nodesRef.current.some(
        node => node.id === pendingNodeFocus.nodeID
      );
      if (!nodeStillExists) {
        setPendingNodeFocus(current =>
          current?.requestID === pendingNodeFocus.requestID ? null : current
        );
        return;
      }

      void centerOnNode(pendingNodeFocus.nodeID, fallbackNode).finally(() => {
        if (cancelled) {
          return;
        }
        setPendingNodeFocus(current =>
          current?.requestID === pendingNodeFocus.requestID ? null : current
        );
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameID);
    };
  }, [centerOnNode, pendingNodeFocus, visibleNodes]);

  // Reset / clamp active match index:
  // - on query change: jump to the first match
  // - on nodes changes: keep index if possible, otherwise clamp
  useEffect(() => {
    const prev = prevNormalizedQueryRef.current;
    const curr = normalizedQuery;
    const queryChanged = prev !== curr;
    prevNormalizedQueryRef.current = curr;

    if (!curr) {
      setActiveMatchIndex(-1);
      return;
    }

    if (matchNodeIds.length === 0) {
      setActiveMatchIndex(-1);
      return;
    }

    if (queryChanged) {
      setActiveMatchIndex(0);
      return;
    }

    setActiveMatchIndex(prevIndex => {
      if (prevIndex < 0) return 0;
      if (prevIndex >= matchNodeIds.length) return matchNodeIds.length - 1;
      return prevIndex;
    });
  }, [matchNodeIds.length, normalizedQuery]);

  useEffect(() => {
    if (!activeNodeId) return;
    centerOnNode(activeNodeId);
  }, [activeNodeId, centerOnNode]);

  useEffect(() => {
    if (!subgraphMenu) {
      return;
    }

    const handleGlobalContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest('[data-subgraph-context-menu-root="true"]')) {
        return;
      }

      const isPaneContext = Boolean(target.closest('.react-flow__pane'));
      const isMenuBackdrop = Boolean(target.closest('.MuiBackdrop-root'));
      if (!isPaneContext && !isMenuBackdrop) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setSubgraphMenu(current =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current
      );
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu, true);
    return () => {
      document.removeEventListener(
        'contextmenu',
        handleGlobalContextMenu,
        true
      );
    };
  }, [subgraphMenu]);

  const goPrevMatch = useCallback(() => {
    if (matchNodeIds.length === 0) return;
    setActiveMatchIndex(prev => {
      const safePrev = prev < 0 ? 0 : prev;
      return (safePrev - 1 + matchNodeIds.length) % matchNodeIds.length;
    });
  }, [matchNodeIds.length]);

  const goNextMatch = useCallback(() => {
    if (matchNodeIds.length === 0) return;
    setActiveMatchIndex(prev => {
      const safePrev = prev < 0 ? 0 : prev;
      return (safePrev + 1) % matchNodeIds.length;
    });
  }, [matchNodeIds.length]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveMatchIndex(-1);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      if (isDialogTarget(e.target)) return;

      const key = String(e.key || '').toLowerCase();
      const isFindShortcut =
        (e.ctrlKey || e.metaKey) && (key === 'f' || e.code === 'KeyF');

      if (isFindShortcut) {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen(true);
        // Focus after render
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select?.();
        });
        return;
      }

      if (key === 'escape' && isSearchOpen) {
        e.preventDefault();
        e.stopPropagation();
        closeSearch();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [closeSearch, isSearchOpen]);

  useEffect(() => {
    const isGraphClipboardTarget = (target: EventTarget | null) => {
      const wrapper = reactFlowWrapper.current;
      if (!wrapper) {
        return false;
      }

      const targetNode = target as Node | null;
      if (targetNode && wrapper.contains(targetNode)) {
        return true;
      }

      const activeElement = document.activeElement;
      if (activeElement && wrapper.contains(activeElement)) {
        return true;
      }

      return (
        !targetNode ||
        targetNode === document.body ||
        targetNode === document.documentElement
      );
    };

    const onCopy = (event: ClipboardEvent) => {
      if (isTextInputTarget(event.target)) {
        return;
      }
      if (isDialogTarget(event.target)) {
        return;
      }
      if (!isGraphClipboardTarget(event.target)) {
        return;
      }

      const selectedNodeIDs = selectedNodeIDsRef.current;
      if (selectedNodeIDs.length === 0) {
        copiedNodePayloadRef.current = null;
        return;
      }

      if (selectedNodeIDs.length > 1) {
        copiedNodePayloadRef.current = null;
        event.preventDefault();
        event.stopPropagation();
        showDuplicateSelectionWarning();
        return;
      }

      const sourceNode = nodesRef.current.find(
        node => node.id === selectedNodeIDs[0]
      );
      if (!sourceNode) {
        copiedNodePayloadRef.current = null;
        return;
      }

      const incomingEdges = edgesRef.current.filter(
        edge => edge.target === sourceNode.id
      );
      const payload = buildDuplicateClipboardPayload(sourceNode, incomingEdges);
      copiedNodePayloadRef.current = payload;

      if (!event.clipboardData) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.clipboardData.setData(
        NODE_DUPLICATE_CLIPBOARD_MIME,
        JSON.stringify(payload)
      );
      event.clipboardData.setData('text/plain', sourceNode.id);
    };

    const onPaste = (event: ClipboardEvent) => {
      if (isTextInputTarget(event.target)) {
        return;
      }
      if (isDialogTarget(event.target)) {
        return;
      }
      if (!isGraphClipboardTarget(event.target)) {
        return;
      }

      const clipboardData = event.clipboardData;
      const types = clipboardData ? Array.from(clipboardData.types) : [];
      const payloadFromClipboard =
        clipboardData && types.includes(NODE_DUPLICATE_CLIPBOARD_MIME)
          ? parseDuplicateClipboardPayload(
              clipboardData.getData(NODE_DUPLICATE_CLIPBOARD_MIME)
            )
          : null;
      const payload =
        payloadFromClipboard ??
        (clipboardData && types.length > 0
          ? null
          : copiedNodePayloadRef.current);

      if (!payload) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      void duplicateNodeFromPayload(payload);
    };

    window.addEventListener('copy', onCopy, true);
    window.addEventListener('paste', onPaste, true);

    return () => {
      window.removeEventListener('copy', onCopy, true);
      window.removeEventListener('paste', onPaste, true);
    };
  }, [duplicateNodeFromPayload, showDuplicateSelectionWarning]);

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        flexGrow: 1,
        height: '100%',
        width: '100%',
        position: 'relative',
        borderRadius: getRadius(theme),
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        '& .react-flow__nodesselection': {
          display: 'none',
        },
        '@keyframes subgraphWiggle': {
          '0%': {
            rotate: '0deg',
            translate: '0 0',
          },
          '16%': {
            rotate: '-0.16deg',
            translate: '-0.8px -0.2px',
          },
          '33%': {
            rotate: '0.14deg',
            translate: '0.6px 0.3px',
          },
          '50%': {
            rotate: '-0.18deg',
            translate: '-0.7px 0.4px',
          },
          '66%': {
            rotate: '0.16deg',
            translate: '0.8px -0.3px',
          },
          '83%': {
            rotate: '-0.12deg',
            translate: '-0.5px 0.2px',
          },
          '100%': {
            rotate: '0deg',
            translate: '0 0',
          },
        },
        '& .react-flow__node.subgraph-member-editable': {
          animation:
            'subgraphWiggle 1650ms cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite',
          animationDelay: 'var(--subgraph-jiggle-delay, 0ms)',
          transformOrigin: '50% 50%',
          filter: 'saturate(1.05)',
        },
        '& .react-flow__node.subgraph-member-editable .MuiPaper-root': {
          boxShadow: `0 0 0 2px ${theme.palette.warning.light}, 0 8px 20px ${theme.palette.action.selected}`,
        },
        '& .react-flow__node.subgraph-member-editable.dragging': {
          animation: 'none',
          filter: 'none',
        },
        '& .react-flow__node.subgraph-member-editable.dragging .MuiPaper-root':
          {
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          },
        '@media (prefers-reduced-motion: reduce)': {
          '& .react-flow__node.subgraph-member-editable': {
            animation: 'none',
            filter: 'none',
          },
        },
      }}
      // Глобальный перехват, чтобы нативное меню не перекрывало наше
      onContextMenuCapture={onWrapperContextMenuCapture}
      onContextMenu={e => e.preventDefault()}
      onPointerDownCapture={onWrapperPointerDownCapture}
      onPointerUpCapture={onWrapperPointerUpCapture}
      onMouseDownCapture={onWrapperMouseDownCapture}
      onMouseUpCapture={onWrapperMouseUpCapture}
    >
      <GraphNodeSearchProvider value={searchContextValue}>
        <ReactFlow<GraphEditorNode, GraphEdgeWithSubgraph>
          data-testid='widgets/project-editor/graph-editor/graph-editor-canvas'
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onGraphNodesChanges}
          onEdgesChange={onGraphEdgesChanges}
          onConnect={onConnect}
          onReconnectStart={onReconnectStart}
          onReconnect={onReconnect}
          onReconnectEnd={onReconnectEnd}
          onBeforeDelete={onBeforeDelete}
          onDelete={onDelete}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          // Viewport props
          minZoom={0.1}
          // Edge props
          reconnectRadius={25}
          connectionRadius={25}
          defaultEdgeOptions={{
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          connectionLineStyle={{
            strokeWidth: 10,
            stroke: 'rgba(177,177,183,0.5)',
          }}
          onlyRenderVisibleElements
          isValidConnection={isValidVisibleConnection}
          deleteKeyCode={['Backspace', 'Delete']}
          panOnDrag={[0]}
          selectionOnDrag={false}
          onPaneContextMenu={onPaneContextMenu}
          onPaneClick={onPaneClick}
          onMoveStart={onMoveStart}
        >
          <CustomNodeConnectionRevealRuntime />
          <Controls data-testid='widgets/project-editor/graph-editor/graph-editor-canvas-controls'>
            <AutoLayoutControlButton
              disabled={!graphLoaded || graphLoading || nodes.length === 0}
              loading={isAutoLayouting}
              onClick={() => void handleAutoLayout()}
            />
          </Controls>
          <FloatingActionPanel onCreate={onCreate} />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        <GraphNodeSearchPanel
          open={isSearchOpen}
          query={searchQuery}
          inputRef={searchInputRef}
          matchesCount={matchNodeIds.length}
          activeIndex={activeMatchIndex < 0 ? 0 : activeMatchIndex}
          onQueryChange={setSearchQuery}
          onPrev={goPrevMatch}
          onNext={goNextMatch}
          onClose={closeSearch}
        />
      </GraphNodeSearchProvider>

      {handleMenu && (
        <NodeLibraryContextMenu
          top={handleMenu.top}
          left={handleMenu.left}
          onClose={() => {
            suppressMoveStartCloseForHandleMenuRef.current = false;
            setHandleMenu(null);
          }}
          onSelectNode={handleAddNodeFromHandle}
          filterInputType={handleMenu.dataType}
          filterMode={
            handleMenu.direction === 'from-output' ? 'target' : 'source'
          }
        />
      )}

      {paneMenu && (
        <NodeLibraryContextMenu
          top={paneMenu.top}
          left={paneMenu.left}
          onClose={() => setPaneMenu(null)}
          onSelectNode={handleAddNodeFromMenu}
        />
      )}

      {rightSelectionRect && (
        <Box
          sx={{
            position: 'absolute',
            left: rightSelectionRect.left,
            top: rightSelectionRect.top,
            width: rightSelectionRect.width,
            height: rightSelectionRect.height,
            border: '1px solid',
            borderColor: 'primary.main',
            bgcolor: 'rgba(59, 130, 246, 0.14)',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />
      )}

      <NodeContextMenu duplicateNode={duplicateNode} />

      <MultiNodeContextMenu
        onDeleteNodes={deleteSelectedNodesByIDs}
        onCreateSubgraph={createSubgraphFromNodeIDs}
      />

      {subgraphMenu && menuSubgraph && (
        <Menu
          open
          onClose={() => setSubgraphMenu(null)}
          anchorReference='anchorPosition'
          anchorPosition={{ top: subgraphMenu.y, left: subgraphMenu.x }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            'data-subgraph-context-menu-root': 'true',
            sx: {
              minWidth: 200,
              maxWidth: 280,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            },
          }}
          MenuListProps={{
            sx: {
              p: '5px',
            },
          }}
        >
          <MenuItem
            disableRipple
            onClick={() => {
              setSubgraphExpanded(menuSubgraph.id, !menuSubgraphExpanded);
              setSubgraphMenu(null);
            }}
            sx={SUBGRAPH_MENU_ITEM_SX}
          >
            <Box sx={buildSubgraphMenuIconBoxSx()}>
              {menuSubgraphExpanded ? (
                <CompressRoundedIcon />
              ) : (
                <ExpandRoundedIcon />
              )}
            </Box>
            <Box component='span' sx={SUBGRAPH_MENU_LABEL_SX}>
              {menuSubgraphExpanded ? 'Свернуть' : 'Развернуть'}
            </Box>
          </MenuItem>

          <MenuItem
            disableRipple
            disabled={!menuSubgraphExpanded}
            onClick={() => {
              toggleSubgraphEditMode(menuSubgraph.id);
              setSubgraphMenu(null);
            }}
            sx={SUBGRAPH_MENU_ITEM_SX}
          >
            <Box sx={buildSubgraphMenuIconBoxSx()}>
              {menuSubgraphEditMode ? (
                <PanToolRoundedIcon />
              ) : (
                <EditRoundedIcon />
              )}
            </Box>
            <Box component='span' sx={SUBGRAPH_MENU_LABEL_SX}>
              {menuSubgraphEditMode
                ? 'Отключить редактирование'
                : 'Включить редактирование'}
            </Box>
          </MenuItem>

          <MenuItem
            disableRipple
            sx={{
              ...SUBGRAPH_MENU_ITEM_SX,
            }}
          >
            <Box sx={buildSubgraphMenuIconBoxSx()}>
              <PaletteRoundedIcon />
            </Box>
            <Box component='span' sx={SUBGRAPH_MENU_LABEL_SX}>
              Цвет subgraph
            </Box>
            <Box
              component='input'
              type='color'
              value={menuSubgraphColor}
              onChange={event => {
                previewSubgraphColorValue(
                  menuSubgraph.id,
                  event.target.value.toUpperCase()
                );
              }}
              onBlur={() => {
                persistSubgraphColorValue(menuSubgraph.id);
              }}
              onPointerUp={() => {
                persistSubgraphColorValue(menuSubgraph.id);
              }}
              sx={{
                ml: 'auto',
                width: 38,
                height: 26,
                border: 'none',
                p: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
          </MenuItem>
          <MenuItem
            disableRipple
            sx={SUBGRAPH_MENU_ITEM_SX}
            onClick={async () => {
              const id = menuSubgraph.id;
              setSubgraphMenu(null);
              await deleteSubgraphsByIDs([id]);
            }}
          >
            <Box sx={buildSubgraphMenuIconBoxSx('error')}>
              <DeleteOutlineRoundedIcon />
            </Box>

            <Box component='span' sx={SUBGRAPH_MENU_LABEL_SX}>
              Удалить subgraph
            </Box>
          </MenuItem>
        </Menu>
      )}

      <EdgeContextMenu />
    </Box>
  );
};

export const GraphEditor: React.FC<GraphEditorProps> = memo(
  ({ nodeTypes, edgeTypes }) => (
    <GraphEditor_ nodeTypes={nodeTypes} edgeTypes={edgeTypes} />
  )
);
GraphEditor.displayName = 'GraphEditor';
