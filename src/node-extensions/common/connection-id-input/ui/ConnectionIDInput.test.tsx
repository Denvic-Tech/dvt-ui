import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { makeConst } from '@/shared/lib/node-input-values';

import { ConnectionIDInput } from './ConnectionIDInput';

vi.mock('@/entities/data/db-connection', () => ({
  ConnectionLogo: () => null,
  formatConnectionIssueSummary: () => '',
  isBrokenConnection: () => false,
  useConnections: () => ({
    loading: false,
    fetchConnections: vi.fn(),
    connections: [
      { id: 'kafka-1', name: 'Orders Kafka', kind: 'queue', type: 'kafka' },
      { id: 'sql-1', name: 'PostgreSQL', kind: 'sql', type: 'postgres' },
      { id: 'queue-1', name: 'Other queue', kind: 'queue', type: 'rabbitmq' },
    ],
  }),
}));

describe('Kafka connection selector', () => {
  it('offers only Kafka records and emits the selected catalog ID', () => {
    const onChange = vi.fn();
    render(
      <ConnectionIDInput
        nodeId='kafka'
        nodeName='GetExistKafkaConnection'
        inputDefinition={
          {
            type: 'KAFKA_CONNECTION_ID',
            attr_name: 'connection_id',
          } as InputDefinitionModel
        }
        value={makeConst(null)}
        onChange={onChange}
        context='modal'
        variables={[]}
      />
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(
      screen.getByRole('option', { name: 'Orders Kafka (kafka)' })
    );
    expect(onChange).toHaveBeenCalledWith(makeConst('kafka-1'));
    expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument();
    expect(screen.queryByText('Other queue')).not.toBeInTheDocument();
  });
});
