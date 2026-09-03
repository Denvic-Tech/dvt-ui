import { NodeDefinition } from '@/shared/gatewayClient';

const searchableNodeFields = (
  nodeDefinition: Pick<
    NodeDefinition,
    'display_name' | 'name' | 'category' | 'description'
  >
): string[] => [
  nodeDefinition.display_name,
  nodeDefinition.name,
  nodeDefinition.category,
  nodeDefinition.description,
].filter((value): value is string => Boolean(value));

export const matchesNodeSearch = (
  nodeDefinition: Pick<
    NodeDefinition,
    'display_name' | 'name' | 'category' | 'description'
  >,
  searchTerm: string
): boolean => {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return true;
  }

  return searchableNodeFields(nodeDefinition).some(field =>
    field.toLowerCase().includes(normalizedTerm)
  );
};
