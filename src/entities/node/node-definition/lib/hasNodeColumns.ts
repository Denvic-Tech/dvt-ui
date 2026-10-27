import type { NodeDefinition } from '@/shared/gatewayClient';

type PortDefinition = { type?: unknown };

const acceptsDataframe = (definition: PortDefinition) =>
  Array.isArray(definition.type)
    ? definition.type.includes('DATAFRAME')
    : definition.type === 'DATAFRAME';

/**
 * У ноды есть колонки для просмотра lineage: она принимает или отдаёт
 * DataFrame и не относится к виджетам. У синков выхода нет — тогда бэкенд
 * отдаёт состав колонок на входе.
 */
export const hasNodeColumns = (
  definition: NodeDefinition | null | undefined
): boolean => {
  if (!definition || definition.category === 'Widgets') {
    return false;
  }

  return (
    Object.values(definition.output_definitions ?? {}).some(acceptsDataframe) ||
    Object.values(definition.input_definitions ?? {}).some(acceptsDataframe)
  );
};
