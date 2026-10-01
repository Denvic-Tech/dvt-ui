import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import type {
  ArrowTypeMetadata,
  VariableMapMetadata,
} from '@/shared/gatewayClient';
import { zEvent } from '@/shared/gatewayClient';

import { DTypeMetadataDetails } from './components/DTypeMetadataDetails';
import { VariableMapMetadataPanel } from './VariableMapMetadataPanel';

const arrowType: ArrowTypeMetadata = {
  kind: 'list',
  fields: [
    {
      name: 'item',
      type: {
        kind: 'struct',
        fields: [
          { name: 'key', type: { kind: 'scalar', name: 'string' } },
          { name: 'value', type: { kind: 'scalar', name: 'binary' } },
        ],
      },
    },
  ],
};

it('renders recursive Arrow metadata independently of row data', () => {
  render(
    <DTypeMetadataDetails
      dtypeMetadata={{
        class: 'ArrowDtype',
        name: 'list',
        origin: 'pandas',
        arrow_type: arrowType,
      }}
    />
  );
  expect(
    screen.getByText('list<item: struct<key: string, value: binary>>')
  ).toBeInTheDocument();
});

it('renders unresolved then resolved Kafka variables from generated event schemas', () => {
  const metadata = (state: 'unresolved' | 'resolved'): VariableMapMetadata => {
    const parsed = zEvent.parse({
      type: 'NODE_METADATA',
      project_id: 'project',
      task_id: 'task',
      node_id: 'read',
      metadata: {
        output_variables: {
          type: 'VARIABLE_MAP',
          variables: [
            {
              name: 'kafka_offsets',
              type: 'JSON',
              var_type: 'system',
              value_state: state,
            },
          ],
        },
      },
    });
    if (parsed.type !== 'NODE_METADATA') throw new Error('Unexpected event');
    return parsed.metadata['output_variables'] as VariableMapMetadata;
  };
  const { rerender } = render(
    <VariableMapMetadataPanel metadata={metadata('unresolved')} />
  );
  expect(screen.getByText('unresolved')).toBeInTheDocument();
  rerender(<VariableMapMetadataPanel metadata={metadata('resolved')} />);
  expect(screen.getByText('resolved')).toBeInTheDocument();
  expect(screen.queryByText('unresolved')).not.toBeInTheDocument();
});
