import { v4 as uuid4 } from 'uuid';

import type { CustomEdgeType, CustomNodeData, GraphSliceState } from './types';

export function buildConnections(edges: CustomEdgeType[]) {
  const outputsBySourceNodeID: GraphSliceState['outputsBySourceNodeID'] = {};
  const inputsByTargetNodeID: GraphSliceState['inputsByTargetNodeID'] = {};

  for (const edge of edges) {
    const sourceNodeID = edge.source;
    const targetNodeID = edge.target;
    const sourceHandle = edge.sourceHandle?.replace(/^output-/, '');
    const targetHandle = edge.targetHandle?.replace(/^input-/, '');

    if (!sourceNodeID || !targetNodeID || !sourceHandle || !targetHandle) {
      continue;
    }

    if (!outputsBySourceNodeID[sourceNodeID]) {
      outputsBySourceNodeID[sourceNodeID] = {};
    }
    outputsBySourceNodeID[sourceNodeID][sourceHandle] = {
      nodeID: targetNodeID,
      inputName: targetHandle,
    };

    if (!inputsByTargetNodeID[targetNodeID]) {
      inputsByTargetNodeID[targetNodeID] = {};
    }
    inputsByTargetNodeID[targetNodeID][targetHandle] = {
      nodeID: sourceNodeID,
      outputName: sourceHandle,
    };
  }

  return { outputsBySourceNodeID, inputsByTargetNodeID };
}

export function pruneConnections(
  state: GraphSliceState,
  nodeIDsToRemove: Set<string>
) {
  // Удаляем исходящие связи удалённых узлов
  for (const nodeID of nodeIDsToRemove) {
    delete state.outputsBySourceNodeID[nodeID];
    delete state.inputsByTargetNodeID[nodeID];
  }

  // Очищаем входящие связи для остальных узлов
  for (const [sourceNodeID, outputs] of Object.entries(
    state.outputsBySourceNodeID
  )) {
    const nextOutputs = Object.fromEntries(
      Object.entries(outputs).filter(
        ([, output]) => !nodeIDsToRemove.has(output.nodeID)
      )
    );
    if (Object.keys(nextOutputs).length === 0) {
      delete state.outputsBySourceNodeID[sourceNodeID];
    } else {
      state.outputsBySourceNodeID[sourceNodeID] = nextOutputs;
    }
  }

  for (const [targetNodeID, inputs] of Object.entries(
    state.inputsByTargetNodeID
  )) {
    const nextInputs = Object.fromEntries(
      Object.entries(inputs).filter(
        ([, input]) => !nodeIDsToRemove.has(input.nodeID)
      )
    );
    if (Object.keys(nextInputs).length === 0) {
      delete state.inputsByTargetNodeID[targetNodeID];
    } else {
      state.inputsByTargetNodeID[targetNodeID] = nextInputs;
    }
  }
}
export const generateShortNodeID = (): string => {
  return `node_${uuid4()}`;
};

export const generateShortEdgeID = (): string => {
  return `edge_${uuid4()}`;
};

export const generateShortSubgraphID = (): string => {
  return `subgraph_${uuid4()}`;
};

export const generateRandomSubgraphColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20);
  const lightness = 45 + Math.floor(Math.random() * 15);

  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  const hueToRgb = (p: number, q: number, t: number): number => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = l;
    g = l;
    b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  const toHex = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const generateShortGraphEntityID = (
  entityType: 'node' | 'edge' | 'subgraph'
) => {
  return `${entityType}_${uuid4()}`;
};

export const applyCustomNodeDataDefaults = (
  data: CustomNodeData
): CustomNodeData => ({
  ...data,
  showVariablesIo: data.showVariablesIo ?? false,
});
