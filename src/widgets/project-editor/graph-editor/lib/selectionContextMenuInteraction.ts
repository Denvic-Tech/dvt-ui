export const getReactFlowNodeIDFromTarget = (
  target: EventTarget | null
): string | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  const nodeElement = target.closest('.react-flow__node');
  const nodeID = nodeElement?.getAttribute('data-id') ?? null;

  return nodeID && nodeID.length > 0 ? nodeID : null;
};

export const isGraphContextMenuBlockedTarget = (
  target: EventTarget | null
): boolean => {
  if (target instanceof Element && target.closest('.react-flow__handle')) {
    return true;
  }

  if (
    target instanceof Element &&
    target.closest(
      [
        '[data-node-context-menu-root="true"]',
        '[data-multi-node-context-menu-root="true"]',
        '[data-subgraph-context-menu-root="true"]',
        '.MuiDialog-root',
        '.MuiMenu-root',
        '.MuiPopover-root',
      ].join(',')
    )
  ) {
    return true;
  }

  return false;
};

export const shouldOpenMultiSelectionContextMenu = (
  target: EventTarget | null,
  selectedNodeIDs: readonly string[]
): boolean => isContextMenuTargetInsideMultiSelection(target, selectedNodeIDs);

export const isContextMenuTargetInsideMultiSelection = (
  target: EventTarget | null,
  selectedNodeIDs: readonly string[]
): boolean => {
  if (selectedNodeIDs.length < 2 || isGraphContextMenuBlockedTarget(target)) {
    return false;
  }

  const nodeID = getReactFlowNodeIDFromTarget(target);
  return Boolean(nodeID && selectedNodeIDs.includes(nodeID));
};
