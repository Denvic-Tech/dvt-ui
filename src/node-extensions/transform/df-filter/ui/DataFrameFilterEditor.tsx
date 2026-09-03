import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import {
  type Column,
  DataFrameMetadata,
  type DataType,
} from '@/shared/gatewayClient';
import {
  getSingleVariableNameFromValue,
  isExpressionValue,
  makeExpressionValue,
  makeVariableExpressionValue,
} from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';
import { HighlightedSingleLineFieldV2 } from '@/shared/ui/node-input';
import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
} from '@/shared/ui/node-input/HighlightedSingleLineField.shared';
import { useExpressionsConfigContext } from '@/shared/ui/node-input/useExpressionsConfigContext';

import {
  buildConditionsTreeFromBuilder,
  type BuilderConditionNode,
  type BuilderListValue,
  type BuilderNode,
  type BuilderState,
  countBuilderConditions,
  createBuilderStateFromInput,
  createEmptyBuilderCondition,
  createEmptyBuilderGroup,
  createIdFactory,
  type DataFrameFilterInputValues,
  type FilterGroupKind,
  type FilterTreeNode,
  isListOperator,
  normalizeFilterRulesSpec,
  normalizeLogic,
  requiresRightOperand,
  supportsColumnRightOperand,
  supportsExpressionRightOperand,
} from '../lib/conditions';

import { ColumnSelector } from './ColumnSelector';
import { type ColumnOption, getTypeColor } from './helpers';
import { MantineUtcDateTimePicker } from './MantineUtcDateTimePicker';
import { OperationSelector } from './OperationSelector';
import {
  AddConditionButton,
  AddGroupButton,
  EmptyStateContainer,
  EmptyStateGrid,
  EmptyStateHint,
  FilterHeader,
  GhostCardCondition,
  GhostCardGroup,
  GhostCardTitle,
  GhostIconContainer,
  HeaderLabel,
  HeaderLeft,
  HeaderRight,
  HintIcon,
  HintText,
  LogicToggleButton,
  LogicToggleContainer,
} from './styles';

type OperandPopoverState = {
  conditionId: string;
  anchorEl: HTMLElement;
};

const CASE_INSENSITIVE_OPERATORS = new Set([
  'contains',
  'startswith',
  'endswith',
]);

const getDepthPalette = (depth: number) => {
  if (depth <= 0) {
    return {
      border: '#e5e7eb',
      header: '#ffffff',
      accent: '#6366f1',
      body: '#f9fafb',
    };
  }

  if (depth % 2 === 1) {
    return {
      border: '#c7d2fe',
      header: '#eef2ff',
      accent: '#6366f1',
      body: '#f8faff',
    };
  }

  return {
    border: '#ddd6fe',
    header: '#f5f3ff',
    accent: '#8b5cf6',
    body: '#faf8ff',
  };
};

const normalizeToken = (value: string): string => value.trim().toLowerCase();

const getDefaultColumnName = (columns: Column[]): string =>
  columns[0]?.name ?? '';

const toFingerprint = (
  values: DataFrameFilterInputValues | undefined
): string =>
  JSON.stringify({
    conditions: values?.conditions ?? null,
    filter_conditions: values?.filter_conditions ?? null,
    logic: values?.logic ?? null,
  });

const toConditionsFingerprint = (conditions: FilterTreeNode): string =>
  toFingerprint({ conditions });

const stripLegacyInputs = (
  prev: DataFrameFilterInputValues | undefined,
  conditions: FilterTreeNode
): DataFrameFilterInputValues => {
  const base = (prev ?? {}) as DataFrameFilterInputValues &
    Record<string, unknown>;
  const {
    filter_conditions,
    logic,
    conditions: _oldConditions,
    ...rest
  } = base;
  void filter_conditions;
  void logic;
  void _oldConditions;

  return {
    ...rest,
    conditions,
  };
};

