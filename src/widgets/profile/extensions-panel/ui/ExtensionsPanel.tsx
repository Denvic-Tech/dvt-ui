import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  IconCheck,
  IconPuzzle,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react';

import { useAlert } from '@/app/notifications';

import { extensionsApi } from '@/features/profile/extensions';

import type {
  ExtensionCatalogVersionSchema,
  ExtensionPackagePreviewSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageLayout } from '@/shared/ui/page-layout';
import { TokenListCreateButton } from '@/shared/ui/token-list';

import {
  buildErrorPayload,
  type ExtensionActionError,
  type ExtensionsTab,
  formatVersion,
  getErrorText,
  getExtensionName,
  getReleaseOperation,
  isInCatalog,
  isInTab,
  OPERATION_LABELS,
  type PendingAction,
  type ReleaseOperation,
  sortExtensions,
} from '../lib/extension';

import { ExtensionCard } from './ExtensionCard';
import { ExtensionsList } from './ExtensionsList';
import { ExtensionsLayout, SyncButton } from './styles';

// 'background': the refresh on opening, the list stays clickable.
type SyncState = 'idle' | 'background' | 'busy' | 'done';

const SYNC_DONE_MS = 1500;

const CONFIRM_TITLES: Record<ReleaseOperation, string> = {
  install: 'Установить расширение?',
  upgrade: 'Обновить расширение?',
  downgrade: 'Понизить версию?',
  reinstall: 'Переустановить расширение?',
};

const getConfirmMessage = (
  operation: ReleaseOperation,
  name: string,
  currentVersion: string | null | undefined,
  targetVersion: string | null | undefined
) => {
  const current = formatVersion(currentVersion);
  const target = formatVersion(targetVersion);

  if (operation === 'upgrade') {
    return `Расширение «${name}» будет обновлено с ${current} до ${target}.`;
  }
  if (operation === 'downgrade') {
    return `Версия расширения «${name}» будет понижена с ${current} до ${target}.`;
  }
  if (operation === 'reinstall') {
    return `Расширение «${name}» ${target} будет переустановлено.`;
  }

  return targetVersion
    ? `Расширение «${name}» ${target} будет установлено.`
    : `Расширение «${name}» будет установлено.`;
};

const statusChipSx = (tone: 'default' | 'warning') => {
  const palette = {
    default: { bg: '#f3f4f6', color: '#6b7280' },
    warning: { bg: '#fef3c7', color: '#b45309' },
  }[tone];

  return {
    height: 24,
    borderRadius: '999px',
    backgroundColor: palette.bg,
    color: palette.color,
    fontSize: 11,
    fontWeight: 700,
    '& .MuiChip-label': {
      px: 1.25,
    },
  };
};

