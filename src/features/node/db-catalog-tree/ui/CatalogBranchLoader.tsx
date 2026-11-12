import { memo, useEffect, useMemo, useRef } from 'react';

import type { DbCatalogListResult } from '@/entities/data/db-connection/model/catalogTypes';
import {
  useDbCatalogSchemas,
  useDbCatalogTables,
} from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type { DbMetadata } from '@/shared/gatewayClient';

import {
  type CatalogTreeLevel,
  type CatalogTreeNode,
  createCatalogTreeNode,
} from '../lib/catalogTree';
import type { ReportCatalogBranch } from '../model/useCatalogTree';

type CatalogBranchLoaderProps = {
  metadata: DbMetadata | null;
  node: CatalogTreeNode;
  childLevel: Exclude<CatalogTreeLevel, 'database'>;
  onReport: ReportCatalogBranch;
};

/**
 * Подписка на дочерние элементы одного раскрытого узла. Ничего не рендерит:
 * передаёт загруженную ветку в состояние дерева.
 */
export const CatalogBranchLoader = memo(
  ({ metadata, node, childLevel, onReport }: CatalogBranchLoaderProps) => {
    const databaseName =
      node.level === 'database' ? node.name : node.databaseName;
    const schemaName = node.level === 'schema' ? node.name : null;

    const schemas = useDbCatalogSchemas(metadata, databaseName, {
      enabled: childLevel === 'schema',
    });
    const tables = useDbCatalogTables(metadata, databaseName, schemaName, {
      enabled: childLevel === 'table',
    });
    const result: DbCatalogListResult<unknown> =
      childLevel === 'schema' ? schemas : tables;

    const items = useMemo(
      () =>
        childLevel === 'schema'
          ? schemas.items.map(item =>
              createCatalogTreeNode('schema', item.name, databaseName, null)
            )
          : tables.items.map(item =>
              createCatalogTreeNode(
                'table',
                item.name,
                databaseName,
                schemaName,
                item
              )
            ),
      [childLevel, databaseName, schemaName, schemas.items, tables.items]
    );

    const actionsRef = useRef(result);
    useEffect(() => {
      actionsRef.current = result;
    });

    const { state, hasNextPage, isFetchingNextPage, isRefreshing } = result;

    useEffect(() => {
      onReport(
        node.key,
        { items, state, hasNextPage, isFetchingNextPage, isRefreshing },
        {
          loadNextPage: () => actionsRef.current.loadNextPage(),
          retry: () => actionsRef.current.retry(),
        }
      );
    }, [
      hasNextPage,
      isFetchingNextPage,
      isRefreshing,
      items,
      node.key,
      onReport,
      state,
    ]);

    useEffect(() => () => onReport(node.key, null), [node.key, onReport]);

    return null;
  }
);

CatalogBranchLoader.displayName = 'CatalogBranchLoader';
