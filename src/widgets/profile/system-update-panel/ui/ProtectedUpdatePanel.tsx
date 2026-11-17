import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  clearSystemUpdateMarker,
  OPERATOR_UPDATE_SESSION_KEY,
} from '@/entities/system-availability';

import {
  type CatalogView,
  client,
  type OperationView,
  type OperatorAction,
  type UpdateRequest,
  zOperationView,
} from '@/shared/gatewayClient';
import { toApiErrorPayload } from '@/shared/lib/errors';
import { PageLayout } from '@/shared/ui/page-layout';

import { OperationDetails } from './OperationDetails';
import { updateFailureMessage } from './updateFailureMessage';

const submissionKey = 'dvt-protected-update-submission';
const reloadedKey = 'dvt-protected-update-reloaded';
const terminal = new Set(['succeeded', 'cancelled', 'failed']);
const updateFailure = (exception: unknown) =>
  toApiErrorPayload(
    exception,
    'Не удалось получить состояние операции обновления.'
  );

const actionLabels: Record<OperatorAction, string> = {
  apply: 'Применить обновление',
  resume: 'Продолжить операцию',
  cancel_preparation: 'Отменить подготовку',
  extend_maintenance: 'Продлить ожидание задач',
  defer_maintenance: 'Отложить обслуживание',
  recover_manager: 'Восстановить доступ к мастеру',
  return_to_source: 'Вернуть прежний комплект',
  restore_start: 'Запустить восстановленный DVT',
};

function conflictId(detail: unknown): string | undefined {
  if (
    detail &&
    typeof detail === 'object' &&
    'operation_id' in detail &&
    typeof detail.operation_id === 'string'
  )
    return detail.operation_id;
  return undefined;
}

