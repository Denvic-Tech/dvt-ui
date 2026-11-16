import React from 'react';
import { IconPackage, IconSchema } from '@tabler/icons-react';

import type {
  ExtensionCatalogVersionSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';
import {
  type TokenListRowAction,
  TokenListRowMenu,
  type TokenListRowSubmenuItem,
} from '@/shared/ui/token-list';

import {
  canInstallRelease,
  type ExtensionActionError,
  formatInstalledAt,
  formatVersion,
  getExtensionName,
  getReleaseLabel,
  getReleaseNote,
  hasUpdate,
  type PendingAction,
} from '../lib/extension';

import {
  CardActionButton,
  CardActions,
  CardBox,
  CardDescription,
  CardErrorNotice,
  CardHead,
  CardHint,
  CardMeta,
  CardMetaItem,
  CardMetaLabel,
  CardMetaValue,
  CardName,
  CardTile,
  CardTitleBlock,
  CardTop,
  NodeDescription,
  NodeName,
  NodeRow,
  NodesCount,
  NodesEmpty,
  NodesHeader,
  NodesList,
  NodeText,
  NodeTile,
  ProgressLine,
  Spinner,
} from './styles';

const ERROR_TITLES: Record<PendingAction, string> = {
  install: 'Не удалось установить',
  update: 'Не удалось обновить',
  reload: 'Не удалось перезагрузить',
  delete: 'Не удалось удалить',
};

const BUSY_LABELS: Partial<Record<PendingAction, string>> = {
  install: 'Установка…',
  update: 'Обновление…',
  reload: 'Перезагрузка…',
};

// The package of any release can be downloaded, even an incompatible one.
const downloadRelease = (release: ExtensionCatalogVersionSchema) => {
  window.open(release.download_url, '_blank', 'noopener');
};

interface ExtensionCardProps {
  extension: ExtensionReadSchema;
  pending: PendingAction | undefined;
  error: ExtensionActionError | undefined;
  // Installing waits for a fresh catalog: saved releases may be outdated.
  catalogReady: boolean;
  // Installs the recommended version: a new install or an update.
  onInstall: () => void;
  onInstallRelease: (release: ExtensionCatalogVersionSchema) => void;
  onReload: () => void;
  onDelete: () => void;
  onDismissError: () => void;
}

export const ExtensionCard: React.FC<ExtensionCardProps> = ({
  extension,
  pending,
  error,
  catalogReady,
  onInstall,
  onInstallRelease,
  onReload,
  onDelete,
  onDismissError,
}) => {
  const name = getExtensionName(extension);
  const description =
    extension.description || extension.manifest_json?.description || '';
  const nodes = extension.manifest_json?.nodes ?? [];
  const isBusy = pending !== undefined;
  const busyLabel = pending ? BUSY_LABELS[pending] : undefined;
  const canUpdate = hasUpdate(extension);
  const releases = extension.catalog_versions ?? [];
  const recommended = extension.recommended_version;
  // Only a release candidate fits: it is installed on explicit choice.
  const isRcOnly =
    !extension.is_installed &&
    !recommended &&
    releases.some(
      release => release.channel === 'rc' && canInstallRelease(release)
    );

  const toSubmenuItem = (
    release: ExtensionCatalogVersionSchema,
    onSelect: () => void,
    note?: string | null
  ): TokenListRowSubmenuItem => ({
    key: release.version,
    label: getReleaseLabel(release),
    ...(note ? { note } : {}),
    onSelect,
  });

  const menuActions: TokenListRowAction[] = [
    {
      label: 'Выбрать версию',
      submenu: releases.map(release => ({
        ...toSubmenuItem(
          release,
          () => onInstallRelease(release),
          getReleaseNote(release)
        ),
        disabled: !canInstallRelease(release),
      })),
      disabled: isBusy || !catalogReady || releases.length === 0,
    },
    {
      label: 'Скачать .dvtx',
      submenu: releases.map(release =>
        toSubmenuItem(release, () => downloadRelease(release))
      ),
      disabled: releases.length === 0,
    },
    ...(extension.is_installed
      ? [
          // Reloads the installed package without the catalog.
          {
            label: 'Перезагрузить',
            onSelect: onReload,
            disabled: isBusy,
          },
          {
            label: 'Удалить',
            onSelect: onDelete,
            danger: true,
            disabled: isBusy,
          },
        ]
      : []),
  ];

  const renderAction = () => {
    if (busyLabel) {
      return (
        <CardActionButton disabled>
          <Spinner tone='onAccent' aria-hidden />
          {busyLabel}
        </CardActionButton>
      );
    }

    if (isBusy) {
      return null;
    }

    if (!extension.is_installed) {
      return (
        <CardActionButton
          disableRipple
          disabled={!catalogReady || !recommended}
          onClick={onInstall}
        >
          Установить
        </CardActionButton>
      );
    }

    if (canUpdate) {
      return (
        <CardActionButton
          disableRipple
          disabled={!catalogReady}
          onClick={onInstall}
        >
          Обновить до {formatVersion(recommended)}
        </CardActionButton>
      );
    }

    return null;
  };

  return (
    <CardBox aria-label={name} aria-busy={isBusy}>
      {isBusy ? <ProgressLine aria-hidden /> : null}

      <CardTop>
        <CardHead>
          <CardTile aria-hidden installed={extension.is_installed}>
            <IconPackage size={18} stroke={1.4} />
          </CardTile>
          <CardTitleBlock>
            <CardName>{name}</CardName>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
            {isRcOnly ? (
              <CardHint>
                Стабильной версии нет: выберите RC в меню «Выбрать версию».
              </CardHint>
            ) : null}
          </CardTitleBlock>
          <CardActions>
            {renderAction()}
            <TokenListRowMenu
              label='Действия с расширением'
              actions={menuActions}
            />
          </CardActions>
        </CardHead>

        {error ? (
          <CardErrorNotice
            title={ERROR_TITLES[error.action]}
            message={error.message}
            onDismiss={onDismissError}
          />
        ) : null}

        <CardMeta>
          {extension.is_installed ? (
            <>
              <CardMetaItem>
                <CardMetaLabel>Версия</CardMetaLabel>
                <CardMetaValue>
                  {formatVersion(extension.current_version)}
                </CardMetaValue>
              </CardMetaItem>
              <CardMetaItem>
                <CardMetaLabel>Установлено</CardMetaLabel>
                <CardMetaValue>
                  {formatInstalledAt(extension.installed_at)}
                </CardMetaValue>
              </CardMetaItem>
            </>
          ) : (
            <CardMetaItem>
              <CardMetaLabel>Последняя версия</CardMetaLabel>
              <CardMetaValue>
                {formatVersion(recommended || extension.current_version)}
              </CardMetaValue>
            </CardMetaItem>
          )}
        </CardMeta>

        <NodesHeader>
          Ноды<NodesCount>{nodes.length}</NodesCount>
        </NodesHeader>
      </CardTop>

      <NodesList>
        {nodes.length === 0 ? (
          <NodesEmpty>
            Это расширение пока не добавляет собственные ноды.
          </NodesEmpty>
        ) : (
          nodes.map((node, index) => (
            <NodeRow key={`${node.name || node.display_name}-${index}`}>
              <NodeTile aria-hidden>
                <IconSchema size={16} stroke={1.4} />
              </NodeTile>
              <NodeText>
                <NodeName title={node.display_name || node.name}>
                  {node.display_name || node.name || 'Без имени'}
                </NodeName>
                <NodeDescription
                  empty={!node.description}
                  title={node.description || undefined}
                >
                  {node.description || 'Нет описания'}
                </NodeDescription>
              </NodeText>
            </NodeRow>
          ))
        )}
      </NodesList>
    </CardBox>
  );
};
