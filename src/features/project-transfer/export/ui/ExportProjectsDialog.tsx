import React, { useEffect, useId, useRef, useState } from 'react';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import { Check, Copy, Eye, EyeOff, Folder, RotateCw, X } from 'lucide-react';

import { isAdminAreaRole, useCurrentUser } from '@/entities/user';

import { pluralRu } from '../../lib/pluralRu';
import { buildBundleFileName } from '../../lib/saveTarget';
import {
  closeButtonSx,
  getTransferDialogSlotProps,
  getTransferTokens,
  ghostButtonSx,
  iconButtonSx,
  INTER_FONT,
  MONO_FONT,
  primaryButtonSx,
  thinScrollbarSx,
} from '../../ui/transferDialogStyles';
import { ButtonSpinner, OptionItem } from '../../ui/transferDialogUi';
import {
  buildExportRequest,
  type ExportOptionsState,
  type ExportTarget,
  INITIAL_EXPORT_OPTIONS,
  MIN_EXPORT_PASSPHRASE_LENGTH,
} from '../model/buildExportRequest';
import { useExportProjects } from '../model/useExportProjects';

export interface ExportProjectsDialogProps {
  open: boolean;
  target: ExportTarget | null;
  onClose: () => void;
}

const HEADER_ICON_SIZE = 40;

const EXPORT_DIALOG_SLOT_PROPS = getTransferDialogSlotProps({ width: 460 });

type TargetKind = 'project' | 'folder' | 'bundle';

const getTargetKind = (target: ExportTarget | null): TargetKind => {
  if (!target) {
    return 'bundle';
  }
  const { projectIds, folderIds } = target;
  if (projectIds.length === 1 && folderIds.length === 0) {
    return 'project';
  }
  if (folderIds.length === 1 && projectIds.length === 0) {
    return 'folder';
  }
  return 'bundle';
};

/** Подзаголовок шапки: название цели или количество при групповом экспорте. */
const getTargetSubtitle = (target: ExportTarget | null): string => {
  if (!target) {
    return '';
  }
  if (target.name) {
    return target.name;
  }
  const parts: string[] = [];
  const { projectIds, folderIds } = target;
  if (projectIds.length > 0) {
    parts.push(
      `${projectIds.length} ${pluralRu(projectIds.length, ['проект', 'проекта', 'проектов'])}`
    );
  }
  if (folderIds.length > 0) {
    parts.push(
      `${folderIds.length} ${pluralRu(folderIds.length, ['папка', 'папки', 'папок'])}`
    );
  }
  return parts.join(', ');
};

const TITLE_BY_KIND: Record<TargetKind, string> = {
  project: 'Экспорт проекта',
  folder: 'Экспорт папки',
  bundle: 'Экспорт проектов',
};

const PASSPHRASE_ALPHABET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Генерирует пароль вида `xxxx-xxxx-xxxx-xxxx` без похожих символов. */
const generatePassphrase = (): string => {
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  const chars = Array.from(
    bytes,
    value => PASSPHRASE_ALPHABET[value % PASSPHRASE_ALPHABET.length]
  );
  return [0, 4, 8, 12].map(i => chars.slice(i, i + 4).join('')).join('-');
};

const fieldIconSx = iconButtonSx(28, 7);

