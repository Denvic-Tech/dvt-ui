import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lineageApi } from './lineageApi';

const { getFieldsMock, patchColumnsMock } = vi.hoisted(() => ({
  getFieldsMock: vi.fn(),
  patchColumnsMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    projects: {
      projectId: () => ({
        lineage: {
          nodes: {
            nodeId: (nodeId: string) => ({
              fields: {
                get: (...args: unknown[]) => getFieldsMock(nodeId, ...args),
              },
              columns: {
                patch: (...args: unknown[]) =>
                  patchColumnsMock(nodeId, ...args),
              },
            }),
          },
        },
      }),
    },
  },
}));

const field = (name: string, description: string | null) => ({
  name,
  ref: { key: `node:n-1:out:${name}`, kind: 'node' as const },
  origin: { key: `node:n-1:out:${name}`, kind: 'node' as const },
  op: 'pass' as const,
  description,
  description_provenance: description
    ? ('declared' as const)
    : ('none' as const),
});

const nodeFields = (description: string | null) => ({
  project_id: 'p-1',
  node_id: 'n-1',
  node_name: 'Filter',
  port: 'out',
  role: 'output' as const,
  status: 'resolved' as const,
  available_ports: ['out'],
  fields: [field('amount', description)],
});

const createStore = () =>
  configureStore({
    reducer: { [lineageApi.reducerPath]: lineageApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(lineageApi.middleware),
  });

describe('lineageApi.setNodeColumnDescriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFieldsMock.mockResolvedValue({ data: nodeFields(null) });
    patchColumnsMock.mockResolvedValue({ data: nodeFields('Сумма заказа') });
  });

  it('sends PATCH body and puts the response into the node fields cache', async () => {
    const store = createStore();
    const fieldsArg = { projectId: 'p-1', nodeId: 'n-1', port: null };

    const subscription = store.dispatch(
      lineageApi.endpoints.getNodeFields.initiate(fieldsArg)
    );
    await subscription;

    await store.dispatch(
      lineageApi.endpoints.setNodeColumnDescriptions.initiate({
        projectId: 'p-1',
        nodeId: 'n-1',
        port: 'out',
        fields: [{ column: 'amount', description: 'Сумма заказа' }],
      })
    );

    expect(patchColumnsMock).toHaveBeenCalledWith(
      'n-1',
      {
        body: {
          port: 'out',
          fields: [{ column: 'amount', description: 'Сумма заказа' }],
        },
      },
      expect.objectContaining({ silent: true })
    );

    await vi.waitFor(() => {
      const cached = lineageApi.endpoints.getNodeFields.select(fieldsArg)(
        store.getState()
      ).data;
      expect(cached?.fields?.[0]?.description).toBe('Сумма заказа');
    });
    // Кэш обновлён ответом PATCH, без повторного GET.
    expect(getFieldsMock).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });
});
