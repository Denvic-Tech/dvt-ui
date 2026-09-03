import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Delete as DeleteIcon,
  FolderOpenOutlined as FolderOpenOutlinedIcon,
  FolderRounded as FolderRoundedIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  QueueRounded as QueueRoundedIcon,
  Storage as StorageIcon,
  StorageRounded as StorageRoundedIcon,
} from '@mui/icons-material';
import { Chip, CircularProgress, Collapse } from '@mui/material';
import { FaEdit } from 'react-icons/fa';
import { MdOutlineSyncAlt } from 'react-icons/md';

import {
  getFileStorageConnectionMeta,
  toFileStorageConnection,
} from '@/entities/data/storage/model/helpers';

import {
  getFieldDescriptorsByType,
  resolveConnectionTypeInfo,
} from '../model/adapters';
import { isFileConnectionType } from '../model/guards';
import { useConnections } from '../model/hooks/useConnections';
import {
  formatConnectionIssue,
  INVALID_CONNECTION_FALLBACK_MESSAGE,
  isBrokenConnection,
} from '../model/issues';
import type { DBConnectionRecord } from '../model/types';

import {
  ActionButton,
  ActionButtons,
  ConnectionDetails,
  ConnectionGroupSection,
  ConnectionGroupTitle,
  ConnectionGroupTitleIcon,
  ConnectionHeader,
  ConnectionIconWrapper,
  ConnectionIssueItem,
  ConnectionIssues,
  ConnectionIssuesList,
  ConnectionIssuesTitle,
  ConnectionItemWrapper,
  ConnectionName,
  ConnectionNameRow,
  ConnectionSubtitle,
  ConnectionTextGroup,
  ConnectionTypeSection,
  DetailLabel,
  DetailRow,
  DetailValue,
  EmptyState,
  ExpandIcon,
  ListContainer,
  LoadingState,
  Spinner,
  StatusBadge,
  StatusDot,
  StatusRow,
} from './DBConnectionsList.styles';
import {
  formatKindLabel,
  getConnectionTypeLabel,
  getConnectionTypeLogo,
  getConnectionTypeLogoScale,
} from './helpers';

type DBConnectionsListProps = {
  searchTerm?: string;
  onConnectionSelect?: ((connection: DBConnectionRecord) => void) | undefined;
  onEditConnection?: ((connection: DBConnectionRecord) => void) | undefined;
  onDeleteConnection?: ((connection: DBConnectionRecord) => void) | undefined;
  onOpenFileManager?: ((connection: DBConnectionRecord) => void) | undefined;
  loading?: boolean;
  handleRefresh?: number;
};

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

const CONNECTION_GROUP_ORDER = ['file', 'database', 'queue'] as const;

const normalizeConnectionKindGroup = (kind: string) => {
  switch (kind) {
    case 'file':
    case 'files':
    case 'filesystem':
      return 'file';
    case 'sql':
    case 'database':
    case 'databases':
      return 'database';
    case 'queue':
    case 'queues':
    case 'messaging':
      return 'queue';
    default:
      return 'database';
  }
};

const toDisplayText = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const truncateDetailText = (value: string, maxLength: number = 34) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
};

const compareLabels = (left: string, right: string) =>
  left.localeCompare(right, 'ru', { sensitivity: 'base' });

const getKindGroupIcon = (groupKey: string) => {
  switch (groupKey) {
    case 'file':
      return <FolderRoundedIcon />;
    case 'queue':
      return <QueueRoundedIcon />;
    case 'database':
    default:
      return <StorageRoundedIcon />;
  }
};

const getConnectionSummary = (connection: DBConnectionRecord) => {
  const typeLabel = getConnectionTypeLabel(connection.type);
  const fileStorageConnection = toFileStorageConnection(connection);

  if (fileStorageConnection) {
    const hint = getFileStorageConnectionMeta(fileStorageConnection).hint ?? '';

    return hint ? `${typeLabel} · ${hint}` : typeLabel;
  }

  if (connection.type === 'kafka') {
    const bootstrapServers = connection.properties['bootstrap_servers'];
    const hint = Array.isArray(bootstrapServers)
      ? bootstrapServers.join(', ')
      : toDisplayText(bootstrapServers);

    return hint ? `${typeLabel} · ${hint}` : typeLabel;
  }

  const host = toDisplayText(connection.properties['host']);
  const port = toDisplayText(connection.properties['port']);

  if (host) {
    return `${typeLabel} · ${port ? `${host}:${port}` : host}`;
  }

  const database = toDisplayText(connection.properties['database']);

  if (database) {
    return `${typeLabel} · ${database}`;
  }

  const driver = toDisplayText(connection.driver);

  return driver ? `${typeLabel} · ${driver}` : typeLabel;
};