const findConditionNode = (
  nodes: BuilderNode[],
  conditionId: string
): BuilderConditionNode | null => {
  for (const node of nodes) {
    if (node.type === 'condition' && node.id === conditionId) {
      return node;
    }

    if (node.type === 'group') {
      const found = findConditionNode(node.children, conditionId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const mapNodes = (
  nodes: BuilderNode[],
  mapper: (node: BuilderNode) => BuilderNode
): BuilderNode[] =>
  nodes.map(node => {
    const mapped = mapper(node);
    if (mapped.type === 'group') {
      return {
        ...mapped,
        children: mapNodes(mapped.children, mapper),
      };
    }
    return mapped;
  });

const removeNodeById = (
  nodes: BuilderNode[],
  nodeId: string
): BuilderNode[] => {
  const filtered = nodes
    .filter(node => node.id !== nodeId)
    .map(node => {
      if (node.type === 'group') {
        return {
          ...node,
          children: removeNodeById(node.children, nodeId),
        };
      }
      return node;
    });

  return filtered;
};

const appendNodeToGroup = (
  nodes: BuilderNode[],
  groupId: string,
  newNode: BuilderNode
): BuilderNode[] =>
  nodes.map(node => {
    if (node.type !== 'group') {
      return node;
    }

    if (node.id === groupId) {
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }

    return {
      ...node,
      children: appendNodeToGroup(node.children, groupId, newNode),
    };
  });

const listValueToText = (
  value: BuilderListValue,
  nullLiteralToken: string,
  emptyStringLiteralToken: string
): string => {
  if (value.kind === 'null') {
    return 'NULL';
  }

  if (normalizeToken(value.value) === normalizeToken(nullLiteralToken)) {
    return 'NULL';
  }

  if (normalizeToken(value.value) === normalizeToken(emptyStringLiteralToken)) {
    return 'EMPTY STRING';
  }

  return value.value;
};

const isDateLikeType = (dtype: DataType | string | undefined): boolean => {
  const upper = String(dtype ?? '').toUpperCase();
  return upper === 'DATETIME' || upper === 'TIMEDELTA';
};

const isStringLikeType = (dtype: DataType | string | undefined): boolean => {
  const upper = String(dtype ?? '').toUpperCase();
  return upper === 'STRING' || upper === 'TEXT' || upper === 'STR';
};

const getSingleExpressionValue = (value: unknown) =>
  isExpressionValue(value) && value.expression_kind === 'single' ? value : null;

const renderLiteralPreview = (
  condition: BuilderConditionNode,
  nullLiteralToken: string,
  emptyStringLiteralToken: string
): React.ReactNode => {
  if (condition.right.kind === 'null') {
    return (
      <Chip
        size='small'
        label='NULL'
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: '#fef3c7',
          color: '#b45309',
        }}
      />
    );
  }

  if (condition.right.kind === 'column') {
    return (
      <Chip
        size='small'
        label={condition.right.column || 'Колонка'}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: '#e0e7ff',
          color: '#4f46e5',
        }}
      />
    );
  }

  if (condition.right.kind === 'expression') {
    const expressionValue = getSingleExpressionValue(condition.right.value);
    const label = expressionValue?.value ? `=${expressionValue.value}` : '=';

    return (
      <Chip
        size='small'
        label={label}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: '#ede9fe',
          color: '#7c3aed',
          fontFamily:
            'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
          maxWidth: '100%',
        }}
      />
    );
  }

  if (condition.right.value.trim().length === 0) {
    return (
      <Typography
        sx={{
          color: '#9ca3af',
          fontSize: 12,
          lineHeight: '20px',
          userSelect: 'none',
        }}
      >
        Литерал, expression, спец-значение или колонка
      </Typography>
    );
  }

  if (
    normalizeToken(condition.right.value) === normalizeToken(nullLiteralToken)
  ) {
    return (
      <Chip
        size='small'
        label='NULL'
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: '#fef3c7',
          color: '#b45309',
        }}
      />
    );
  }

  if (condition.right.value === emptyStringLiteralToken) {
    return (
      <Chip
        size='small'
        label='EMPTY STRING'
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: '#e5e7eb',
          color: '#374151',
        }}
      />
    );
  }

  return (
    <Typography
      sx={{
        color: '#374151',
        fontSize: 12,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {condition.right.value}
    </Typography>
  );
};

export const DataFrameFilterEditor: React.FC<
  NodeModalExtensionProps<DataFrameFilterInputValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  variables,
}) => {
  const idFactoryRef = useRef(createIdFactory());
  const lastCommittedFingerprintRef = useRef('');
  const { expressionsConfig } = useExpressionsConfigContext();

  const rawRulesSpec = useMemo(
    () => (nodeDefinition as any)?.additional_schema?.filter_rules_spec,
    [nodeDefinition]
  );
  const rulesSpec = useMemo(
    () => normalizeFilterRulesSpec(rawRulesSpec),
    [rawRulesSpec]
  );

  const operatorOptions = useMemo(
    () => (rulesSpec.operators.length > 0 ? rulesSpec.operators : ['==', '!=']),
    [rulesSpec.operators]
  );
  const logicOptions = useMemo<FilterGroupKind[]>(
    () =>
      rulesSpec.logicOptions.length > 0
        ? rulesSpec.logicOptions
        : ['and', 'or'],
    [rulesSpec.logicOptions]
  );

  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const inputMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );

  const dfColumns: Column[] = useMemo(
    () => (inputMetadata?.columns as Column[] | undefined) ?? [],
    [inputMetadata?.columns]
  );

  const defaultColumnName = useMemo(
    () => getDefaultColumnName(dfColumns),
    [dfColumns]
  );

  const columnNames = useMemo(
    () => dfColumns.map(column => column.name),
    [dfColumns]
  );
  const columnTypesByName = useMemo(() => {
    const map: Record<string, DataType | string> = {};
    for (const column of dfColumns) {
      map[column.name] = column.dtype;
    }
    return map;
  }, [dfColumns]);
  const columnOptions = useMemo<ColumnOption[]>(
    () =>
      dfColumns.map(column => ({
        name: column.name,
        type: String(column.dtype ?? ''),
      })),
    [dfColumns]
  );

  const incomingFingerprint = useMemo(
    () => toFingerprint(localInputData),
    [localInputData]
  );

  const [builderState, setBuilderState] = useState<BuilderState>(() =>
    createBuilderStateFromInput(
      localInputData,
      rulesSpec,
      idFactoryRef.current,
      defaultColumnName
    )
  );
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [chipsDraftByConditionId, setChipsDraftByConditionId] = useState<
    Record<string, string>
  >({});
  const [operandPopover, setOperandPopover] =
    useState<OperandPopoverState | null>(null);

  useEffect(() => {
    if (incomingFingerprint === lastCommittedFingerprintRef.current) {
      return;
    }

    setBuilderState(
      createBuilderStateFromInput(
        localInputData,
        rulesSpec,
        idFactoryRef.current,
        defaultColumnName
      )
    );
  }, [defaultColumnName, incomingFingerprint, localInputData, rulesSpec]);

  const updateBuilderState = useCallback(
    (updater: (prev: BuilderState) => BuilderState) => {
      setBuilderState(prevState => {
        const nextState = updater(prevState);

        const draft = buildConditionsTreeFromBuilder(nextState, rulesSpec, {
          strict: false,
          columnNames,
          columnTypes: columnTypesByName,
        }).tree;

        lastCommittedFingerprintRef.current = toConditionsFingerprint(draft);
        setLocalInputData(prev =>
          stripLegacyInputs(
            prev as DataFrameFilterInputValues | undefined,
            draft
          )
        );

        return nextState;
      });
    },
    [columnNames, columnTypesByName, rulesSpec, setLocalInputData]
  );

  const addRootCondition = useCallback(() => {
    updateBuilderState(prev => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        createEmptyBuilderCondition(dfColumns, rulesSpec, idFactoryRef.current),
      ],
    }));
  }, [dfColumns, rulesSpec, updateBuilderState]);

  const addRootGroup = useCallback(() => {
    updateBuilderState(prev => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        createEmptyBuilderGroup(rulesSpec, idFactoryRef.current),
      ],
    }));
  }, [rulesSpec, updateBuilderState]);

  const addConditionToGroup = useCallback(
    (groupId: string) => {
      updateBuilderState(prev => ({
        ...prev,
        nodes: appendNodeToGroup(
          prev.nodes,
          groupId,
          createEmptyBuilderCondition(
            dfColumns,
            rulesSpec,
            idFactoryRef.current
          )
        ),
      }));
    },
    [dfColumns, rulesSpec, updateBuilderState]
  );

  const addGroupToGroup = useCallback(
    (groupId: string) => {
      updateBuilderState(prev => ({
        ...prev,
        nodes: appendNodeToGroup(
          prev.nodes,
          groupId,
          createEmptyBuilderGroup(rulesSpec, idFactoryRef.current)
        ),
      }));
    },
    [rulesSpec, updateBuilderState]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      updateBuilderState(prev => ({
        ...prev,
        nodes: removeNodeById(prev.nodes, nodeId),
      }));
      setCollapsedGroups(prev => {
        const copy = { ...prev };
        delete copy[nodeId];
        return copy;
      });
    },
    [updateBuilderState]
  );

  const updateGroupLogic = useCallback(
    (groupId: string, nextLogic: string) => {
      updateBuilderState(prev => ({
        ...prev,
        nodes: mapNodes(prev.nodes, node => {
          if (node.type === 'group' && node.id === groupId) {
            return {
              ...node,
              logic: normalizeLogic(nextLogic, logicOptions),
            };
          }
          return node;
        }),
      }));
    },
    [logicOptions, updateBuilderState]
  );

  const updateCondition = useCallback(
    (
      conditionId: string,
      updater: (condition: BuilderConditionNode) => BuilderConditionNode
    ) => {
      updateBuilderState(prev => ({
        ...prev,
        nodes: mapNodes(prev.nodes, node => {
          if (node.type === 'condition' && node.id === conditionId) {
            return updater(node);
          }
          return node;
        }),
      }));
    },
    [updateBuilderState]
  );

  const setConditionOperator = useCallback(
    (conditionId: string, operator: string) => {
      updateCondition(conditionId, condition => {
        const normalized = operatorOptions.includes(operator)
          ? operator
          : (operatorOptions[0] ?? '==');

        if (!requiresRightOperand(normalized, rulesSpec)) {
          return {
            ...condition,
            operator: normalized,
          };
        }

        if (isListOperator(normalized, rulesSpec)) {
          return {
            ...condition,
            operator: normalized,
            right: { kind: 'literal', value: '' },
            listValues: condition.listValues,
          };
        }

        if (
          condition.right.kind === 'column' &&
          !supportsColumnRightOperand(normalized, rulesSpec)
        ) {
          return {
            ...condition,
            operator: normalized,
            right: { kind: 'literal', value: '' },
            listValues: [],
          };
        }

        return {
          ...condition,
          operator: normalized,
          listValues: [],
        };
      });
    },
    [operatorOptions, rulesSpec, updateCondition]
  );

  const setConditionColumn = useCallback(
    (conditionId: string, columnName: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        leftColumn: columnName,
      }));
    },
    [updateCondition]
  );

  const setConditionLiteralValue = useCallback(
    (conditionId: string, value: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: {
          kind: 'literal',
          value,
        },
      }));
    },
    [updateCondition]
  );

  const setConditionRightNull = useCallback(
    (conditionId: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: { kind: 'null' },
      }));
    },
    [updateCondition]
  );

  const setConditionRightEmptyString = useCallback(
    (conditionId: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: {
          kind: 'literal',
          value: rulesSpec.emptyStringLiteralToken,
        },
      }));
    },
    [rulesSpec.emptyStringLiteralToken, updateCondition]
  );

  const setConditionRightColumn = useCallback(
    (conditionId: string, columnName: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: { kind: 'column', column: columnName },
      }));
    },
    [updateCondition]
  );

  const setConditionRightExpression = useCallback(
    (conditionId: string, expressionText: string) => {
      const value = expressionText.startsWith('=')
        ? expressionText.slice(1)
        : expressionText;

      updateCondition(conditionId, condition => ({
        ...condition,
        right: {
          kind: 'expression',
          value: makeExpressionValue(value.trimStart(), 'single'),
        },
      }));
    },
    [updateCondition]
  );

  const setConditionRightVariable = useCallback(
    (conditionId: string, variableName: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: {
          kind: 'expression',
          value: makeVariableExpressionValue(variableName),
        },
      }));
    },
    [updateCondition]
  );

  const setConditionRightList = useCallback(
    (conditionId: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        right: { kind: 'literal', value: '' },
      }));
    },
    [updateCondition]
  );

  const addListItem = useCallback(
    (conditionId: string, rawValue: string) => {
      const trimmed = rawValue.trim();
      const normalizedTrimmed = normalizeToken(trimmed);
      const isNullToken =
        normalizedTrimmed === normalizeToken(rulesSpec.nullLiteralToken);
      const isEmptyStringToken =
        normalizedTrimmed === normalizeToken(rulesSpec.emptyStringLiteralToken);

      if (!trimmed && !isEmptyStringToken) {
        return;
      }

      updateCondition(conditionId, condition => {
        if (
          isNullToken &&
          condition.listValues.some(
            item =>
              item.kind === 'null' ||
              (item.kind === 'literal' &&
                normalizeToken(item.value) ===
                  normalizeToken(rulesSpec.nullLiteralToken))
          )
        ) {
          return condition;
        }

        if (
          isEmptyStringToken &&
          condition.listValues.some(
            item =>
              item.kind === 'literal' &&
              normalizeToken(item.value) ===
                normalizeToken(rulesSpec.emptyStringLiteralToken)
          )
        ) {
          return condition;
        }

        const nextItem: BuilderListValue = isNullToken
          ? {
              id: idFactoryRef.current(),
              kind: 'null',
            }
          : {
              id: idFactoryRef.current(),
              kind: 'literal',
              value: isEmptyStringToken
                ? rulesSpec.emptyStringLiteralToken
                : trimmed,
            };

        return {
          ...condition,
          listValues: [...condition.listValues, nextItem],
        };
      });
    },
    [
      rulesSpec.emptyStringLiteralToken,
      rulesSpec.nullLiteralToken,
      updateCondition,
    ]
  );

  const removeListItem = useCallback(
    (conditionId: string, listItemId: string) => {
      updateCondition(conditionId, condition => ({
        ...condition,
        listValues: condition.listValues.filter(item => item.id !== listItemId),
      }));
    },
    [updateCondition]
  );

  const removeLastListItem = useCallback(
    (conditionId: string) => {
      updateCondition(conditionId, condition => {
        if (condition.listValues.length === 0) {
          return condition;
        }

        return {
          ...condition,
          listValues: condition.listValues.slice(0, -1),
        };
      });
    },
    [updateCondition]
  );

  const runValidation = useCallback((): boolean => {
    const result = buildConditionsTreeFromBuilder(builderState, rulesSpec, {
      strict: true,
      columnNames,
      columnTypes: columnTypesByName,
    });

    if (result.errors.length > 0) {
      setValidationErrors?.({
        conditions: result.errors,
      });
      return false;
    }

    lastCommittedFingerprintRef.current = toConditionsFingerprint(result.tree);
    setLocalInputData(prev =>
      stripLegacyInputs(
        prev as DataFrameFilterInputValues | undefined,
        result.tree
      )
    );
    setValidationErrors?.({});
    return true;
  }, [
    builderState,
    columnNames,
    columnTypesByName,
    rulesSpec,
    setLocalInputData,
    setValidationErrors,
  ]);

  useEffect(() => {
    if (!setValidationCallback) {
      return;
    }

    setValidationCallback(() => runValidation);
    return () => {
      setValidationCallback?.(() => () => true);
    };
  }, [runValidation, setValidationCallback]);

  const conditionCount = useMemo(
    () => countBuilderConditions(builderState.nodes),
    [builderState.nodes]
  );

  const selectedConditionForPopover = useMemo(() => {
    if (!operandPopover) {
      return null;
    }
    return findConditionNode(builderState.nodes, operandPopover.conditionId);
  }, [builderState.nodes, operandPopover]);

  const handlePopoverClose = useCallback(() => {
    if (operandPopover?.anchorEl instanceof HTMLElement) {
      operandPopover.anchorEl.blur();
    }
    setOperandPopover(null);
  }, [operandPopover]);

  const rootLogic = normalizeLogic(builderState.rootLogic, logicOptions);

  const renderConditionRow = useCallback(
    (condition: BuilderConditionNode, depth: number): React.ReactNode => {
      const operator = operatorOptions.includes(condition.operator)
        ? condition.operator
        : (operatorOptions[0] ?? '==');
      const withRightOperand = requiresRightOperand(operator, rulesSpec);
      const listMode = isListOperator(operator, rulesSpec);
      const hasNullListValue = condition.listValues.some(
        item =>
          item.kind === 'null' ||
          (item.kind === 'literal' &&
            normalizeToken(item.value) ===
              normalizeToken(rulesSpec.nullLiteralToken))
      );
      const hasEmptyStringListValue = condition.listValues.some(
        item =>
          item.kind === 'literal' &&
          normalizeToken(item.value) ===
            normalizeToken(rulesSpec.emptyStringLiteralToken)
      );
      const listCanUseEmptyString = isStringLikeType(
        columnTypesByName[condition.leftColumn]
      );

      const palette = getDepthPalette(depth);

      return (
        <Paper
          key={condition.id}
          variant='outlined'
          sx={{
            p: 1,
            borderRadius: '10px',
            borderColor: alpha(palette.border, 0.8),
            backgroundColor: depth > 0 ? palette.body : '#fff',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            '&:focus-within': {
              borderColor: '#a5b4fc',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.09)',
            },
          }}
        >
          <Stack direction='row' spacing={0.75} alignItems='flex-start'>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={0.75}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <ColumnSelector
                columns={columnOptions}
                selectedColumn={condition.leftColumn}
                onSelect={columnName =>
                  setConditionColumn(condition.id, columnName)
                }
              />

              <OperationSelector
                selectedOperation={operator}
                availableOperations={operatorOptions}
                onSelect={nextOperator =>
                  setConditionOperator(condition.id, nextOperator)
                }
              />

              {!withRightOperand ? null : listMode &&
                condition.right.kind === 'expression' ? (
                <Button
                  type='button'
                  disableRipple
                  onClick={event =>
                    setOperandPopover({
                      conditionId: condition.id,
                      anchorEl: event.currentTarget,
                    })
                  }
                  sx={{
                    flex: 1,
                    minWidth: 220,
                    height: 30,
                    minHeight: 30,
                    px: 1.25,
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#fff',
                      borderColor: '#d1d5db',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    {renderLiteralPreview(
                      condition,
                      rulesSpec.nullLiteralToken,
                      rulesSpec.emptyStringLiteralToken
                    )}
                  </Box>
                  <ExpandMoreOutlinedIcon
                    sx={{ fontSize: 14, color: '#9ca3af', flexShrink: 0 }}
                  />
                </Button>
              ) : listMode ? (
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 220,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 0.5,
                    minHeight: 30,
                    boxSizing: 'border-box',
                    px: 0.75,
                    pt: 0.375,
                    pb: 0.25,
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    transition:
                      'border-color 150ms ease, box-shadow 150ms ease',
                    '&:focus-within': {
                      borderColor: '#a5b4fc',
                      boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
                    },
                  }}
                >
                  {condition.listValues.map(item => (
                    <Chip
                      key={item.id}
                      size='small'
                      label={listValueToText(
                        item,
                        rulesSpec.nullLiteralToken,
                        rulesSpec.emptyStringLiteralToken
                      )}
                      onDelete={() => removeListItem(condition.id, item.id)}
                      sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 500,
                        bgcolor:
                          item.kind === 'null'
                            ? '#fef3c7'
                            : item.kind === 'literal' &&
                                normalizeToken(item.value) ===
                                  normalizeToken(
                                    rulesSpec.emptyStringLiteralToken
                                  )
                              ? '#e5e7eb'
                              : '#e0e7ff',
                        color:
                          item.kind === 'null'
                            ? '#b45309'
                            : item.kind === 'literal' &&
                                normalizeToken(item.value) ===
                                  normalizeToken(
                                    rulesSpec.emptyStringLiteralToken
                                  )
                              ? '#374151'
                              : '#4f46e5',
                      }}
                    />
                  ))}

                  {!hasNullListValue && (
                    <Button
                      size='small'
                      variant='text'
                      onClick={() =>
                        addListItem(condition.id, rulesSpec.nullLiteralToken)
                      }
                      sx={{
                        minWidth: 0,
                        px: 0.75,
                        py: 0.125,
                        borderRadius: '6px',
                        border: '1.5px dashed #d1d5db',
                        color: '#6b7280',
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        '&:hover': {
                          borderColor: '#f59e0b',
                          bgcolor: '#fef3c7',
                          color: '#b45309',
                        },
                      }}
                    >
                      + NULL
                    </Button>
                  )}

                  {listCanUseEmptyString && !hasEmptyStringListValue && (
                    <Button
                      size='small'
                      variant='text'
                      onClick={() =>
                        addListItem(
                          condition.id,
                          rulesSpec.emptyStringLiteralToken
                        )
                      }
                      sx={{
                        minWidth: 0,
                        px: 0.75,
                        py: 0.125,
                        borderRadius: '6px',
                        border: '1.5px dashed #d1d5db',
                        color: '#6b7280',
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        '&:hover': {
                          borderColor: '#6b7280',
                          bgcolor: '#f3f4f6',
                          color: '#374151',
                        },
                      }}
                    >
                      + EMPTY STRING
                    </Button>
                  )}

                  {supportsExpressionRightOperand(operator, rulesSpec) && (
                    <Button
                      size='small'
                      variant='text'
                      onClick={event =>
                        setOperandPopover({
                          conditionId: condition.id,
                          anchorEl: event.currentTarget,
                        })
                      }
                      sx={{
                        minWidth: 0,
                        px: 0.75,
                        py: 0.125,
                        borderRadius: '6px',
                        border: '1.5px dashed #c4b5fd',
                        color: '#7c3aed',
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        '&:hover': {
                          borderColor: '#8b5cf6',
                          bgcolor: '#f5f3ff',
                          color: '#6d28d9',
                        },
                      }}
                    >
                      = Expression
                    </Button>
                  )}

                  <InputBase
                    placeholder='Добавить значение...'
                    value={chipsDraftByConditionId[condition.id] ?? ''}
                    onChange={event =>
                      setChipsDraftByConditionId(prev => ({
                        ...prev,
                        [condition.id]: event.target.value,
                      }))
                    }
                    onBlur={event => {
                      const value = event.target.value;
                      if (value.trim()) {
                        addListItem(condition.id, value);
                        setChipsDraftByConditionId(prev => ({
                          ...prev,
                          [condition.id]: '',
                        }));
                      }
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const value =
                          chipsDraftByConditionId[condition.id] ?? '';
                        if (value.trim()) {
                          addListItem(condition.id, value);
                          setChipsDraftByConditionId(prev => ({
                            ...prev,
                            [condition.id]: '',
                          }));
                        }
                      } else if (event.key === 'Backspace') {
                        const value =
                          chipsDraftByConditionId[condition.id] ?? '';
                        if (!value) {
                          removeLastListItem(condition.id);
                        }
                      }
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 130,
                      '& input': {
                        fontSize: 12,
                        py: 0.25,
                      },
                    }}
                  />
                </Box>
              ) : (
                <Button
                  type='button'
                  disableRipple
                  onClick={event =>
                    setOperandPopover({
                      conditionId: condition.id,
                      anchorEl: event.currentTarget,
                    })
                  }
                  sx={{
                    flex: 1,
                    minWidth: 220,
                    height: 30,
                    minHeight: 30,
                    px: 1.25,
                    borderRadius: '8px',
                    border: '1.5px solid #e5e7eb',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#fff',
                      borderColor: '#d1d5db',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    {renderLiteralPreview(
                      condition,
                      rulesSpec.nullLiteralToken,
                      rulesSpec.emptyStringLiteralToken
                    )}
                  </Box>
                  <ExpandMoreOutlinedIcon
                    sx={{ fontSize: 14, color: '#9ca3af', flexShrink: 0 }}
                  />
                </Button>
              )}

              {CASE_INSENSITIVE_OPERATORS.has(operator) && (
                <Tooltip
                  title='Без учёта регистра'
                  arrow
                  placement='top'
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: '#1f2937',
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 500,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                      },
                    },
                    arrow: {
                      sx: {
                        color: '#1f2937',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#eef2ff',
                      color: '#6366f1',
                      transition: 'all 150ms ease',
                      cursor: 'default',
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      component='span'
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      Aa
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Stack>

            <IconButton
              size='small'
              onClick={() => removeNode(condition.id)}
              sx={{
                alignSelf: 'center',
                borderRadius: '8px',
                color: '#9ca3af',
                '&:hover': {
                  bgcolor: '#fee2e2',
                  color: '#ef4444',
                },
              }}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        </Paper>
      );
    },
    [
      addListItem,
      chipsDraftByConditionId,
      columnOptions,
      columnTypesByName,
      operatorOptions,
      removeLastListItem,
      removeListItem,
      removeNode,
      rulesSpec,
      setConditionColumn,
      setConditionLiteralValue,
      setConditionOperator,
    ]
  );

  const renderGroupNode = useCallback(
    (
      group: Extract<BuilderNode, { type: 'group' }>,
      depth: number
    ): React.ReactNode => {
      const collapsed = collapsedGroups[group.id] ?? false;
      const palette = getDepthPalette(depth + 1);

      return (
        <Paper
          key={group.id}
          variant='outlined'
          sx={{
            borderRadius: '10px',
            borderColor: alpha(palette.border, 0.95),
            overflow: 'hidden',
            bgcolor: palette.body,
            transition: 'box-shadow 150ms ease, border-color 150ms ease',
            '&:hover': {
              borderColor: palette.border,
            },
          }}
        >
          <Box
            sx={{
              px: 1,
              py: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              bgcolor: palette.header,
              borderBottom: collapsed ? 'none' : '1px solid',
              borderColor: collapsed
                ? 'transparent'
                : alpha(palette.border, 0.7),
              '--df-filter-logic-toggle-bg': alpha(palette.accent, 0.12),
              '--df-filter-logic-toggle-border': alpha(palette.accent, 0.28),
              '--df-filter-logic-toggle-active-bg': palette.accent,
              '--df-filter-logic-toggle-active-hover-bg': palette.accent,
              '--df-filter-logic-toggle-active-shadow':
                '0 2px 8px rgba(15, 23, 42, 0.08)',
              '--df-filter-logic-toggle-focus-ring': alpha(
                palette.accent,
                0.24
              ),
              '--df-filter-logic-toggle-inactive-hover-bg': alpha(
                palette.accent,
                0.18
              ),
              '--df-filter-logic-toggle-inactive-hover-color': palette.accent,
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '8px',
                bgcolor: alpha(palette.accent, 0.14),
                color: palette.accent,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountTreeOutlinedIcon sx={{ fontSize: 12 }} />
            </Box>

            <LogicToggleContainer>
              <LogicToggleButton
                type='button'
                isActive={group.logic === 'and'}
                onClick={() => updateGroupLogic(group.id, 'and')}
              >
                AND
              </LogicToggleButton>
              <LogicToggleButton
                type='button'
                isActive={group.logic === 'or'}
                onClick={() => updateGroupLogic(group.id, 'or')}
              >
                OR
              </LogicToggleButton>
            </LogicToggleContainer>

            <Typography sx={{ fontSize: 11, color: '#6b7280', flex: 1 }}>
              Группа
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '--df-filter-add-condition-hover-bg': alpha(
                  palette.accent,
                  0.12
                ),
                '--df-filter-add-condition-hover-color': palette.accent,
                '--df-filter-add-group-color': palette.accent,
                '--df-filter-add-group-hover-bg': alpha(palette.accent, 0.18),
                '--df-filter-add-group-hover-color': palette.accent,
              }}
            >
              <AddConditionButton
                type='button'
                onClick={() => addConditionToGroup(group.id)}
              >
                <AddOutlinedIcon />
                Условие
              </AddConditionButton>

              <AddGroupButton
                type='button'
                onClick={() => addGroupToGroup(group.id)}
              >
                <AccountTreeOutlinedIcon />
                Группа
              </AddGroupButton>
            </Box>

            <IconButton
              size='small'
              onClick={() =>
                setCollapsedGroups(prev => ({
                  ...prev,
                  [group.id]: !collapsed,
                }))
              }
              sx={{
                borderRadius: '8px',
                color: '#9ca3af',
                '&:hover': { bgcolor: '#f3f4f6', color: '#6b7280' },
              }}
            >
              {collapsed ? (
                <ChevronRightOutlinedIcon sx={{ fontSize: 14 }} />
              ) : (
                <ExpandMoreOutlinedIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>

            <IconButton
              size='small'
              onClick={() => removeNode(group.id)}
              sx={{
                borderRadius: '8px',
                color: '#9ca3af',
                '&:hover': {
                  bgcolor: '#fee2e2',
                  color: '#ef4444',
                },
              }}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          <Collapse in={!collapsed} timeout={200} unmountOnExit>
            <Stack spacing={0.75} sx={{ p: 0.75 }}>
              {group.children.map(child =>
                child.type === 'condition'
                  ? renderConditionRow(child, depth + 1)
                  : renderGroupNode(child, depth + 1)
              )}

              {group.children.length === 0 && (
                <Typography
                  sx={{
                    px: 1,
                    py: 0.5,
                    fontSize: 11,
                    color: '#9ca3af',
                  }}
                >
                  Пустая группа. Добавьте условие или вложенную группу.
                </Typography>
              )}
            </Stack>
          </Collapse>
        </Paper>
      );
    },
    [
      addConditionToGroup,
      addGroupToGroup,
      collapsedGroups,
      removeNode,
      renderConditionRow,
      updateGroupLogic,
    ]
  );
  const operatorForPopover = selectedConditionForPopover?.operator;
  const popoverAllowsColumn =
    operatorForPopover != null &&
    supportsColumnRightOperand(operatorForPopover, rulesSpec);
  const popoverAllowsExpression =
    operatorForPopover != null &&
    supportsExpressionRightOperand(operatorForPopover, rulesSpec);
  const popoverListMode =
    operatorForPopover != null && isListOperator(operatorForPopover, rulesSpec);
  const popoverLeftColumnType =
    selectedConditionForPopover != null
      ? columnTypesByName[selectedConditionForPopover.leftColumn]
      : undefined;
  const popoverShowsDateTimeLiteralPicker = isDateLikeType(
    popoverLeftColumnType
  );
  const popoverShowsEmptyStringValue =
    selectedConditionForPopover?.right.kind === 'literal' &&
    selectedConditionForPopover.right.value ===
      rulesSpec.emptyStringLiteralToken;
  const popoverCanUseEmptyString = isStringLikeType(popoverLeftColumnType);
  const popoverExpressionInputType = popoverListMode
    ? null
    : popoverLeftColumnType;
  const selectedExpressionValue =
    selectedConditionForPopover?.right.kind === 'expression'
      ? getSingleExpressionValue(selectedConditionForPopover.right.value)
      : null;
  const selectedExpressionVariableName = selectedExpressionValue
    ? getSingleVariableNameFromValue(selectedExpressionValue)
    : null;
  const expressionAutocompleteCatalog = useMemo(
    () =>
      buildExpressionAutocompleteCatalog({
        variables,
        inputType: popoverExpressionInputType,
        expressionsConfig,
        expressionPolicyName: 'default',
      }),
    [expressionsConfig, popoverExpressionInputType, variables]
  );
  const expressionDiagnostics = useMemo(() => {
    if (!selectedExpressionValue) {
      return [];
    }

    return getInlineExpressionDiagnostics(`=${selectedExpressionValue.value}`, {
      variables,
      inputType: popoverExpressionInputType,
      expressionsConfig,
      expressionPolicyName: 'default',
    });
  }, [
    expressionsConfig,
    popoverExpressionInputType,
    selectedExpressionValue,
    variables,
  ]);
  const expressionErrorText = expressionDiagnostics.find(
    diagnostic => diagnostic.severity === 'error'
  )?.message;
  const expressionWarningText = expressionDiagnostics.find(
    diagnostic => diagnostic.severity === 'warning'
  )?.message;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        fontFamily: 'Geist, Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {dfColumns.length > 0 && builderState.nodes.length > 0 && (
        <FilterHeader>
          <HeaderLeft>
            <LogicToggleContainer>
              <LogicToggleButton
                type='button'
                isActive={rootLogic === 'and'}
                onClick={() =>
                  updateBuilderState(prev => ({
                    ...prev,
                    rootLogic: normalizeLogic('and', logicOptions),
                  }))
                }
              >
                AND
              </LogicToggleButton>
              <LogicToggleButton
                type='button'
                isActive={rootLogic === 'or'}
                onClick={() =>
                  updateBuilderState(prev => ({
                    ...prev,
                    rootLogic: normalizeLogic('or', logicOptions),
                  }))
                }
              >
                OR
              </LogicToggleButton>
            </LogicToggleContainer>

            <HeaderLabel sx={{ fontSize: 12 }}>Корневая логика</HeaderLabel>
          </HeaderLeft>

          <HeaderRight>
            <AddConditionButton type='button' onClick={addRootCondition}>
              <AddOutlinedIcon />
              Условие
            </AddConditionButton>

            <AddGroupButton type='button' onClick={addRootGroup}>
              <AccountTreeOutlinedIcon />
              Группа
            </AddGroupButton>
          </HeaderRight>
        </FilterHeader>
      )}

      <Box
        sx={{
          py: 1.5,
          overflowY: 'auto',
          minHeight: 0,
          flex: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#e5e7eb',
            borderRadius: 99,
          },
        }}
      >
        {dfColumns.length === 0 ? (
          <Alert severity='warning'>
            Нет метаданных DataFrame. Подключите вход `df`.
          </Alert>
        ) : (
          <Stack spacing={1}>
            {!rawRulesSpec && (
              <Alert severity='warning'>
                additional_schema.filter_rules_spec не получен. Используются
                fallback-правила операторов.
              </Alert>
            )}

            {builderState.nodes.length === 0 ? (
              <EmptyStateContainer>
                <EmptyStateGrid>
                  <GhostCardCondition type='button' onClick={addRootCondition}>
                    <GhostIconContainer className='ghost-icon'>
                      <svg
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 4v16m8-8H4'
                        />
                      </svg>
                    </GhostIconContainer>
                    <GhostCardTitle className='ghost-title'>
                      Добавить условие
                    </GhostCardTitle>
                  </GhostCardCondition>

                  <GhostCardGroup type='button' onClick={addRootGroup}>
                    <GhostIconContainer className='ghost-icon'>
                      <svg
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z'
                        />
                      </svg>
                    </GhostIconContainer>
                    <GhostCardTitle className='ghost-title'>
                      Добавить группу
                    </GhostCardTitle>
                  </GhostCardGroup>
                </EmptyStateGrid>

                <EmptyStateHint>
                  <HintIcon viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </HintIcon>
                  <HintText>
                    Пустой фильтр сохраняется как pass-through: все строки идут
                    в output.
                  </HintText>
                </EmptyStateHint>
              </EmptyStateContainer>
            ) : null}

            {builderState.nodes.map(node =>
              node.type === 'condition'
                ? renderConditionRow(node, 0)
                : renderGroupNode(node, 0)
            )}
          </Stack>
        )}
      </Box>

      <Popover
        open={Boolean(operandPopover && selectedConditionForPopover)}
        anchorEl={operandPopover?.anchorEl ?? null}
        onClose={handlePopoverClose}
        disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: '12px',
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              minWidth: 300,
              maxWidth: 360,
              overflow: 'visible',
            },
          },
        }}
      >
        {selectedConditionForPopover && (
          <Box onClick={event => event.stopPropagation()}>
            {popoverAllowsExpression && (
              <Box sx={{ p: 1, borderBottom: '1px solid #f3f4f6' }}>
                <Typography
                  sx={{
                    px: 0.25,
                    pb: 0.5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                  }}
                >
                  Expression
                </Typography>
                <HighlightedSingleLineFieldV2
                  value={
                    selectedExpressionValue
                      ? `=${selectedExpressionValue.value}`
                      : '='
                  }
                  onChange={nextValue =>
                    setConditionRightExpression(
                      selectedConditionForPopover.id,
                      nextValue
                    )
                  }
                  placeholder='=param'
                  variables={variables}
                  autocompleteCatalog={expressionAutocompleteCatalog}
                  diagnostics={expressionDiagnostics}
                  errorText={expressionErrorText}
                  warningText={expressionWarningText}
                />

                {popoverListMode &&
                  selectedConditionForPopover.right.kind === 'expression' && (
                    <Button
                      size='small'
                      variant='text'
                      onClick={() => {
                        setConditionRightList(selectedConditionForPopover.id);
                        handlePopoverClose();
                      }}
                      sx={{
                        mt: 0.75,
                        minWidth: 0,
                        px: 1,
                        py: 0.25,
                        borderRadius: '7px',
                        color: '#6b7280',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#f3f4f6',
                          color: '#374151',
                        },
                      }}
                    >
                      Вернуться к списку значений
                    </Button>
                  )}
              </Box>
            )}

            {!popoverListMode && (
              <Box sx={{ p: 1, borderBottom: '1px solid #f3f4f6' }}>
                <Typography
                  sx={{
                    px: 0.25,
                    pb: 0.5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                  }}
                >
                  Литеральное значение
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: popoverShowsDateTimeLiteralPicker ? 0 : 1,
                    minHeight: 30,
                    px: popoverShowsDateTimeLiteralPicker ? 0 : 1.25,
                    backgroundColor: popoverShowsDateTimeLiteralPicker
                      ? 'transparent'
                      : '#f9fafb',
                    borderRadius: '7px',
                  }}
                >
                  {popoverShowsDateTimeLiteralPicker ? (
                    <Box sx={{ flex: 1, minWidth: 0, borderRadius: '7px' }}>
                      <MantineUtcDateTimePicker
                        initialIsoValue={
                          selectedConditionForPopover.right.kind === 'literal'
                            ? selectedConditionForPopover.right.value
                            : null
                        }
                        onPythonDateTimeChange={iso =>
                          setConditionLiteralValue(
                            selectedConditionForPopover.id,
                            iso ?? ''
                          )
                        }
                        compact
                        blurOnEnter
                        onApply={handlePopoverClose}
                      />
                    </Box>
                  ) : (
                    <InputBase
                      autoFocus
                      fullWidth
                      placeholder={'Литеральное значение...'}
                      value={
                        selectedConditionForPopover.right.kind === 'literal'
                          ? selectedConditionForPopover.right.value ===
                            rulesSpec.emptyStringLiteralToken
                            ? ''
                            : selectedConditionForPopover.right.value
                          : selectedConditionForPopover.right.kind === 'null'
                            ? rulesSpec.nullLiteralToken
                            : ''
                      }
                      onChange={event =>
                        setConditionLiteralValue(
                          selectedConditionForPopover.id,
                          event.target.value
                        )
                      }
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          event.stopPropagation();
                          event.currentTarget.blur();
                          handlePopoverClose();
                        }
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 12,
                        color: '#111827',
                        '& input::placeholder': {
                          color: '#9ca3af',
                          opacity: 1,
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
              {!popoverListMode && (
                <>
                  <Box sx={{ px: 1.25, pt: 0.75, pb: 0.25 }}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                      }}
                    >
                      Специальные значения
                    </Typography>
                  </Box>

                  <MenuItem
                    onClick={() => {
                      setConditionRightNull(selectedConditionForPopover.id);
                      handlePopoverClose();
                    }}
                    sx={{
                      minHeight: 30,
                      mx: 0.5,
                      my: 0.25,
                      px: 1.25,
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      backgroundColor:
                        selectedConditionForPopover.right.kind === 'null'
                          ? '#eef2ff'
                          : 'transparent',
                      '&:hover': {
                        backgroundColor:
                          selectedConditionForPopover.right.kind === 'null'
                            ? '#eef2ff'
                            : '#f9fafb',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          selectedConditionForPopover.right.kind === 'null'
                            ? '#4338ca'
                            : '#374151',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Значение NULL
                    </Typography>
                    <Box
                      component='span'
                      sx={{
                        px: '6px',
                        py: '1px',
                        borderRadius: '4px',
                        fontSize: 9,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        flexShrink: 0,
                      }}
                    >
                      NULL
                    </Box>
                  </MenuItem>

                  {popoverCanUseEmptyString && (
                    <MenuItem
                      onClick={() => {
                        setConditionRightEmptyString(
                          selectedConditionForPopover.id
                        );
                        handlePopoverClose();
                      }}
                      sx={{
                        minHeight: 30,
                        mx: 0.5,
                        my: 0.25,
                        px: 1.25,
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        backgroundColor: popoverShowsEmptyStringValue
                          ? '#eef2ff'
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: popoverShowsEmptyStringValue
                            ? '#eef2ff'
                            : '#f9fafb',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: popoverShowsEmptyStringValue
                            ? '#4338ca'
                            : '#374151',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Пустая строка
                      </Typography>
                      <Box
                        component='span'
                        sx={{
                          px: '6px',
                          py: '1px',
                          borderRadius: '4px',
                          fontSize: 9,
                          fontWeight: 600,
                          lineHeight: 1.2,
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          flexShrink: 0,
                        }}
                      >
                        EMPTY STRING
                      </Box>
                    </MenuItem>
                  )}
                </>
              )}

              {variables.length > 0 && (
                <>
                  <Box sx={{ px: 1.25, pt: 0.75, pb: 0.25 }}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                      }}
                    >
                      Переменные
                    </Typography>
                  </Box>

                  {variables.map((variable: VariableOutput) => {
                    const typeColor = getTypeColor(String(variable.type ?? ''));
                    const isSelected =
                      selectedExpressionVariableName === variable.name;

                    return (
                      <MenuItem
                        key={`variable:${variable.name}`}
                        onClick={() => {
                          setConditionRightVariable(
                            selectedConditionForPopover.id,
                            variable.name
                          );
                          handlePopoverClose();
                        }}
                        sx={{
                          minHeight: 30,
                          mx: 0.5,
                          my: 0.25,
                          px: 1.25,
                          borderRadius: '7px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          backgroundColor: isSelected
                            ? '#eef2ff'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: isSelected ? '#eef2ff' : '#f9fafb',
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: isSelected ? '#4338ca' : '#374151',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          {variable.name}
                        </Typography>
                        <Box
                          component='span'
                          sx={{
                            px: '6px',
                            py: '1px',
                            borderRadius: '4px',
                            fontSize: 9,
                            fontWeight: 600,
                            lineHeight: 1.2,
                            backgroundColor: typeColor.bg,
                            color: typeColor.text,
                            flexShrink: 0,
                          }}
                        >
                          {String(variable.type ?? '')}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </>
              )}

              {!popoverListMode && (
                <>
                  <Box sx={{ px: 1.25, pt: 0.75, pb: 0.25 }}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                      }}
                    >
                      Колонки
                    </Typography>
                  </Box>

                  {dfColumns.map(column =>
                    (() => {
                      const typeColor = getTypeColor(
                        String(column.dtype ?? '')
                      );
                      const isSelected =
                        selectedConditionForPopover.right.kind === 'column' &&
                        selectedConditionForPopover.right.column ===
                          column.name;

                      return (
                        <MenuItem
                          key={`column:${column.name}`}
                          disabled={!popoverAllowsColumn}
                          onClick={() => {
                            setConditionRightColumn(
                              selectedConditionForPopover.id,
                              column.name
                            );
                            handlePopoverClose();
                          }}
                          sx={{
                            minHeight: 30,
                            mx: 0.5,
                            my: 0.25,
                            px: 1.25,
                            borderRadius: '7px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            backgroundColor: isSelected
                              ? '#eef2ff'
                              : 'transparent',
                            '&:hover': {
                              backgroundColor: isSelected
                                ? '#eef2ff'
                                : '#f9fafb',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: isSelected ? '#4338ca' : '#374151',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {column.name}
                          </Typography>
                          <Box
                            component='span'
                            sx={{
                              px: '6px',
                              py: '1px',
                              borderRadius: '4px',
                              fontSize: 9,
                              fontWeight: 600,
                              lineHeight: 1.2,
                              backgroundColor: typeColor.bg,
                              color: typeColor.text,
                              flexShrink: 0,
                            }}
                          >
                            {String(column.dtype ?? '')}
                          </Box>
                        </MenuItem>
                      );
                    })()
                  )}
                </>
              )}

              {!popoverAllowsColumn && (
                <Typography
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: 10,
                    color: '#9ca3af',
                  }}
                >
                  Для оператора `{selectedConditionForPopover.operator}` справа
                  разрешен только literal или expression.
                </Typography>
              )}

              {variables.length === 0 && (
                <Typography
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    fontSize: 10,
                    color: '#9ca3af',
                  }}
                >
                  Переменные не найдены.
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};
