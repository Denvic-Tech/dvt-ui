import { zIo, NodeDefinition, NodeInputValue } from '@/shared/gatewayClient';
import { makeConst } from '@/shared/lib/node-input-values';

/**
 * Build initial input values for a node definition using defaults from schema.
 */
export const buildInitialInputValues = (
  nodeDefinition: NodeDefinition
): Record<string, NodeInputValue> => {
  const initialValues: Record<string, NodeInputValue> = {};

  const inputDefinitions = Object.values(
    nodeDefinition.input_definitions ?? {}
  );
  if (!inputDefinitions.length) {
    return initialValues;
  }

  inputDefinitions.forEach(inputDef => {
    if (inputDef.default !== undefined) {
      initialValues[inputDef.attr_name] = makeConst(inputDef.default);
      return;
    }

    switch (inputDef.type) {
      case zIo.enum.STRING: {
        initialValues[inputDef.attr_name] = makeConst('');
        break;
      }
      case zIo.enum.INT: {
        initialValues[inputDef.attr_name] = makeConst(0);
        break;
      }
      case zIo.enum.FLOAT: {
        initialValues[inputDef.attr_name] = makeConst(0);
        break;
      }
      case zIo.enum.BOOLEAN: {
        initialValues[inputDef.attr_name] = makeConst(false);
        break;
      }
      default: {
        initialValues[inputDef.attr_name] = makeConst(null);
        break;
      }
    }
  });

  return initialValues;
};