const SqlDetails = ({ connection }: { connection: DBConnectionRecord }) => {
  const host = String(connection.properties['host'] ?? '');
  const port = connection.properties['port']
    ? `:${connection.properties['port']}`
    : '';
  const database = String(connection.properties['database'] ?? '');
  const username = String(connection.properties['username'] ?? '');
  const hostValue = `${host}${port}`;

  return (
    <>
      <DetailRow>
        <DetailLabel>Хост:</DetailLabel>
        <DetailValue title={hostValue}>
          {truncateDetailText(hostValue)}
        </DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>Пользователь:</DetailLabel>
        <DetailValue title={username}>
          {truncateDetailText(username)}
        </DetailValue>
      </DetailRow>
      <DetailRow>
        <DetailLabel>База данных:</DetailLabel>
        <DetailValue title={database}>
          {truncateDetailText(database)}
        </DetailValue>
      </DetailRow>
    </>
  );
};

const KafkaDetails = ({ connection }: { connection: DBConnectionRecord }) => {
  const bootstrapServers = Array.isArray(
    connection.properties['bootstrap_servers']
  )
    ? connection.properties['bootstrap_servers'].join(', ')
    : String(connection.properties['bootstrap_servers'] ?? '');
  const clientId = String(connection.properties['client_id'] ?? '');

  return (
    <>
      <DetailRow>
        <DetailLabel>Bootstrap servers:</DetailLabel>
        <DetailValue title={bootstrapServers}>
          {truncateDetailText(bootstrapServers)}
        </DetailValue>
      </DetailRow>
      {connection.properties['client_id'] ? (
        <DetailRow>
          <DetailLabel>Client ID:</DetailLabel>
          <DetailValue title={clientId}>
            {truncateDetailText(clientId)}
          </DetailValue>
        </DetailRow>
      ) : null}
    </>
  );
};

const StorageDetails = ({ connection }: { connection: DBConnectionRecord }) => {
  const bucket = String(connection.properties['bucket'] ?? '');
  const prefix = String(connection.properties['prefix'] ?? '');
  const endpoint = String(connection.properties['endpoint_url'] ?? '');

  return (
    <>
      {'bucket' in connection.properties ? (
        <DetailRow>
          <DetailLabel>Bucket:</DetailLabel>
          <DetailValue title={bucket}>{truncateDetailText(bucket)}</DetailValue>
        </DetailRow>
      ) : null}
      {'prefix' in connection.properties ? (
        <DetailRow>
          <DetailLabel>Prefix:</DetailLabel>
          <DetailValue title={prefix}>{truncateDetailText(prefix)}</DetailValue>
        </DetailRow>
      ) : null}
      {connection.properties['endpoint_url'] ? (
        <DetailRow>
          <DetailLabel>Endpoint:</DetailLabel>
          <DetailValue title={endpoint}>
            {truncateDetailText(endpoint)}
          </DetailValue>
        </DetailRow>
      ) : null}
    </>
  );
};

const FtpDetails = ({ connection }: { connection: DBConnectionRecord }) => {
  const host = String(connection.properties['host'] ?? '');
  const port = connection.properties['port']
    ? `:${String(connection.properties['port'])}`
    : '';
  const mode = String(connection.properties['mode'] ?? '');
  const username = String(connection.properties['username'] ?? '');
  const hostValue = `${host}${port}`;

  return (
    <>
      <DetailRow>
        <DetailLabel>Хост:</DetailLabel>
        <DetailValue title={hostValue}>
          {truncateDetailText(hostValue)}
        </DetailValue>
      </DetailRow>
      {'mode' in connection.properties ? (
        <DetailRow>
          <DetailLabel>Режим:</DetailLabel>
          <DetailValue title={mode}>{truncateDetailText(mode)}</DetailValue>
        </DetailRow>
      ) : null}
      {'username' in connection.properties ? (
        <DetailRow>
          <DetailLabel>Пользователь:</DetailLabel>
          <DetailValue title={username}>
            {truncateDetailText(username)}
          </DetailValue>
        </DetailRow>
      ) : null}
    </>
  );
};

