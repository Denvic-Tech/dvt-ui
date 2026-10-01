import type { ArrowTypeMetadata } from '@/shared/gatewayClient';

export const formatArrowType = (type: ArrowTypeMetadata): string => {
  const fields = type.fields ?? [];
  const formatField = (field: (typeof fields)[number]) =>
    `${field.name}: ${formatArrowType(field.type)}${field.nullable === false ? ' not null' : ''}`;
  switch (type.kind) {
    case 'scalar':
      return type.name ?? 'scalar';
    case 'struct':
      return `struct<${fields.map(formatField).join(', ')}>`;
    case 'list':
    case 'large_list':
    case 'fixed_size_list':
      return `${type.kind}<${fields.map(formatField).join(', ')}>${type.size == null ? '' : `[${type.size}]`}`;
    case 'timestamp':
      return `timestamp[${type.unit}${type.timezone ? `, ${type.timezone}` : ''}]`;
    case 'duration':
      return `duration[${type.unit}]`;
    case 'decimal':
      return `decimal${type.name ?? ''}(${type.precision}, ${type.scale})`;
    case 'fixed_size_binary':
      return `fixed_size_binary[${type.size}]`;
  }
};