export const ExtensionsPanel: React.FC = () => {
  const { showAlert } = useAlert();
  const { confirm, confirmWithCheckbox } = useConfirmDialog();
  const [extensions, setExtensions] = React.useState<ExtensionReadSchema[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<ExtensionsTab>('installed');
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const [pendingByName, setPendingByName] = React.useState<
    Record<string, PendingAction>
  >({});
  const [errorsByName, setErrorsByName] = React.useState<
    Record<string, ExtensionActionError>
  >({});
  const [syncState, setSyncState] = React.useState<SyncState>('idle');
  const syncTimerRef = React.useRef<number | undefined>(undefined);
  // Installing waits for a fresh catalog: saved releases may be outdated.
  const [catalogReady, setCatalogReady] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState(false);
  const syncInFlightRef = React.useRef(false);
  // Bumped by local changes: a list fetched before them is outdated.
  const localRevisionRef = React.useRef(0);
  const openedRef = React.useRef(false);
  const [packagePreview, setPackagePreview] =
    React.useState<ExtensionPackagePreviewSchema | null>(null);
  const [packagePending, setPackagePending] = React.useState(false);
  const packageInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedNameRef = React.useRef<string | null>(null);

  React.useEffect(() => () => window.clearTimeout(syncTimerRef.current), []);

  // Gateway errors already show a notification, only other ones need it here.
  const notifyError = React.useCallback(
    (error: unknown, title: string) => {
      if (!isApiError(error)) {
        showAlert({
          type: 'error',
          title,
          description: getErrorText(buildErrorPayload(error, title)),
        });
      }
    },
    [showAlert]
  );

  const replaceExtension = React.useCallback(
    (nextItem: ExtensionReadSchema) => {
      localRevisionRef.current += 1;
      setExtensions(prev =>
        sortExtensions([
          ...prev.filter(item => item.name !== nextItem.name),
          nextItem,
        ])
      );
    },
    []
  );

  const loadExtensions = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setExtensions(await extensionsApi.list());
    } catch (error) {
      setLoadError(
        getErrorText(
          buildErrorPayload(error, 'Не удалось загрузить список расширений.')
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Syncs the catalog with the distributor. Until it succeeds installing is
  // off, while reload and delete keep working with the saved data.
  const refreshCatalog = React.useCallback(
    async (manual: boolean) => {
      if (syncInFlightRef.current) {
        return;
      }
      syncInFlightRef.current = true;
      window.clearTimeout(syncTimerRef.current);
      setSyncState(manual ? 'busy' : 'background');

      try {
        await extensionsApi.sync();
        let items: ExtensionReadSchema[];
        let revision: number;
        do {
          revision = localRevisionRef.current;
          items = await extensionsApi.list();
        } while (revision !== localRevisionRef.current);
        setExtensions(items);
        setLoadError(null);
        setCatalogReady(true);
        setCatalogError(false);
        if (manual) {
          setSyncState('done');
          syncTimerRef.current = window.setTimeout(
            () => setSyncState('idle'),
            SYNC_DONE_MS
          );
        } else {
          setSyncState('idle');
        }
      } catch (error) {
        setCatalogReady(false);
        setCatalogError(true);
        setSyncState('idle');
        if (manual) {
          notifyError(error, 'Не удалось обновить каталог расширений.');
        }
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [notifyError]
  );

  React.useEffect(() => {
    // Once per opening, also under the StrictMode double effect.
    if (openedRef.current) {
      return;
    }
    openedRef.current = true;
    void loadExtensions().then(() => refreshCatalog(false));
  }, [loadExtensions, refreshCatalog]);

  const isRefreshing = syncState === 'busy' || syncState === 'background';

  const catalogEntries = React.useMemo(
    () => extensions.filter(isInCatalog),
    [extensions]
  );
  const counts = React.useMemo(
    () => ({
      installed: catalogEntries.filter(item => item.is_installed).length,
      available: catalogEntries.filter(item => !item.is_installed).length,
    }),
    [catalogEntries]
  );
  // Without installed extensions only the «Доступно» tab makes sense.
  const isInstalledTabLocked =
    catalogEntries.length > 0 && counts.installed === 0;
  const activeTab: ExtensionsTab = isInstalledTabLocked ? 'available' : tab;
  const tabItems = React.useMemo(
    () => catalogEntries.filter(item => isInTab(item, activeTab)),
    [catalogEntries, activeTab]
  );
  // The first extension of the tab is selected until another one is picked.
  const selected =
    tabItems.find(item => item.name === selectedName) ?? tabItems[0] ?? null;
  selectedNameRef.current = selected?.name ?? null;

  const handleTabChange = (nextTab: ExtensionsTab) => {
    if (nextTab === 'installed' && isInstalledTabLocked) {
      return;
    }
    setTab(nextTab);
    setSelectedName(null);
  };

  const runAction = async (
    extension: ExtensionReadSchema,
    action: PendingAction,
    request: () => Promise<ExtensionReadSchema | void>
  ) => {
    const { name } = extension;
    setPendingByName(prev => ({ ...prev, [name]: action }));
    setErrorsByName(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    try {
      const response = await request();
      if (response) {
        replaceExtension(response);
        // An installed extension moves to the other tab, the card follows it.
        if (
          response.is_installed &&
          !extension.is_installed &&
          selectedNameRef.current === name
        ) {
          setTab('installed');
          setSelectedName(name);
        }
      } else {
        await loadExtensions();
      }
    } catch (error) {
      setErrorsByName(prev => ({
        ...prev,
        [name]: {
          action,
          message: getErrorText(
            buildErrorPayload(error, 'Операция завершилась с ошибкой.')
          ),
        },
      }));
    } finally {
      setPendingByName(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const dismissError = (name: string) => {
    setErrorsByName(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Without a release the backend installs the recommended version.
  const handleInstall = async (
    extension: ExtensionReadSchema,
    release?: ExtensionCatalogVersionSchema
  ) => {
    const operation = getReleaseOperation(extension, release);
    const isConfirmed = await confirm({
      title: CONFIRM_TITLES[operation],
      message: getConfirmMessage(
        operation,
        getExtensionName(extension),
        extension.current_version,
        release?.version ?? extension.recommended_version
      ),
      confirmLabel: OPERATION_LABELS[operation],
      confirmColor: 'primary',
    });

    if (isConfirmed) {
      void runAction(
        extension,
        operation === 'upgrade' ? 'update' : 'install',
        () =>
          extensionsApi.install(extension.name, release?.version ?? null, {
            allowDowngrade: operation === 'downgrade',
            allowReinstall: operation === 'reinstall',
          })
      );
    }
  };

  // Reloads the installed package locally, also when the catalog is down.
  const handleReload = (extension: ExtensionReadSchema) => {
    void runAction(extension, 'reload', () =>
      extensionsApi.reload(extension.name)
    );
  };

  const handleDelete = async (extension: ExtensionReadSchema) => {
    const { confirmed, checked: dropData } = await confirmWithCheckbox({
      title: 'Удалить расширение?',
      message: `Расширение «${getExtensionName(extension)}» будет удалено.`,
      confirmLabel: 'Удалить',
      confirmColor: 'error',
      checkbox: {
        label: 'Удалить данные расширения',
        checkedWarning:
          'Данные расширения будут удалены без возможности восстановления.',
      },
    });

    if (confirmed) {
      void runAction(extension, 'delete', () =>
        extensionsApi.remove(extension.name, dropData)
      );
    }
  };

  const handlePackageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setPackagePending(true);
    try {
      setPackagePreview(await extensionsApi.previewPackage(file));
    } catch (error) {
      notifyError(error, 'Не удалось проверить пакет расширения.');
    } finally {
      setPackagePending(false);
    }
  };

  const installPackage = async () => {
    if (!packagePreview) {
      return;
    }
    const preview = packagePreview;
    setPackagePending(true);
    try {
      const installed = await extensionsApi.installPackage(preview.package_id, {
        allowDowngrade: preview.operation === 'downgrade',
        allowReinstall: preview.operation === 'reinstall',
      });
      replaceExtension(installed);
      setPackagePreview(null);
      showAlert({
        type: 'success',
        title: `Расширение "${installed.display_name || installed.name}" установлено из файла.`,
      });
    } catch (error) {
      // The attempt uses up the uploaded package: a retry needs a new upload.
      setPackagePreview(null);
      notifyError(error, 'Не удалось установить пакет расширения.');
    } finally {
      setPackagePending(false);
    }
  };

  const isFirstLoading = loading && extensions.length === 0;
  const showSkeleton = useDelayedLoading(isFirstLoading);

  return (
    <>
      <PageLayout
        width='default'
        title='Extensions'
        icon={IconPuzzle}
        fitContent
        headerActions={
          <>
            <input
              ref={packageInputRef}
              type='file'
              accept='.dvtx,.zip,application/zip'
              hidden
              onChange={event => void handlePackageSelected(event)}
            />
            <SyncButton
              disableRipple
              syncState={isRefreshing ? 'busy' : syncState}
              disabled={isRefreshing}
              onClick={() => void refreshCatalog(true)}
            >
              {syncState === 'done' ? (
                <IconCheck size={15} stroke={1.8} />
              ) : (
                <IconRefresh size={15} stroke={1.5} />
              )}
              {isRefreshing
                ? 'Обновление каталога…'
                : syncState === 'done'
                  ? 'Каталог обновлён'
                  : 'Обновить каталог'}
            </SyncButton>
            <TokenListCreateButton
              disableRipple
              disabled={packagePending}
              onClick={() => packageInputRef.current?.click()}
            >
              {packagePending && !packagePreview ? (
                <CircularProgress size={14} color='inherit' />
              ) : (
                <IconUpload size={14} stroke={1.8} />
              )}
              Установить из файла
            </TokenListCreateButton>
          </>
        }
      >
        <ExtensionsLayout>
          <ExtensionsList
            tab={activeTab}
            isInstalledTabLocked={isInstalledTabLocked}
            counts={counts}
            items={tabItems}
            selectedName={selected?.name ?? null}
            pendingByName={pendingByName}
            showSkeleton={showSkeleton}
            isLoading={isFirstLoading}
            loadError={extensions.length === 0 ? loadError : null}
            catalogError={catalogError}
            isSyncing={isRefreshing}
            isDimmed={syncState === 'busy'}
            onTabChange={handleTabChange}
            onSelect={setSelectedName}
          />

          {selected ? (
            <ExtensionCard
              key={selected.name}
              extension={selected}
              pending={pendingByName[selected.name]}
              error={errorsByName[selected.name]}
              catalogReady={catalogReady && !isRefreshing}
              onInstall={() => void handleInstall(selected)}
              onInstallRelease={release =>
                void handleInstall(selected, release)
              }
              onReload={() => handleReload(selected)}
              onDelete={() => void handleDelete(selected)}
              onDismissError={() => dismissError(selected.name)}
            />
          ) : null}
        </ExtensionsLayout>
      </PageLayout>

      <Dialog
        open={packagePreview !== null}
        onClose={() => !packagePending && setPackagePreview(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Установка расширения из файла</DialogTitle>
        <DialogContent>
          {packagePreview ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                  {packagePreview.display_name}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: '#6b7280' }}>
                  {packagePreview.filename}
                </Typography>
              </Box>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={`Версия ${packagePreview.version}`} size='small' />
                {packagePreview.current_version ? (
                  <Chip
                    label={`Установлена ${packagePreview.current_version}`}
                    size='small'
                  />
                ) : null}
                <Chip
                  label={
                    packagePreview.operation === 'upgrade'
                      ? 'Обновление'
                      : packagePreview.operation === 'downgrade'
                        ? 'Понижение версии'
                        : packagePreview.operation === 'reinstall'
                          ? 'Переустановка'
                          : 'Новая установка'
                  }
                  size='small'
                  sx={statusChipSx(
                    packagePreview.operation === 'downgrade'
                      ? 'warning'
                      : 'default'
                  )}
                />
              </Stack>
              <Typography sx={{ fontSize: 13, color: '#4b5563' }}>
                DVT: {packagePreview.dvt_version || 'любая версия'} ·
                Wheelhouse:{' '}
                {packagePreview.has_wheelhouse
                  ? `${packagePreview.bundled_wheels_count} wheel-файлов`
                  : 'не требуется или отсутствует'}
              </Typography>
              {(packagePreview.warnings ?? []).map(warning => (
                <Alert key={warning} severity='warning'>
                  {warning}
                </Alert>
              ))}
              {!packagePreview.offline_ready ? (
                <Alert severity='error'>
                  Пакет нельзя установить автономно: проверьте совместимость с
                  DVT и наличие wheelhouse для Python-зависимостей.
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            disabled={packagePending}
            onClick={() => setPackagePreview(null)}
          >
            Отмена
          </Button>
          <Button
            variant='contained'
            disabled={packagePending || !packagePreview?.offline_ready}
            startIcon={
              packagePending ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
            onClick={() => void installPackage()}
          >
            {packagePreview?.operation === 'downgrade'
              ? 'Понизить версию'
              : packagePreview?.operation === 'reinstall'
                ? 'Переустановить'
                : packagePreview?.operation === 'upgrade'
                  ? 'Обновить'
                  : 'Установить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
