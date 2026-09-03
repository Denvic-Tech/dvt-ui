import type {
  DBConnectionFieldDescriptor,
  DBConnectionFieldKind,
  DBConnectionJsonSchema,
  DBConnectionSectionKey,
} from './types';

type SchemaNode = DBConnectionJsonSchema & {
  $defs?: Record<string, SchemaNode>;
  $ref?: string;
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  type?: string | string[];
  enum?: unknown[];
  items?: SchemaNode;
  title?: string;
  description?: string;
  default?: unknown;
};

const asSchemaNode = (schema: DBConnectionJsonSchema | null | undefined) =>
  (schema ?? {}) as SchemaNode;

const mergeSchemaMetadata = (
  base: SchemaNode,
  wrapper: SchemaNode
): SchemaNode => {
  const merged: SchemaNode = { ...base };
  const title = wrapper.title ?? base.title;
  const description = wrapper.description ?? base.description;
  const defaultValue = wrapper.default ?? base.default;

  if (title !== undefined) {
    merged.title = title;
  }

  if (description !== undefined) {
    merged.description = description;
  }

  if (defaultValue !== undefined) {
    merged.default = defaultValue;
  }

  return merged;
};

const resolveRef = (root: SchemaNode, schema: SchemaNode): SchemaNode => {
  if (!schema.$ref?.startsWith('#/$defs/')) {
    return schema;
  }

  const refName = schema.$ref.replace('#/$defs/', '');
  const resolved = root.$defs?.[refName];

  if (!resolved) {
    return schema;
  }

  return mergeSchemaMetadata(resolved, schema);
};

const isNullSchemaNode = (schema: SchemaNode) =>
  asSchemaNode(schema).type === 'null';

const resolveObjectVariants = (
  root: SchemaNode,
  schema: SchemaNode
): SchemaNode[] => {
  const resolved = resolveRef(root, schema);

  if (resolved.properties) {
    return [resolved];
  }

  const variants = resolved.anyOf ?? resolved.oneOf;

  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .filter(item => !isNullSchemaNode(item))
    .map(item => resolveRef(root, item))
    .filter(item => Boolean(item.properties));
};

const resolveNullableNode = (
  root: SchemaNode,
  schema: SchemaNode
): { node: SchemaNode; nullable: boolean } => {
  const resolved = resolveRef(root, schema);
  const anyOf = resolved.anyOf;

  if (!Array.isArray(anyOf) || anyOf.length === 0) {
    return { node: resolved, nullable: false };
  }

  const nonNull = anyOf.filter(item => !isNullSchemaNode(item)) as SchemaNode[];
  const nullable = nonNull.length !== anyOf.length;

  if (nonNull.length === 1) {
    const unwrappedNode = resolveRef(root, nonNull[0]);

    return {
      node: mergeSchemaMetadata(unwrappedNode, resolved),
      nullable,
    };
  }

  return {
    node: resolved,
    nullable,
  };
};

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase());

const resolveFieldKind = (
  root: SchemaNode,
  schema: SchemaNode
): DBConnectionFieldKind => {
  const { node } = resolveNullableNode(root, schema);
  const type = Array.isArray(node.type) ? node.type[0] : node.type;

  if (Array.isArray(node.enum) && node.enum.length > 0) {
    return 'select';
  }

  if (type === 'boolean') {
    return 'boolean';
  }

  if (type === 'integer' || type === 'number') {
    return 'number';
  }

  if (type === 'array') {
    const itemType = Array.isArray(node.items?.type)
      ? node.items?.type[0]
      : node.items?.type;

    return itemType === 'string' ? 'array' : 'json';
  }

  if (type === 'object') {
    return 'json';
  }

  return 'text';
};

const resolveRootFields = (root: SchemaNode) => {
  const variants = resolveObjectVariants(root, root);
  const properties: Record<string, SchemaNode> = {};
  const requiredFields = new Map<string, { total: number; required: number }>();

  variants.forEach(variant => {
    const variantRequired = new Set(variant.required ?? []);

    Object.entries(variant.properties ?? {}).forEach(([name, rawSchema]) => {
      properties[name] ??= rawSchema;

      const requiredStats = requiredFields.get(name) ?? {
        total: 0,
        required: 0,
      };

      requiredStats.total += 1;
      requiredStats.required += variantRequired.has(name) ? 1 : 0;
      requiredFields.set(name, requiredStats);
    });
  });

  return {
    properties,
    required: new Set(
      [...requiredFields.entries()]
        .filter(([, stats]) => stats.required === stats.total)
        .map(([name]) => name)
    ),
  };
};

export const buildFieldDescriptors = (
  section: DBConnectionSectionKey,
  schema: DBConnectionJsonSchema | null | undefined
): DBConnectionFieldDescriptor[] => {
  const root = asSchemaNode(schema);
  const { properties, required } = resolveRootFields(root);

  return Object.entries(properties).map(([name, rawSchema]) => {
    const { node, nullable } = resolveNullableNode(root, rawSchema);

    return {
      section,
      name,
      label: node.title || toTitleCase(name),
      description: node.description,
      required: required.has(name),
      nullable,
      kind: resolveFieldKind(root, node),
      enumOptions: Array.isArray(node.enum)
        ? node.enum.map(option => ({
            label: String(option),
            value: String(option),
          }))
        : undefined,
      defaultValue: node.default,
    };
  });
};