interface PassphraseFieldProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const PassphraseField: React.FC<PassphraseFieldProps> = ({
  value,
  disabled,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);
  /** Счётчик генераций: смена `key` перезапускает анимации */
  const [generation, setGeneration] = useState(0);
  const [justGenerated, setJustGenerated] = useState(false);
  const generatedTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current != null) {
        window.clearTimeout(copiedTimer.current);
      }
      if (generatedTimer.current != null) {
        window.clearTimeout(generatedTimer.current);
      }
    },
    []
  );

  const handleCopy = () => {
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    if (copiedTimer.current != null) {
      window.clearTimeout(copiedTimer.current);
    }
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1300);
  };

  const handleGenerate = () => {
    // Видимость не меняем: скрытый пароль остаётся скрытым, показанный — показанным
    onChange(generatePassphrase());
    setGeneration(prev => prev + 1);
    setJustGenerated(true);
    if (generatedTimer.current != null) {
      window.clearTimeout(generatedTimer.current);
    }
    generatedTimer.current = window.setTimeout(
      () => setJustGenerated(false),
      1600
    );
  };

  const tooShort =
    value.length > 0 && value.length < MIN_EXPORT_PASSPHRASE_LENGTH;

  return (
    <Box sx={{ mt: '10px' }}>
      <Box
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: 36,
            p: '0 4px 0 12px',
            borderRadius: '9px',
            background: t.bg,
            border: `1.5px solid ${
              tooShort
                ? t.dangerBorder
                : focused || justGenerated
                  ? t.accent
                  : t.borderStrong
            }`,
            transition: 'border-color .12s',
          };
        }}
      >
        {generation > 0 ? (
          <Box
            key={generation}
            aria-hidden
            sx={theme => {
              const { accent } = getTransferTokens(theme);
              return {
                position: 'absolute',
                inset: 0,
                borderRadius: '9px',
                pointerEvents: 'none',
                animation: 'exportPassphrasePulse .9s ease-out forwards',
                '@keyframes exportPassphrasePulse': {
                  '0%': { background: alpha(accent, 0.12) },
                  '100%': { background: alpha(accent, 0) },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                },
              };
            }}
          />
        ) : null}
        <Box
          component='input'
          type={visible ? 'text' : 'password'}
          autoComplete='new-password'
          placeholder='Пароль для импорта'
          aria-label='Пароль архива'
          data-testid='features/project-transfer/export-passphrase'
          value={value}
          disabled={disabled}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={theme => {
            const t = getTransferTokens(theme);
            return {
              flex: 1,
              minWidth: 0,
              p: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              fontFamily: value && visible ? MONO_FONT : 'inherit',
              fontSize: 13,
              color: t.text,
              '&::placeholder': { color: t.text4, opacity: 1 },
            };
          }}
        />
        {value ? (
          <Box
            component='button'
            type='button'
            title='Скопировать'
            aria-label='Скопировать пароль'
            disabled={disabled}
            onClick={handleCopy}
            sx={theme => ({
              ...fieldIconSx(theme),
              ...(copied ? { color: getTransferTokens(theme).green } : {}),
            })}
          >
            {copied ? (
              <Check size={14} strokeWidth={2.4} />
            ) : (
              <Copy size={14} strokeWidth={1.7} />
            )}
          </Box>
        ) : null}
        <Box
          component='button'
          type='button'
          title={visible ? 'Скрыть' : 'Показать'}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          disabled={disabled}
          onClick={() => setVisible(prev => !prev)}
          sx={fieldIconSx}
        >
          {visible ? (
            <EyeOff size={15} strokeWidth={1.7} />
          ) : (
            <Eye size={15} strokeWidth={1.7} />
          )}
        </Box>
        <Box
          component='button'
          type='button'
          title='Сгенерировать'
          aria-label='Сгенерировать пароль'
          data-testid='features/project-transfer/export-passphrase-generate'
          disabled={disabled}
          onClick={handleGenerate}
          sx={fieldIconSx}
        >
          <Box
            key={generation}
            component='span'
            sx={{
              display: 'flex',
              animation:
                generation > 0
                  ? 'exportPassphraseSpin .5s cubic-bezier(.2,.7,.3,1)'
                  : 'none',
              '@keyframes exportPassphraseSpin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            <RotateCw size={14} strokeWidth={1.9} />
          </Box>
        </Box>
      </Box>
      <Box
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            mt: '6px',
            fontSize: 12,
            lineHeight: 1.4,
            color: tooShort ? t.danger : t.text3,
          };
        }}
      >
        {tooShort
          ? `Минимум ${MIN_EXPORT_PASSPHRASE_LENGTH} символов`
          : 'Пароль используется для шифрования и не может быть восстановлен'}
      </Box>
    </Box>
  );
};

