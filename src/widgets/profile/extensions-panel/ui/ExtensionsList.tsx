import React from 'react';
import { Skeleton } from '@mui/material';
import { IconCircleArrowUp } from '@tabler/icons-react';

import type { ExtensionReadSchema } from '@/shared/gatewayClient';
import { TokenListMessage } from '@/shared/ui/token-list';

import {
  type ExtensionsTab,
  getExtensionName,
  getListVersion,
  hasUpdate,
  type PendingAction,
} from '../lib/extension';

import {
  ListBox,
  ListItem,
  ListItemName,
  ListItemVersion,
  ListNotice,
  ListScroll,
  ListSkeletonItem,
  ProgressLine,
  Segment,
  SegmentButton,
  SegmentCount,
  SegmentThumb,
  Spinner,
  UpdateMark,
} from './styles';

const TABS: ReadonlyArray<{ value: ExtensionsTab; label: string }> = [
  { value: 'installed', label: 'Установлено' },
  { value: 'available', label: 'Доступно' },
];

const EMPTY_TEXT: Record<ExtensionsTab, string> = {
  installed: 'Установленных расширений нет',
  available: 'Все расширения установлены',
};

const SKELETON_WIDTHS = [148, 112, 172];

interface ExtensionsListProps {
  tab: ExtensionsTab;
  // No installed extensions yet: the «Установлено» tab can not be opened.
  isInstalledTabLocked: boolean;
  counts: Record<ExtensionsTab, number>;
  items: ExtensionReadSchema[];
  selectedName: string | null;
  pendingByName: Record<string, PendingAction>;
  showSkeleton: boolean;
  isLoading: boolean;
  loadError: string | null;
  catalogError: boolean;
  // The catalog is being refreshed.
  isSyncing: boolean;
  // Refreshed on request: the list is about to change and is not clickable.
  isDimmed: boolean;
  onTabChange: (tab: ExtensionsTab) => void;
  onSelect: (name: string) => void;
}

export const ExtensionsList: React.FC<ExtensionsListProps> = ({
  tab,
  isInstalledTabLocked,
  counts,
  items,
  selectedName,
  pendingByName,
  showSkeleton,
  isLoading,
  loadError,
  catalogError,
  isSyncing,
  isDimmed,
  onTabChange,
  onSelect,
}) => {
  // Until the list is loaded the active tab is unknown: the thumb is hidden and
  // then appears in place, it only slides on later tab changes.
  const [isThumbAnimated, setIsThumbAnimated] = React.useState(false);
  React.useEffect(() => {
    if (isLoading || isThumbAnimated) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() =>
      setIsThumbAnimated(true)
    );
    return () => window.cancelAnimationFrame(frameId);
  }, [isLoading, isThumbAnimated]);

  const renderItems = () => {
    if (showSkeleton) {
      return SKELETON_WIDTHS.map(width => (
        <ListSkeletonItem key={width} aria-hidden>
          <Skeleton
            variant='rounded'
            animation='wave'
            width={width}
            height={10}
            sx={{ borderRadius: '6px', bgcolor: '#F1F3F8' }}
          />
        </ListSkeletonItem>
      ));
    }

    if (isLoading) {
      return null;
    }

    if (loadError) {
      return <TokenListMessage>{loadError}</TokenListMessage>;
    }

    if (items.length === 0) {
      return <TokenListMessage>{EMPTY_TEXT[tab]}</TokenListMessage>;
    }

    return items.map(extension => {
      const pending = pendingByName[extension.name];

      return (
        <ListItem
          key={extension.name}
          disableRipple
          selected={extension.name === selectedName}
          aria-current={extension.name === selectedName}
          onClick={() => onSelect(extension.name)}
        >
          <ListItemName title={getExtensionName(extension)}>
            {getExtensionName(extension)}
          </ListItemName>
          {hasUpdate(extension) ? (
            <UpdateMark title='Доступно обновление'>
              <IconCircleArrowUp
                size={14}
                stroke={1.6}
                role='img'
                aria-label='Доступно обновление'
              />
            </UpdateMark>
          ) : null}
          {pending && pending !== 'delete' ? (
            <Spinner tone='accent' aria-hidden />
          ) : null}
          <ListItemVersion>{getListVersion(extension)}</ListItemVersion>
        </ListItem>
      );
    });
  };

  return (
    <ListBox aria-label='Расширения'>
      {isSyncing ? <ProgressLine aria-hidden /> : null}

      <Segment role='tablist' aria-label='Расширения'>
        <SegmentThumb
          aria-hidden
          second={tab === 'available'}
          invisible={isLoading}
          animated={isThumbAnimated}
        />
        {TABS.map(option => (
          <SegmentButton
            key={option.value}
            disableRipple
            role='tab'
            aria-selected={!isLoading && tab === option.value}
            active={!isLoading && tab === option.value}
            disabled={
              isLoading ||
              (option.value === 'installed' && isInstalledTabLocked)
            }
            // The counts and the lock are unknown until the list is loaded.
            sx={{ visibility: isLoading ? 'hidden' : 'visible' }}
            onClick={() => onTabChange(option.value)}
          >
            {option.label}
            <SegmentCount>{counts[option.value]}</SegmentCount>
          </SegmentButton>
        ))}
      </Segment>

      {catalogError && !isLoading ? (
        <ListNotice role='status'>
          Не удалось обновить каталог. Показаны сохранённые данные.
        </ListNotice>
      ) : null}

      <ListScroll dimmed={isDimmed}>{renderItems()}</ListScroll>
    </ListBox>
  );
};