export function ProtectedUpdatePanel({
  managerOrigin,
}: {
  managerOrigin: string;
}) {
  const [operation, setOperation] = useState<OperationView | null>(null);
  const selectedId = useRef(
    sessionStorage.getItem(OPERATOR_UPDATE_SESSION_KEY)
  );
  const lastStage = useRef(operation?.stage);
  const [operations, setOperations] = useState<OperationView[]>([]);
  const [activeOperation, setActiveOperation] = useState<OperationView | null>(
    null
  );
  const [channel, setChannel] = useState<'stable' | 'rc'>('stable');
  const [catalog, setCatalog] = useState<CatalogView | null>(null);
  const [version, setVersion] = useState('');
  const [rcConfirmed, setRcConfirmed] = useState(false);
  const [confirmation, setConfirmation] = useState<OperatorAction | null>(null);
  const [pending, setPending] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [journalLoaded, setJournalLoaded] = useState(false);
  const busy =
    activeOperation !== null ||
    (operation !== null && !terminal.has(operation.stage));
  const manager = new URL(managerOrigin);
  if (operation)
    manager.hash = new URLSearchParams({ operation: operation.id }).toString();

  const show = useCallback((result: OperationView) => {
    selectedId.current = result.id;
    sessionStorage.setItem(OPERATOR_UPDATE_SESSION_KEY, result.id);
    lastStage.current = result.stage;
    setOperation(result);
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const activeResponse = await client.update.operations.active.get(
          undefined,
          { silent: true }
        );
        // The generated Axios client converts a successful JSON null to an empty object.
        const activeResult = zOperationView.safeParse(activeResponse.data);
        const active = activeResult.success ? activeResult.data : null;
        const history = (
          await client.update.operations.get(undefined, { silent: true })
        ).data;
        const pinned = selectedId.current;
        let result =
          history.find(row => row.id === pinned) ?? active ?? history[0];
        if (pinned && result?.id !== pinned) {
          try {
            result = (
              await client.update.operations
                .operationId(pinned)
                .get(undefined, {
                  silent: true,
                })
            ).data;
          } catch (exception) {
            if (updateFailure(exception).status !== 404) throw exception;
          }
        }
        if (stopped) return;
        if (result) {
          const completed =
            pinned === result.id &&
            lastStage.current &&
            !terminal.has(lastStage.current) &&
            result.stage === 'succeeded';
          show(result);
          if (completed && sessionStorage.getItem(reloadedKey) !== result.id) {
            sessionStorage.setItem(reloadedKey, result.id);
            clearSystemUpdateMarker();
            window.location.reload();
            return;
          }
        }
        setOperations(history);
        setActiveOperation(active);
        setJournalLoaded(true);
        setDisconnected(false);
      } catch (exception) {
        if (stopped) return;
        const status = updateFailure(exception).status;
        if (status === 401 || status === 403) return;
        setDisconnected(true);
      }
      if (!stopped) timer = window.setTimeout(() => void poll(), 2200);
    }

    void poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [show]);

  useEffect(() => {
    if (busy) return;
    let stopped = false;
    setCatalog(null);
    setCatalogError('');
    client.update.releases
      .get({ query: { channel } }, { silent: true })
      .then(({ data }) => {
        if (stopped) return;
        setCatalog(data);
        setVersion(
          data.recommended_stable?.version ?? data.releases[0]?.version ?? ''
        );
      })
      .catch(exception => {
        if (!stopped) setCatalogError(updateFailure(exception).message);
      });
    return () => {
      stopped = true;
    };
  }, [busy, channel, catalogRevision]);

  const path = catalog?.paths?.[version] ?? [];
  const firstStep = path[0] ?? version;
  const target =
    catalog?.first_steps?.[version] ??
    catalog?.releases.find(release => release.version === firstStep);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError('');
    try {
      await action();
    } catch (exception) {
      const failure = updateFailure(exception);
      const detail: unknown = failure.detail;
      const conflict = conflictId(detail);
      if (conflict) selectedId.current = conflict;
      const reason =
        detail &&
        typeof detail === 'object' &&
        'reason' in detail &&
        typeof detail.reason === 'string'
          ? detail.reason
          : null;
      const message = reason
        ? updateFailureMessage(reason)
        : (failure.description ?? failure.message);
      setError(
        conflict
          ? `Уже существует операция ${conflict}. Её состояние появится в журнале.`
          : message
      );
    } finally {
      setPending(false);
    }
  }

  function prepare() {
    if (!target || (channel === 'rc' && !rcConfirmed)) return;
    const body: UpdateRequest = {
      kind: 'update',
      version: target.version,
      manifest_digest: target.manifest_digest,
      confirm_rc:
        rcConfirmed &&
        (target.channel === 'rc' || /-?rc\d+$/.test(target.version)),
    };
    const intent = JSON.stringify(body);
    const saved = JSON.parse(sessionStorage.getItem(submissionKey) ?? 'null');
    const generatedKey = Array.from(
      crypto.getRandomValues(new Uint8Array(16)),
      value => value.toString(16).padStart(2, '0')
    ).join('');
    const key = saved?.intent === intent ? saved.key : generatedKey;
    sessionStorage.setItem(submissionKey, JSON.stringify({ intent, key }));
    void run(async () => {
      const headers = { 'Idempotency-Key': key, 'X-DVT-CSRF': '1' };
      const { data } = await client.update.operations.post(
        { body, headers },
        { silent: true }
      );
      show(data);
      sessionStorage.removeItem(submissionKey);
    });
  }

  function act(action: OperatorAction, confirm = false) {
    if (!operation || !operation.actions.includes(action)) return;
    void run(async () => {
      const { data } = await client.update.operations
        .operationId(operation.id)
        .actions.action(action)
        .post(
          { body: { confirm } },
          { headers: { 'X-DVT-CSRF': '1' }, silent: true }
        );
      show(data);
      setConfirmation(null);
    });
  }

  function downloadDiagnostics() {
    if (!operation) return;
    void run(async () => {
      const { data } = await client.update.operations
        .operationId(operation.id)
        .diagnostics.get(undefined, { silent: true });
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `dvt-${operation.id}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  const disabled = pending || disconnected;
  const requiresConfirm = (action: OperatorAction) =>
    action === 'apply' || action === 'return_to_source';

  return (
    <PageLayout width='narrow' title='Обновление DVT'>
      <Stack spacing={2} sx={{ maxWidth: 870 }}>
        <Alert severity='info'>
          <Link href={manager.href} target='_blank' rel='noreferrer'>
            Открыть защищённый мастер обновлений
          </Link>{' '}
          Мастер доступен отдельно от DVT по административному каналу. Сохраните
          адрес до окна обслуживания.
        </Alert>
        {disconnected && (
          <Alert severity='warning'>
            Связь с DVT временно потеряна. Показываем последний подтверждённый
            этап и продолжаем проверять тот же ID.
          </Alert>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
        {activeOperation && activeOperation.id !== operation?.id && (
          <Button
            sx={{ alignSelf: 'flex-start' }}
            onClick={() => show(activeOperation)}
          >
            Открыть активную операцию
          </Button>
        )}
        {!busy && journalLoaded && (
          <Stack spacing={2} component='section' aria-label='Выбор версии'>
            {catalog?.source && (
              <Typography>
                Работает DVT {catalog.source.version}, схема базы{' '}
                {catalog.source.revision}.
              </Typography>
            )}
            <TextField
              select
              label='Канал релиза'
              value={channel}
              onChange={event => {
                setChannel(event.target.value as 'stable' | 'rc');
                setRcConfirmed(false);
              }}
            >
              <MenuItem value='stable'>Стабильные релизы</MenuItem>
              <MenuItem value='rc'>Предварительные релизы (RC)</MenuItem>
            </TextField>
            {catalog?.catalog_fetched_at && (
              <Typography variant='body2'>
                Каталог от{' '}
                {new Date(catalog.catalog_fetched_at).toLocaleString()}
              </Typography>
            )}
            {catalog?.catalog_error && (
              <Alert severity='warning'>
                Каталог недоступен. Показаны сохранённые данные (
                {catalog.catalog_error}).
              </Alert>
            )}
            {catalog?.source_error && (
              <Alert severity='warning'>
                Рабочая версия или схема базы не подтверждена.
              </Alert>
            )}
            {catalog && !catalog.trust_configured && (
              <Alert severity='warning'>Доверие к подписям не настроено.</Alert>
            )}
            {catalogError && (
              <Alert
                severity='error'
                action={
                  <Button
                    onClick={() => setCatalogRevision(count => count + 1)}
                  >
                    Повторить
                  </Button>
                }
              >
                {catalogError}
              </Alert>
            )}
            {catalog?.releases.length === 0 && (
              <Typography>
                Нет применимых обновлений. Возврат выполняется из операции по
                проверенной точке восстановления.
              </Typography>
            )}
            {catalog && catalog.releases.length > 0 && (
              <TextField
                select
                label='Целевая версия'
                value={version}
                onChange={event => {
                  setVersion(event.target.value);
                  setRcConfirmed(false);
                }}
              >
                {catalog.releases.map(row => (
                  <MenuItem value={row.version} key={row.version}>
                    {row.version}
                    {row.version === catalog.recommended_stable?.version
                      ? ' (рекомендуется)'
                      : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {path.length > 1 && (
              <Alert severity='info'>
                Требуется переход через {path.join(' → ')}. Сначала подготовьте{' '}
                {path[0]}.
              </Alert>
            )}
            {channel === 'rc' && (
              <FormControlLabel
                label='Подтверждаю выбор предварительного релиза'
                control={
                  <Checkbox
                    checked={rcConfirmed}
                    onChange={event => setRcConfirmed(event.target.checked)}
                  />
                }
              />
            )}
            <Button
              variant='contained'
              sx={{ alignSelf: 'flex-start' }}
              onClick={prepare}
              disabled={
                disabled || !target || (channel === 'rc' && !rcConfirmed)
              }
            >
              Подготовить обновление
            </Button>
          </Stack>
        )}
        {operation && (
          <OperationDetails operation={operation}>
            <Stack direction='row' flexWrap='wrap' gap={1}>
              {operation.actions
                .filter(action => action !== 'restore_start')
                .map(action => (
                  <Button
                    key={action}
                    variant={action === 'apply' ? 'contained' : 'outlined'}
                    disabled={disabled}
                    onClick={() =>
                      requiresConfirm(action)
                        ? setConfirmation(action)
                        : act(action)
                    }
                  >
                    {actionLabels[action]}
                  </Button>
                ))}
              <Button disabled={disabled} onClick={downloadDiagnostics}>
                Скачать диагностику
              </Button>
            </Stack>
            {operation.actions.includes('restore_start') && (
              <Alert severity='warning'>
                Подтверждение запуска восстановленного DVT доступно в
                независимом мастере.
              </Alert>
            )}
          </OperationDetails>
        )}
        {operations.length > 0 && (
          <TextField
            select
            label='История операций'
            value={
              operation && operations.some(row => row.id === operation.id)
                ? operation.id
                : ''
            }
            onChange={event => {
              const entry = operations.find(
                row => row.id === event.target.value
              );
              if (entry) show(entry);
            }}
          >
            {operations.map(entry => (
              <MenuItem value={entry.id} key={entry.id}>
                {entry.version} · {entry.id}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
      <Dialog
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
      >
        <DialogTitle>
          {confirmation === 'apply'
            ? 'Начать окно обслуживания?'
            : 'Подтвердить возврат?'}
        </DialogTitle>
        <DialogContent>
          {confirmation === 'apply'
            ? 'DVT временно перестанет принимать новые запуски. Отслеживать операцию можно из независимого мастера.'
            : 'При восстановлении будут утрачены записи после создания копии. Изменения во внешних системах сохранятся.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmation(null)}>Назад</Button>
          <Button
            disabled={
              disabled ||
              !confirmation ||
              !operation?.actions.includes(confirmation)
            }
            onClick={() => {
              if (confirmation) act(confirmation, true);
            }}
          >
            {confirmation === 'apply'
              ? 'Подтвердить применение'
              : 'Подтвердить возврат'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