export const ExportProjectsDialog: React.FC<ExportProjectsDialogProps> = ({
  open,
  target,
  onClose,
}) => {
  const titleId = useId();
  const { exporting, exportProjects } = useExportProjects();
  const { user } = useCurrentUser();
  const isAdmin = isAdminAreaRole(user?.role);
  const [options, setOptions] = useState<ExportOptionsState>(
    INITIAL_EXPORT_OPTIONS
  );
  useEffect(() => {
    if (open) {
      setOptions(INITIAL_EXPORT_OPTIONS);
    }
  }, [open]);

  const setOption = <K extends keyof ExportOptionsState>(
    key: K,
    value: ExportOptionsState[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Родитель обнуляет `target` при закрытии, пока ещё идёт fade-out диалога:
  // держим последнюю цель, чтобы шапка не мигала пустым названием.
  const [displayTarget, setDisplayTarget] = useState(target);
  if (target && target !== displayTarget) {
    setDisplayTarget(target);
  }

  const kind = getTargetKind(displayTarget);
  const subtitle = getTargetSubtitle(displayTarget);

  const hasTarget =
    target != null &&
    (target.projectIds.length > 0 || target.folderIds.length > 0);

  const passphraseValid =
    !options.includeConnections ||
    options.passphrase.length >= MIN_EXPORT_PASSPHRASE_LENGTH;

  const canSubmit = hasTarget && !exporting && passphraseValid;

  const handleClose = () => {
    if (exporting) {
      return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!target || !canSubmit) {
      return;
    }

    const saved = await exportProjects(
      buildExportRequest(target, options, { canExportSchedule: isAdmin }),
      {
        suggestedName: buildBundleFileName(target.name),
        withSecrets: options.includeConnections,
      }
    );
    if (saved) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby={titleId}
      data-testid='features/project-transfer/export-dialog'
      slotProps={EXPORT_DIALOG_SLOT_PROPS}
    >
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          p: '16px 24px 16px 16px',
          borderBottom: `1px solid ${getTransferTokens(theme).border}`,
        })}
      >
        <Box
          component='span'
          aria-hidden
          sx={theme => {
            const t = getTransferTokens(theme);
            return {
              // Высота плашки = заголовок (22px) + название (18px)
              width: HEADER_ICON_SIZE,
              height: HEADER_ICON_SIZE,
              borderRadius: '10px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: t.iconTint,
              color: t.accent,
            };
          }}
        >
          <Folder size={18} strokeWidth={1.8} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            component='h2'
            id={titleId}
            sx={theme => ({
              m: 0,
              fontFamily: INTER_FONT,
              fontSize: 16,
              fontWeight: 650,
              lineHeight: '22px',
              letterSpacing: '-.015em',
              color: getTransferTokens(theme).text,
            })}
          >
            {TITLE_BY_KIND[kind]}
          </Box>
          {subtitle ? (
            <Box
              title={subtitle}
              data-testid='features/project-transfer/export-subtitle'
              sx={theme => ({
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: INTER_FONT,
                fontSize: 12.5,
                lineHeight: '18px',
                color: getTransferTokens(theme).text3,
              })}
            >
              {subtitle}
            </Box>
          ) : null}
        </Box>
        <Box
          component='button'
          type='button'
          aria-label='Закрыть'
          disabled={exporting}
          onClick={handleClose}
          sx={closeButtonSx}
        >
          <X size={16} strokeWidth={1.8} />
        </Box>
      </Box>

      <Box
        sx={theme => ({
          ...thinScrollbarSx(theme),
          overflowY: 'auto',
          overflowX: 'hidden',
          p: '12px 12px 10px',
        })}
      >
        <OptionItem
          title='Переменные проекта'
          description='Экспортировать переменные с их текущими значениями'
          checked={options.includeVariables}
          disabled={exporting}
          onCheckedChange={checked => setOption('includeVariables', checked)}
        />
        <OptionItem
          title='Подключения'
          description='Экспортировать используемые подключения'
          checked={options.includeConnections}
          disabled={exporting}
          flat
          onCheckedChange={checked => setOption('includeConnections', checked)}
        >
          <PassphraseField
            value={options.passphrase}
            disabled={exporting}
            onChange={value => setOption('passphrase', value)}
          />
        </OptionItem>
        <OptionItem
          title='Локальные файлы'
          description='Экспортировать файлы, загруженные через ноды'
          checked={options.includeFiles}
          disabled={exporting}
          onCheckedChange={checked => setOption('includeFiles', checked)}
        />
        {isAdmin ? (
          <OptionItem
            title='Расписание'
            description='Экспортировать настройки планировщика для проекта'
            checked={options.includeSchedule}
            disabled={exporting}
            onCheckedChange={checked => setOption('includeSchedule', checked)}
          />
        ) : null}
        {isAdmin && options.includeSchedule ? (
          <OptionItem
            title='Включить расписание после импорта'
            description='Сразу после импорта проект станет активным в планировщике и начнёт запускаться по расписанию'
            checked={options.enableScheduleAfterImport}
            disabled={exporting}
            onCheckedChange={checked =>
              setOption('enableScheduleAfterImport', checked)
            }
          />
        ) : null}
      </Box>

      <Box
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            p: '14px 24px',
            borderTop: `1px solid ${t.border}`,
            background: t.surface,
          };
        }}
      >
        <>
          <Box
            component='button'
            type='button'
            disabled={exporting}
            onClick={handleClose}
            sx={ghostButtonSx}
          >
            Отмена
          </Box>
          <Box
            component='button'
            type='button'
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            data-testid='features/project-transfer/export-submit'
            sx={primaryButtonSx}
          >
            {exporting ? <ButtonSpinner /> : null}
            {exporting ? 'Экспорт…' : 'Экспортировать'}
          </Box>
        </>
      </Box>
    </Dialog>
  );
};
