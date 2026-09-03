import { Edge } from '@xyflow/react';

import {
  CustomNodeData,
  CustomNodeType,
} from '@/entities/project-editor/graph';

export function isCustomNodeData(data: any): data is CustomNodeData {
  if (typeof data !== 'object' || data === null) return false;

  if (typeof data.name !== 'string' || data.name.length === 0) return false;

  if (!('displayName' in data) || typeof data.displayName !== 'string') {
    return false;
  }

  const valuesObj =
    'inputValues' in data
      ? data.inputValues
      : 'values' in data
        ? data.values
        : undefined;

  if (typeof valuesObj !== 'object' || valuesObj === null) return false;

  if ('isConnected' in data) {
    if (typeof data.isConnected !== 'object' || data.isConnected === null)
      return false;
    for (const key in data.isConnected) {
      if (Object.prototype.hasOwnProperty.call(data.isConnected, key)) {
        if (typeof data.isConnected[key] !== 'boolean') return false;
      }
    }
  }

  return true;
}

export function isCustomNodeType(node: any): node is CustomNodeType {
  if (typeof node !== 'object' || node === null) return false;

  if (typeof node.id !== 'string' || node.id.length === 0) {
    console.error(`[isCustomNodeType]: Missing "id" field: ${node?.id}`);
    return false;
  }

  if (typeof node.position !== 'object' || node.position === null) {
    console.error(`[isCustomNodeType]: Invalid "position": ${node?.position}`);
    return false;
  }
  if (
    typeof node.position.x !== 'number' ||
    typeof node.position.y !== 'number'
  ) {
    console.error(
      `[isCustomNodeType]: Invalid "position" coords: ${node?.position}`
    );
    return false;
  }

  if (!isCustomNodeData(node.data)) return false;

  if ('width' in node && typeof node.width !== 'number') return false;
  if ('height' in node && typeof node.height !== 'number') return false;
  if ('selected' in node && typeof node.selected !== 'boolean') return false;
  if ('dragging' in node && typeof node.dragging !== 'boolean') return false;
  if ('targetPosition' in node && typeof node.targetPosition !== 'string')
    return false;
  if ('sourcePosition' in node && typeof node.sourcePosition !== 'string')
    return false;
  if ('hidden' in node && typeof node.hidden !== 'boolean') return false;
  if ('deletable' in node && typeof node.deletable !== 'boolean') return false;
  if ('focusable' in node && typeof node.focusable !== 'boolean') return false;

  return true;
}

export function isCustomEdgeType(edge: any): edge is Edge {
  if (typeof edge !== 'object' || edge === null) return false;

  if (typeof edge.id !== 'string' || edge.id.length === 0) return false;
  if (typeof edge.source !== 'string' || edge.source.length === 0) return false;
  if (typeof edge.target !== 'string' || edge.target.length === 0) return false;
  if (typeof edge.sourceHandle !== 'string' || edge.sourceHandle.length === 0)
    return false;
  if (typeof edge.targetHandle !== 'string' || edge.targetHandle.length === 0)
    return false;
  return true;
}
