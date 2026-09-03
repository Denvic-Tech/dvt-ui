import type { InputDefinitionModel, Io } from '@/shared/gatewayClient';
import { zIo } from '@/shared/gatewayClient';
import type { VariableType } from '@/shared/lib/variables';

type IoLike = string | string[];

const getBaseIoType = (type: Io | Io[]): Io =>
  Array.isArray(type) ? type[0] : type;

export const expandIoTypes = (type: IoLike): string[] => {
  const types = Array.isArray(type) ? type : [type];

  return types.flatMap(item => {
    if (!item.includes(',')) {
      return item;
    }

    return item
      .split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0);
  });
};

export const isIoTypeCompatible = (
  sourceType: IoLike,
  targetType: IoLike
): boolean => {
  const sourceTypes = expandIoTypes(sourceType);
  const targetTypes = expandIoTypes(targetType);

  if (sourceTypes.includes('*') || targetTypes.includes('*')) {
    return true;
  }

  return sourceTypes.some(type => targetTypes.includes(type));
};

export const getDefaultValueForTypeInternal = (type: Io | Io[]): unknown => {
  switch (getBaseIoType(type)) {
    case zIo.enum.STRING:
    case zIo.enum.PRIMITIVE:
    case zIo.enum.TIMEDELTA:
      return '';
    case zIo.enum.INT:
      return 0;
    case zIo.enum.FLOAT:
      return 0.0;
    case zIo.enum.BOOLEAN:
      return false;
    case zIo.enum.DICT:
    case zIo.enum.JSON:
      return {};
    case zIo.enum.DATETIME:
      return null;
    default:
      return null;
  }
};

export const getCompatibleVariableTypes = (type: Io | Io[]): VariableType[] => {
  switch (getBaseIoType(type)) {
    case zIo.enum.STRING:
      return ['STRING'];
    case zIo.enum.INT:
      return ['INT'];
    case zIo.enum.FLOAT:
      return ['FLOAT', 'INT'];
    case zIo.enum.BOOLEAN:
      return ['BOOLEAN'];
    case zIo.enum.DATETIME:
      return ['DATETIME'];
    default:
      return [];
  }
};

export const getClearedValueByType = (
  type: InputDefinitionModel['type'] | undefined
): unknown => {
  switch (type) {
    case zIo.enum.BOOLEAN:
      return false;
    case zIo.enum.DATETIME:
      return null;
    case zIo.enum.TIMEDELTA:
    case zIo.enum.INT:
    case zIo.enum.FLOAT:
    case zIo.enum.STRING:
    case zIo.enum.PRIMITIVE:
      return '';
    default:
      return null;
  }
};

export const parseConstValue = (
  rawValue: string,
  inputDefinition: InputDefinitionModel | null | undefined
): unknown => {
  if (!inputDefinition) {
    return rawValue;
  }

  if (inputDefinition.type === zIo.enum.INT) {
    if (!rawValue.trim()) {
      return null;
    }

    const parsedInt = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsedInt)) {
      return null;
    }

    let nextInt = parsedInt;
    if (
      inputDefinition.min_value !== undefined &&
      inputDefinition.min_value !== null &&
      nextInt < inputDefinition.min_value
    ) {
      nextInt = inputDefinition.min_value;
    }
    if (
      inputDefinition.max_value !== undefined &&
      inputDefinition.max_value !== null &&
      nextInt > inputDefinition.max_value
    ) {
      nextInt = inputDefinition.max_value;
    }

    return nextInt;
  }

  if (inputDefinition.type === zIo.enum.FLOAT) {
    if (!rawValue.trim()) {
      return null;
    }

    const parsedFloat = Number.parseFloat(rawValue);
    if (Number.isNaN(parsedFloat)) {
      return null;
    }

    let nextFloat = parsedFloat;
    if (
      inputDefinition.min_value !== undefined &&
      inputDefinition.min_value !== null &&
      nextFloat < inputDefinition.min_value
    ) {
      nextFloat = inputDefinition.min_value;
    }
    if (
      inputDefinition.max_value !== undefined &&
      inputDefinition.max_value !== null &&
      nextFloat > inputDefinition.max_value
    ) {
      nextFloat = inputDefinition.max_value;
    }
    if (
      inputDefinition.round_val !== undefined &&
      inputDefinition.round_val !== null &&
      inputDefinition.round_val >= 0
    ) {
      nextFloat = Number.parseFloat(
        nextFloat.toFixed(inputDefinition.round_val)
      );
    }

    return nextFloat;
  }

  if (inputDefinition.type === zIo.enum.BOOLEAN) {
    return rawValue.trim().toLowerCase() === 'true';
  }

  return rawValue;
};