const DefaultDetails = ({ connection }: { connection: DBConnectionRecord }) => (
  <>
    <DetailRow>
      <DetailLabel>Тип:</DetailLabel>
      <DetailValue title={getConnectionTypeLabel(connection.type)}>
        {truncateDetailText(getConnectionTypeLabel(connection.type))}
      </DetailValue>
    </DetailRow>
    {connection.driver ? (
      <DetailRow>
        <DetailLabel>Драйвер:</DetailLabel>
        <DetailValue title={connection.driver}>
          {truncateDetailText(connection.driver)}
        </DetailValue>
      </DetailRow>
    ) : null}
  </>
);

const DETAILS_REGISTRY: Record<
  string,
  React.FC<{ connection: DBConnectionRecord }>
> = {
  postgres: SqlDetails,
  mysql: SqlDetails,
  clickhouse: SqlDetails,
  mongodb: SqlDetails,
  mssql: SqlDetails,
  oracle: SqlDetails,
  custom: SqlDetails,
  kafka: KafkaDetails,
  s3: StorageDetails,
  ftp: FtpDetails,
  sftp: FtpDetails,
};

export const DBConnectionsList = ({
  searchTerm = '',
  onConnectionSelect,
  onEditConnection,
  onDeleteConnection,
  onOpenFileManager,
  loading: externalLoading = false,
  handleRefresh,
}: DBConnectionsListProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>(
    {}
  );
  const { connections, loading, checkConnectionSilent, catalog } =
    useConnections();
  const isLoading = loading || externalLoading;

  useEffect(() => {
    setTestStatuses({});
  }, [handleRefresh]);

  const filteredConnections = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return connections.filter(connection => {
      const searchableValues = [
        connection.name,
        connection.type,
        connection.kind,
        connection.driver ?? '',
        String(connection.properties['host'] ?? ''),
        String(connection.properties['database'] ?? ''),
        String(connection.properties['bucket'] ?? ''),
      ];

      if (Array.isArray(connection.properties['bootstrap_servers'])) {
        searchableValues.push(
          connection.properties['bootstrap_servers'].join(',')
        );
      }

      return searchableValues.some(value => value.toLowerCase().includes(term));
    });
  }, [connections, searchTerm]);

  const groupedConnections = useMemo(() => {
    const grouped = new Map<string, DBConnectionRecord[]>();

    filteredConnections.forEach(connection => {
      const groupKey = normalizeConnectionKindGroup(connection.kind);
      const currentGroup = grouped.get(groupKey);

      if (currentGroup) {
        currentGroup.push(connection);
        return;
      }

      grouped.set(groupKey, [connection]);
    });

    return CONNECTION_GROUP_ORDER.map(groupKey => ({
      key: groupKey,
      label: formatKindLabel(groupKey),
      typeGroups: Array.from(
        (grouped.get(groupKey) ?? [])
          .reduce((typeMap, connection) => {
            const typeKey = connection.type;
            const currentTypeGroup = typeMap.get(typeKey);

            if (currentTypeGroup) {
              currentTypeGroup.items.push(connection);
              return typeMap;
            }

            typeMap.set(typeKey, {
              key: typeKey,
              label: getConnectionTypeLabel(typeKey),
              items: [connection],
            });

            return typeMap;
          }, new Map<string, { key: string; label: string; items: DBConnectionRecord[] }>())
          .values()
      )
        .sort((left, right) => compareLabels(left.label, right.label))
        .map(typeGroup => ({
          ...typeGroup,
          items: [...typeGroup.items].sort((left, right) =>
            compareLabels(left.name, right.name)
          ),
        })),
    })).filter(group => group.typeGroups.length > 0);
  }, [filteredConnections]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const updateStatus = useCallback((id: string, status: TestStatus) => {
    setTestStatuses(prev => ({ ...prev, [id]: status }));
  }, []);

  const handleTestConnection = useCallback(
    async (event: React.MouseEvent, connection: DBConnectionRecord) => {
      event.stopPropagation();
      updateStatus(connection.id, 'loading');

      try {
        const result = await checkConnectionSilent(connection.id);
        updateStatus(
          connection.id,
          result.status.connected ? 'success' : 'error'
        );
      } catch {
        updateStatus(connection.id, 'error');
      }
    },
    [checkConnectionSilent, updateStatus]
  );

  const renderStatus = (status: TestStatus | undefined) => {
    const normalizedStatus: 'idle' | 'testing' | 'success' | 'error' =
      status === 'loading' ? 'testing' : (status ?? 'idle');

    switch (normalizedStatus) {
      case 'idle':
        return (
          <StatusBadge status='idle'>
            <StatusDot status='idle' />
            Не проверено
          </StatusBadge>
        );
      case 'testing':
        return (
          <StatusBadge status='testing'>
            <Spinner />
            Проверка...
          </StatusBadge>
        );
      case 'success':
        return (
          <StatusBadge status='success'>
            <StatusDot status='success' />
            Успешно
          </StatusBadge>
        );
      case 'error':
        return (
          <StatusBadge status='error'>
            <StatusDot status='error' />
            Ошибка
          </StatusBadge>
        );
      default:
        return null;
    }
  };

  const getIssueDescriptors = useCallback(
    (connection: DBConnectionRecord) => {
      const typeInfo = resolveConnectionTypeInfo(catalog, connection.type);
      const descriptors = getFieldDescriptorsByType(
        typeInfo,
        connection.driver
      );

      return [
        ...descriptors.propertiesFields,
        ...descriptors.secretsFields,
        ...descriptors.driverOptionFields,
      ];
    },
    [catalog]
  );

  if (isLoading) {
    return (
      <LoadingState>
        <CircularProgress size={20} />
      </LoadingState>
    );
  }

  if (!filteredConnections.length) {
    return (
      <EmptyState>
        {searchTerm ? 'Подключения не найдены' : 'Нет доступных подключений'}
      </EmptyState>
    );
  }

  return (
    <ListContainer>
      {groupedConnections.map(group => (
        <ConnectionGroupSection key={group.key}>
          <ConnectionGroupTitle>
            <ConnectionGroupTitleIcon>
              {getKindGroupIcon(group.key)}
            </ConnectionGroupTitleIcon>
            {group.label}
          </ConnectionGroupTitle>
          {group.typeGroups.map(typeGroup => (
            <ConnectionTypeSection key={typeGroup.key}>
              {typeGroup.items.map(connection => {
                const isExpanded = expandedItems.has(connection.id);
                const logoSrc = getConnectionTypeLogo(connection.type);
                const logoScale = getConnectionTypeLogoScale(connection.type);
                const Details =
                  DETAILS_REGISTRY[connection.type] ?? DefaultDetails;
                const statusContent = renderStatus(testStatuses[connection.id]);
                const summary = getConnectionSummary(connection);
                const isBroken = isBrokenConnection(connection);
                const issueDescriptors = isBroken
                  ? getIssueDescriptors(connection)
                  : [];
                const issueMessages =
                  isBroken && connection.issues.length > 0
                    ? connection.issues.map(issue =>
                        formatConnectionIssue(issue, issueDescriptors)
                      )
                    : [INVALID_CONNECTION_FALLBACK_MESSAGE];

                return (
                  <ConnectionItemWrapper
                    key={connection.id}
                    data-testid='entities/data/db-connection/connection-row'
                    data-connection-name={connection.name}
                    data-connection-type={connection.type}
                  >
                    <ConnectionHeader
                      data-testid='entities/data/db-connection/connection-row-header'
                      expanded={isExpanded}
                      onClick={() => {
                        onConnectionSelect?.(connection);
                        toggleExpand(connection.id);
                      }}
                    >
                      <ConnectionIconWrapper>
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={connection.type}
                            title={getConnectionTypeLabel(connection.type)}
                            style={{
                              transform: `scale(${logoScale})`,
                              transformOrigin: 'center',
                            }}
                          />
                        ) : (
                          <StorageIcon
                            titleAccess={getConnectionTypeLabel(
                              connection.type
                            )}
                          />
                        )}
                      </ConnectionIconWrapper>

                      <ConnectionTextGroup>
                        <ConnectionNameRow>
                          <ConnectionName title={connection.name}>
                            {connection.name}
                          </ConnectionName>
                          {isBroken ? (
                            <Chip
                              label='Broken'
                              size='small'
                              color='error'
                              variant='outlined'
                              sx={{
                                height: 18,
                                flexShrink: 0,
                                '& .MuiChip-label': {
                                  px: 0.75,
                                  fontSize: 10,
                                  fontWeight: 700,
                                },
                              }}
                            />
                          ) : null}
                        </ConnectionNameRow>
                        <ConnectionSubtitle title={summary}>
                          {summary}
                        </ConnectionSubtitle>
                      </ConnectionTextGroup>

                      <ExpandIcon expanded={isExpanded}>
                        <KeyboardArrowDownIcon />
                      </ExpandIcon>
                    </ConnectionHeader>

                    <Collapse
                      in={isExpanded}
                      timeout='auto'
                      unmountOnExit
                      sx={{
                        width: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        '& .MuiCollapse-wrapper': {
                          width: '100%',
                          minWidth: 0,
                        },
                        '& .MuiCollapse-wrapperInner': {
                          width: '100%',
                          minWidth: 0,
                        },
                      }}
                    >
                      <ConnectionDetails>
                        <Details connection={connection} />
                        {isBroken ? (
                          <ConnectionIssues>
                            <ConnectionIssuesTitle>
                              Проблемы подключения
                            </ConnectionIssuesTitle>
                            <ConnectionIssuesList>
                              {issueMessages.map((message, index) => (
                                <ConnectionIssueItem
                                  key={`${connection.id}-issue-${index}`}
                                >
                                  {message}
                                </ConnectionIssueItem>
                              ))}
                            </ConnectionIssuesList>
                          </ConnectionIssues>
                        ) : null}
                        {statusContent ? (
                          <StatusRow>{statusContent}</StatusRow>
                        ) : null}
                        <ActionButtons>
                          <ActionButton
                            type='button'
                            data-testid='entities/data/db-connection/connection-row-test-button'
                            variant='default'
                            onClick={event =>
                              handleTestConnection(event, connection)
                            }
                            title='Проверить подключение'
                          >
                            <MdOutlineSyncAlt size={16} />
                          </ActionButton>

                          {onOpenFileManager &&
                          isFileConnectionType(connection.type) ? (
                            <ActionButton
                              type='button'
                              data-testid='entities/data/db-connection/connection-row-open-file-manager-button'
                              variant='storage'
                              onClick={event => {
                                event.stopPropagation();
                                onOpenFileManager(connection);
                              }}
                              title='Открыть файловый менеджер'
                            >
                              <FolderOpenOutlinedIcon fontSize='small' />
                            </ActionButton>
                          ) : null}

                          {onEditConnection ? (
                            <ActionButton
                              type='button'
                              data-testid='entities/data/db-connection/connection-row-edit-button'
                              variant='edit'
                              onClick={event => {
                                event.stopPropagation();
                                onEditConnection(connection);
                              }}
                              title='Редактировать'
                            >
                              <FaEdit size={16} />
                            </ActionButton>
                          ) : null}

                          {onDeleteConnection ? (
                            <ActionButton
                              type='button'
                              data-testid='entities/data/db-connection/connection-row-delete-button'
                              variant='delete'
                              onClick={event => {
                                event.stopPropagation();
                                onDeleteConnection(connection);
                              }}
                              title='Удалить'
                            >
                              <DeleteIcon fontSize='small' />
                            </ActionButton>
                          ) : null}
                        </ActionButtons>
                      </ConnectionDetails>
                    </Collapse>
                  </ConnectionItemWrapper>
                );
              })}
            </ConnectionTypeSection>
          ))}
        </ConnectionGroupSection>
      ))}
    </ListContainer>
  );
};
