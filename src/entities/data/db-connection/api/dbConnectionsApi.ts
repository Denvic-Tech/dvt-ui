import {
  client,
  type ConnectionCheckResult,
  type ConnectionKindInfoResponse,
  type ConnectionTypeInfoResponse,
} from '@/shared/gatewayClient';

import type {
  DBConnectionCreatePayload,
  DBConnectionListParams,
  DBConnectionRecord,
  DBConnectionUpdatePayload,
} from '../model/types';

export const dbConnectionsApi = {
  async kinds(): Promise<ConnectionKindInfoResponse[]> {
    const response = await client.dbConnections.kinds.get();
    return response.data as ConnectionKindInfoResponse[];
  },

  async types(): Promise<ConnectionTypeInfoResponse[]> {
    const response = await client.dbConnections.types.get();
    return response.data as ConnectionTypeInfoResponse[];
  },

  async list(params?: DBConnectionListParams): Promise<DBConnectionRecord[]> {
    const response = await client.dbConnections.get(
      params
        ? {
            query: {
              ...params,
            },
          }
        : undefined
    );

    return response.data as unknown as DBConnectionRecord[];
  },

  async create(
    payload: DBConnectionCreatePayload
  ): Promise<DBConnectionRecord> {
    const response = await client.dbConnections.post({
      body: payload as never,
    });

    return response.data as unknown as DBConnectionRecord;
  },

  async get(connectionId: string): Promise<DBConnectionRecord> {
    const response = await client.dbConnections
      .connectionId(connectionId)
      .get();

    return response.data as unknown as DBConnectionRecord;
  },

  async update(
    connectionId: string,
    payload: DBConnectionUpdatePayload
  ): Promise<DBConnectionRecord> {
    const response = await client.dbConnections
      .connectionId(connectionId)
      .patch({
        body: payload as never,
      });

    return response.data as unknown as DBConnectionRecord;
  },

  async remove(connectionId: string): Promise<DBConnectionRecord> {
    const response = await client.dbConnections
      .connectionId(connectionId)
      .delete();

    return response.data as unknown as DBConnectionRecord;
  },

  async refreshCatalog(connectionId: string): Promise<string> {
    const response = await client.dbConnections
      .connectionId(connectionId)
      .catalog.refresh.post(undefined, { silent: true });
    return response.data.catalog_version;
  },

  async checkByPayload(
    payload: DBConnectionCreatePayload,
    signal?: AbortSignal
  ): Promise<ConnectionCheckResult> {
    const response = await client.dbConnections.check.post({
      body: payload as never,
      ...(signal ? { signal } : {}),
    });

    return response.data;
  },

  async checkById(
    connectionId: string,
    payload?: DBConnectionUpdatePayload,
    signal?: AbortSignal
  ): Promise<ConnectionCheckResult> {
    const response = await client.dbConnections
      .connectionId(connectionId)
      .check.post({
        body: payload ? (payload as never) : ({} as never),
        ...(signal ? { signal } : {}),
      });

    return response.data;
  },
};
