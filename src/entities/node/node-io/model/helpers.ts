import { IO_TYPE_COLORS } from '@/shared/colors';
import { InputDefinitionModel, Io } from '@/shared/gatewayClient';

import {
  CONNECTION_REQUIRED_TYPES,
  HAS_WIDGET_TYPES,
  PRIMITIVE_TYPES,
} from './constants';

const primitiveTypeSet: ReadonlySet<Io> = new Set(PRIMITIVE_TYPES as Io[]);

export const isPrimitiveIOType = (type: Io | Io[]): boolean => {
  if (Array.isArray(type)) {
    return type.every(subType => primitiveTypeSet.has(subType));
  }

  return primitiveTypeSet.has(type);
};

export const getIOTypeColor = (type: Io | Io[]) => {
  if (Array.isArray(type) && type.length > 0) {
    return IO_TYPE_COLORS[type[0]];
  }
  return IO_TYPE_COLORS[type as Io];
};

export function isPrimitiveType(
  type: InputDefinitionModel['type']
): type is (typeof PRIMITIVE_TYPES)[number] {
  if (typeof type === 'string') {
    return PRIMITIVE_TYPES.includes(type as any);
  }
  return false;
}

export function isConnectRequiredType(inputDef: InputDefinitionModel): boolean {
  const type = inputDef.type;

  if (typeof type === 'string') {
    if (
      type === 'SCHEMA' &&
      inputDef.schema &&
      inputDef.schema['title'] === 'DBConnection'
    ) {
      return true;
    }
    return CONNECTION_REQUIRED_TYPES.includes(type as any);
  }
  return false;
}

export function shouldCheckInputConnection(
  inputDef: InputDefinitionModel
): boolean {
  return Boolean(inputDef.use_connection) && isConnectRequiredType(inputDef);
}

export function requiresConnectedNodeMetadata(
  inputDef: InputDefinitionModel
): boolean {
  if (!isConnectRequiredType(inputDef)) {
    return false;
  }

  const type = inputDef.type;
  if (Array.isArray(type)) {
    return !(
      type.length === 1 &&
      (type[0] === 'VARIABLE' || type[0] === 'SIGNAL')
    );
  }

  return type !== 'VARIABLE' && type !== 'SIGNAL';
}

export function isWidgetType(
  type: InputDefinitionModel['type']
): type is (typeof HAS_WIDGET_TYPES)[number] {
  if (typeof type === 'string') {
    return HAS_WIDGET_TYPES.includes(type as any);
  }
  return false;
}
