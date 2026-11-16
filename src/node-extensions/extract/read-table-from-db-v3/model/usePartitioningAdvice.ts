import { useCallback, useEffect, useRef, useState } from 'react';

import { dbConnectionsApi } from '@/entities/data/db-connection/api/dbConnectionsApi';
import {
  getDbCatalogConnectionId,
  normalizeDbCatalogParentNames,
} from '@/entities/data/db-connection/model/catalogNormalizers';

import {
  buildPartitioningAdviceRequest,
  isSamePartitioningSettings,
  type PartitioningSettings,
  pickPartitioningSettings,
  resolvePartitioningAdvice,
} from '../lib/partitioningAdvice';
import type { ReadTableFromDBV3Values } from '../lib/types';

import type { ReadTableFromDBV3Form } from './useReadTableFromDBV3Form';

export type PartitioningAdviceStatus =
  | 'idle'
  | 'loading'
  | 'applied'
  | 'same'
  | 'error';

/** Сколько висит «Текущие настройки уже оптимальны» перед возвратом ссылки. */
export const SAME_SETTINGS_NOTICE_MS = 2500;

type AdviceState = {
  /** Таблица, к которой относится состояние: при смене оно сбрасывается. */
  key: string;
  status: PartitioningAdviceStatus;
  /** Значения полей до подстановки — их возвращает «Отменить». */
  previous: PartitioningSettings | null;
};

type UsePartitioningAdviceArgs = {
  form: ReadTableFromDBV3Form;
  values: ReadTableFromDBV3Values | undefined;
};

/**
 * «Подобрать настройки»: запрашивает рекомендацию для выбранной таблицы
 * и сразу подставляет колонку сегментации и группировку. Ответ для таблицы,
 * которую уже сменили, отбрасывается.
 */
export const usePartitioningAdvice = ({
  form,
  values,
}: UsePartitioningAdviceArgs) => {
  const connectionId = getDbCatalogConnectionId(form.inputMetadata);
  const { databaseName, schemaName } = normalizeDbCatalogParentNames(
    form.catalogCapabilities,
    form.literalDatabaseName,
    form.literalSchemaName
  );
  const tableName = form.literalTableName;
  const targetKey = JSON.stringify([
    connectionId,
    databaseName,
    schemaName,
    tableName,
  ]);

  const [state, setState] = useState<AdviceState>({
    key: targetKey,
    status: 'idle',
    previous: null,
  });
  const isCurrent = state.key === targetKey;
  const status: PartitioningAdviceStatus = isCurrent ? state.status : 'idle';

  const controllerRef = useRef<AbortController | null>(null);
  // Ответ приходит позже клика: сравнивать и запоминать нужно значения
  // полей на момент ответа, а не на момент запроса.
  const latestRef = useRef({
    values,
    columns: form.availableColumns,
    apply: form.applyPartitioningSettings,
  });
  useEffect(() => {
    latestRef.current = {
      values,
      columns: form.availableColumns,
      apply: form.applyPartitioningSettings,
    };
  }, [form.applyPartitioningSettings, form.availableColumns, values]);

  // Смена таблицы и закрытие панели отменяют незавершённый запрос.
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [targetKey]
  );

  useEffect(() => {
    if (status !== 'same') return undefined;
    const timer = setTimeout(() => {
      setState(current =>
        current.status === 'same' ? { ...current, status: 'idle' } : current
      );
    }, SAME_SETTINGS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const run = useCallback(async () => {
    if (!connectionId || !tableName || controllerRef.current) return;

    const key = targetKey;
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ key, status: 'loading', previous: null });

    try {
      const response = await dbConnectionsApi.partitioningAdvice(
        connectionId,
        buildPartitioningAdviceRequest(
          { databaseName, schemaName, tableName },
          latestRef.current.values
        ),
        controller.signal
      );
      if (controller.signal.aborted) return;

      const latest = latestRef.current;
      const advice = resolvePartitioningAdvice(response, latest.columns);
      if (!advice) {
        setState({ key, status: 'error', previous: null });
        return;
      }

      const current = pickPartitioningSettings(latest.values);
      if (isSamePartitioningSettings(current, advice)) {
        setState({ key, status: 'same', previous: null });
        return;
      }

      latest.apply(advice);
      setState({ key, status: 'applied', previous: current });
    } catch {
      if (!controller.signal.aborted) {
        setState({ key, status: 'error', previous: null });
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, [connectionId, databaseName, schemaName, tableName, targetKey]);

  const undo = useCallback(() => {
    if (!isCurrent || !state.previous) return;
    latestRef.current.apply(state.previous);
    setState({ key: targetKey, status: 'idle', previous: null });
  }, [isCurrent, state.previous, targetKey]);

  return {
    isAvailable: Boolean(
      connectionId &&
      tableName &&
      form.selectedTable &&
      !form.hasMetadataExpression
    ),
    status,
    run,
    undo,
  };
};
