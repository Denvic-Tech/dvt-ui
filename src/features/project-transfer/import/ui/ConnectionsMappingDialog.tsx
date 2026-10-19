import React, { useMemo, useRef, useState } from 'react';
import { Box, Popover } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Check, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

import { getConnectionTypeLabel } from '@/entities/data/db-connection';

import type { ConnectionPreviewSchema } from '@/shared/gatewayClient';

import type { ConnectionDecisionState } from '../../lib/importRequest';
import {
  getTransferDialogSlotProps,
  getTransferTokens,
  ghostButtonSx,
  iconButtonSx,
  primaryButtonSx,
  thinScrollbarSx,
} from '../../ui/transferDialogStyles';
import type { ExistingConnectionOption } from '../model/connectionOptions';

import {
  ConnectionStatus,
  ConnectionTypeMark,
  RadioDot,
} from './connectionParts';

type DecisionsByRef = Record<string, ConnectionDecisionState>;
type OptionsByRef = Record<string, ExistingConnectionOption[]>;

const MAPPING_DIALOG_SLOT_PROPS = getTransferDialogSlotProps({
  width: 720,
  height: 500,
  backdrop: 'rgba(22,24,46,.18)',
  blur: false,
  interFont: true,
});

const EMPTY_OPTIONS: ExistingConnectionOption[] = [];

const matchesQuery = (value: string, query: string) =>
  value.toLowerCase().includes(query.trim().toLowerCase());

const SearchField: React.FC<{
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  variant: 'filled' | 'bare';
}> = ({ value, placeholder, onChange, autoFocus = false, variant }) => (
  <Box
    sx={theme => {
      const t = getTransferTokens(theme);
      return variant === 'filled'
        ? {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: 32,
            p: '0 10px',
            flexShrink: 0,
            borderRadius: '8px',
            background: t.surface,
            color: t.text3,
          }
        : {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: 38,
            p: '0 12px',
            borderBottom: `1px solid ${t.border}`,
            color: t.text3,
          };
    }}
  >
    <Search size={14} strokeWidth={1.8} />
    <Box
      component='input'
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
      sx={theme => {
        const t = getTransferTokens(theme);
        return {
          flex: 1,
          minWidth: 0,
          p: 0,
          border: 0,
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 13,
          color: t.text,
          '&::placeholder': { color: t.text4, opacity: 1 },
        };
      }}
    />
  </Box>
);

const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={theme => ({
      p: '10px',
      fontSize: 12.5,
      color: getTransferTokens(theme).text3,
    })}
  >
    {children}
  </Box>
);

interface ConnectionPickerProps {
  connection: ConnectionPreviewSchema;
  value: string | null;
  options: ExistingConnectionOption[];
  onChange: (id: string) => void;
}

/** Выбор существующего подключения с поиском. */
const ConnectionPicker: React.FC<ConnectionPickerProps> = ({
  connection,
  value,
  options,
  onChange,
}) => {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = options.find(option => option.id === value);
  const shown = options.filter(option => matchesQuery(option.name, query));

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Box
        ref={anchorRef}
        component='button'
        type='button'
        aria-haspopup='listbox'
        aria-expanded={open}
        data-testid='features/project-transfer/import-connection-picker'
        onClick={() => setOpen(prev => !prev)}
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            height: 48,
            p: '0 12px 0 10px',
            border: 0,
            borderRadius: '9px',
            background: open ? t.surface : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'background .1s',
            '&:hover': { background: t.surface },
          };
        }}
      >
        <ConnectionTypeMark type={connection.type} />
        <Box component='span' sx={{ flex: 1, minWidth: 0 }}>
          <Box
            component='span'
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.3,
                color: current ? t.text : t.text3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              };
            }}
          >
            {current ? current.name : 'Выберите подключение'}
          </Box>
          <Box
            component='span'
            sx={theme => ({
              display: 'block',
              mt: '1px',
              fontSize: 12,
              lineHeight: 1.35,
              color: getTransferTokens(theme).text3,
            })}
          >
            {getConnectionTypeLabel(connection.type)}
          </Box>
        </Box>
        <Box
          component='span'
          sx={theme => ({
            display: 'flex',
            flexShrink: 0,
            color: getTransferTokens(theme).text3,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          })}
        >
          <ChevronDown size={14} strokeWidth={1.9} />
        </Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: theme => ({
              mt: '6px',
              width: anchorRef.current?.offsetWidth ?? 320,
              borderRadius: '10px',
              background: getTransferTokens(theme).bg,
              backgroundImage: 'none',
              border: 0,
              boxShadow: getTransferTokens(theme).popoverShadow,
              overflow: 'hidden',
            }),
          },
        }}
      >
        <SearchField
          variant='bare'
          autoFocus
          value={query}
          placeholder='Поиск'
          onChange={setQuery}
        />
        <Box
          role='listbox'
          sx={theme => ({
            ...thinScrollbarSx(theme),
            maxHeight: 216,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: '4px',
          })}
        >
          {shown.map(option => {
            const selected = option.id === value;
            return (
              <Box
                key={option.id}
                component='button'
                type='button'
                role='option'
                aria-selected={selected}
                onClick={() => {
                  onChange(option.id);
                  close();
                }}
                sx={theme => {
                  const t = getTransferTokens(theme);
                  return {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    height: 34,
                    p: '0 10px',
                    border: 0,
                    borderRadius: '7px',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    '&:hover': { background: t.surfaceHover },
                  };
                }}
              >
                <Box
                  component='span'
                  sx={theme => ({
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: selected ? 500 : 400,
                    color: getTransferTokens(theme).text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {option.name}
                </Box>
                {option.name === connection.name ? (
                  <Box
                    component='span'
                    sx={theme => ({
                      fontSize: 11.5,
                      color: getTransferTokens(theme).text3,
                      flexShrink: 0,
                    })}
                  >
                    То же имя
                  </Box>
                ) : null}
                <Box
                  component='span'
                  sx={theme => ({
                    width: 14,
                    display: 'flex',
                    flexShrink: 0,
                    color: getTransferTokens(theme).accent,
                  })}
                >
                  {selected ? <Check size={14} strokeWidth={2.4} /> : null}
                </Box>
              </Box>
            );
          })}
          {shown.length === 0 ? <EmptyHint>Ничего не найдено</EmptyHint> : null}
        </Box>
      </Popover>
    </>
  );
};

interface ActionTilesProps {
  connection: ConnectionPreviewSchema;
  decision: ConnectionDecisionState;
  options: ExistingConnectionOption[];
  onChange: (next: ConnectionDecisionState) => void;
}

const ActionTiles: React.FC<ActionTilesProps> = ({
  connection,
  decision,
  options,
  onChange,
}) => {
  const typeLabel = getConnectionTypeLabel(connection.type);
  const sameName = options.find(option => option.name === connection.name);
  const rows: {
    action: ConnectionDecisionState['action'];
    title: string;
    description: string;
    disabled: boolean;
  }[] = [
    {
      action: 'create',
      title: 'Создать новое',
      description: connection.inaccessible
        ? 'Нет прав на создание подключений этого типа'
        : 'Подключение будет создано с настройками из файла',
      disabled: connection.inaccessible,
    },
    {
      action: 'skip',
      title: 'Пропустить',
      description: 'Ноды с этим подключением нужно будет настроить вручную',
      disabled: false,
    },
    {
      action: 'use_existing',
      title: 'Сопоставить с существующим',
      description:
        options.length > 0
          ? 'Будет использоваться выбранное подключение'
          : `В проекте нет подключений ${typeLabel}`,
      disabled: options.length === 0,
    },
  ];

  const select = (action: ConnectionDecisionState['action']) => {
    if (action === 'use_existing') {
      onChange({
        ...decision,
        action,
        connectionId: decision.connectionId ?? sameName?.id ?? null,
      });
      return;
    }
    onChange({ ...decision, action, connectionId: null });
  };

  return (
    <Box
      role='radiogroup'
      aria-label='Действие при импорте'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        minHeight: 0,
      }}
    >
      {rows.map(row => {
        const selected = decision.action === row.action;
        return (
          <Box
            key={row.action}
            role='radio'
            aria-checked={selected}
            aria-disabled={row.disabled}
            aria-label={row.title}
            tabIndex={row.disabled ? -1 : 0}
            onClick={() => {
              if (!row.disabled && !selected) {
                select(row.action);
              }
            }}
            onKeyDown={event => {
              if (
                (event.key === 'Enter' || event.key === ' ') &&
                !row.disabled &&
                !selected
              ) {
                event.preventDefault();
                select(row.action);
              }
            }}
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: 48,
                p: '0 10px',
                flexShrink: 0,
                borderRadius: '9px',
                outline: 'none',
                background: selected ? t.accentSoft : 'transparent',
                cursor: row.disabled || selected ? 'default' : 'pointer',
                transition: 'background .1s',
                ...(row.disabled || selected
                  ? {}
                  : { '&:hover': { background: t.surfaceHover } }),
                '&:focus-visible': {
                  boxShadow: `inset 0 0 0 1.5px ${t.accent}`,
                },
              };
            }}
          >
            <RadioDot checked={selected} disabled={row.disabled} />
            <Box sx={{ flex: 1, minWidth: 0, opacity: row.disabled ? 0.5 : 1 }}>
              <Box
                sx={theme => {
                  const t = getTransferTokens(theme);
                  return {
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: selected ? t.accent : t.text,
                  };
                }}
              >
                {row.title}
              </Box>
              <Box
                sx={theme => ({
                  mt: '1px',
                  fontSize: 12,
                  lineHeight: 1.35,
                  color: getTransferTokens(theme).text3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                })}
              >
                {row.description}
              </Box>
            </Box>
          </Box>
        );
      })}

      {decision.action === 'use_existing' ? (
        <Box sx={{ mt: '14px' }}>
          <Box
            sx={theme => ({
              p: '0 10px',
              mb: '4px',
              fontSize: 12,
              fontWeight: 500,
              color: getTransferTokens(theme).text3,
            })}
          >
            Доступные подключения
          </Box>
          <ConnectionPicker
            connection={connection}
            value={decision.connectionId}
            options={options}
            onChange={id =>
              onChange({
                ...decision,
                action: 'use_existing',
                connectionId: id,
              })
            }
          />
        </Box>
      ) : null}
    </Box>
  );
};

type BulkAction = 'create' | 'skip';

const BulkMenu: React.FC<{ onPick: (action: BulkAction) => void }> = ({
  onPick,
}) => {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        ref={anchorRef}
        component='button'
        type='button'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        sx={theme => ({
          ...ghostButtonSx(theme),
          p: '0 12px',
          fontWeight: 500,
          gap: '6px',
        })}
      >
        Для всех
        <ChevronUp size={12} strokeWidth={2} />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: theme => ({
              mt: '-6px',
              width: 220,
              p: '4px',
              borderRadius: '10px',
              background: getTransferTokens(theme).bg,
              backgroundImage: 'none',
              border: 0,
              boxShadow: getTransferTokens(theme).popoverShadow,
            }),
          },
        }}
      >
        <Box role='menu'>
          {(
            [
              ['create', 'Создать новые'],
              ['skip', 'Пропустить все'],
            ] as const
          ).map(([action, label]) => (
            <Box
              key={action}
              component='button'
              type='button'
              role='menuitem'
              onClick={() => {
                onPick(action);
                setOpen(false);
              }}
              sx={theme => {
                const t = getTransferTokens(theme);
                return {
                  display: 'block',
                  width: '100%',
                  height: 32,
                  p: '0 10px',
                  border: 0,
                  borderRadius: '7px',
                  background: 'transparent',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: t.text,
                  cursor: 'pointer',
                  '&:hover': { background: t.surfaceHover },
                };
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};

export interface ConnectionsMappingDialogProps {
  open: boolean;
  connections: ConnectionPreviewSchema[];
  decisions: DecisionsByRef;
  optionsByRef: OptionsByRef;
  onApply: (next: DecisionsByRef) => void;
  onClose: () => void;
}

/** Окно настройки подключений из архива (макет «ConnSettings»). */
export const ConnectionsMappingDialog: React.FC<
  ConnectionsMappingDialogProps
> = ({ open, connections, decisions, optionsByRef, onApply, onClose }) => {
  const [draft, setDraft] = useState<DecisionsByRef>(decisions);
  const [selectedRef, setSelectedRef] = useState<string | null>(
    connections[0]?.ref ?? null
  );
  const [query, setQuery] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Черновик пересоздаётся только в момент открытия окна
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(decisions);
      setSelectedRef(connections[0]?.ref ?? null);
      setQuery('');
    }
  }

  const selected = connections.find(
    connection => connection.ref === selectedRef
  );
  const shown = useMemo(
    () =>
      connections.filter(connection =>
        matchesQuery(
          `${connection.name} ${getConnectionTypeLabel(connection.type)}`,
          query
        )
      ),
    [connections, query]
  );

  const changed = connections.some(connection => {
    const before = decisions[connection.ref];
    const after = draft[connection.ref];
    return (
      before?.action !== after?.action ||
      before?.connectionId !== after?.connectionId
    );
  });
  const incomplete = connections.some(connection => {
    const decision = draft[connection.ref];
    return decision?.action === 'use_existing' && !decision.connectionId;
  });

  const targetName = (ref: string) => {
    const decision = draft[ref];
    return decision?.connectionId
      ? optionsByRef[ref]?.find(option => option.id === decision.connectionId)
          ?.name
      : undefined;
  };

  const applyBulk = (action: BulkAction) => {
    setDraft(prev => {
      const next: DecisionsByRef = { ...prev };
      for (const connection of connections) {
        const current = prev[connection.ref];
        if (!current) {
          continue;
        }
        if (action === 'create' && connection.inaccessible) {
          continue;
        }
        next[connection.ref] = { ...current, action, connectionId: null };
      }
      return next;
    });
  };

  const selectedDecision = selected ? draft[selected.ref] : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label='Настройка подключений'
      data-testid='features/project-transfer/import-connections-dialog'
      slotProps={MAPPING_DIALOG_SLOT_PROPS}
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box
          sx={theme => ({
            width: 264,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${getTransferTokens(theme).border}`,
          })}
        >
          <Box sx={{ m: '12px 12px 10px' }}>
            <SearchField
              variant='filled'
              value={query}
              placeholder='Поиск'
              onChange={setQuery}
            />
          </Box>
          <Box
            sx={theme => ({
              ...thinScrollbarSx(theme),
              flex: 1,
              overflowY: 'auto',
              p: '0 8px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            })}
          >
            {shown.map(connection => {
              const isSelected = connection.ref === selectedRef;
              const decision = draft[connection.ref];
              if (!decision) {
                return null;
              }
              const skipped = decision.action === 'skip';
              return (
                <Box
                  key={connection.ref}
                  role='button'
                  tabIndex={0}
                  aria-pressed={isSelected}
                  data-testid={`features/project-transfer/import-connection-item-${connection.ref}`}
                  onClick={() => setSelectedRef(connection.ref)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedRef(connection.ref);
                    }
                  }}
                  sx={theme => {
                    const t = getTransferTokens(theme);
                    return {
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: 48,
                      flexShrink: 0,
                      p: '0 10px',
                      borderRadius: '9px',
                      cursor: 'pointer',
                      outline: 'none',
                      background: isSelected ? t.accentSoft : 'transparent',
                      ...(isSelected
                        ? {}
                        : { '&:hover': { background: t.surfaceHover } }),
                      '&:focus-visible': {
                        boxShadow: `inset 0 0 0 1.5px ${t.accent}`,
                      },
                    };
                  }}
                >
                  {isSelected ? (
                    <Box
                      component='span'
                      sx={theme => ({
                        position: 'absolute',
                        left: -8,
                        top: 12,
                        bottom: 12,
                        width: 3,
                        borderRadius: '0 3px 3px 0',
                        background: getTransferTokens(theme).accent,
                      })}
                    />
                  ) : null}
                  <ConnectionTypeMark type={connection.type} dim={skipped} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={theme => {
                        const t = getTransferTokens(theme);
                        return {
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected
                            ? t.accent
                            : skipped
                              ? t.text3
                              : t.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        };
                      }}
                    >
                      {connection.name}
                    </Box>
                    <Box sx={{ mt: '1px', display: 'flex', minWidth: 0 }}>
                      <ConnectionStatus
                        decision={decision}
                        targetName={targetName(connection.ref)}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {shown.length === 0 ? (
              <EmptyHint>Ничего не найдено</EmptyHint>
            ) : null}
          </Box>
        </Box>

        {selected && selectedDecision ? (
          <Box
            key={selected.ref}
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              p: '0 8px 8px',
              animation: 'importPaneOpen .15s ease-out',
              '@keyframes importPaneOpen': {
                from: { opacity: 0, transform: 'translateY(-3px)' },
                to: { opacity: 1, transform: 'none' },
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: 32,
                m: '12px 10px 10px',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <Box
                  sx={theme => ({
                    fontSize: 15,
                    fontWeight: 600,
                    color: getTransferTokens(theme).text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {selected.name}
                </Box>
                <Box
                  sx={theme => ({
                    fontSize: 12.5,
                    color: getTransferTokens(theme).text3,
                    flexShrink: 0,
                  })}
                >
                  {getConnectionTypeLabel(selected.type)}
                </Box>
              </Box>
              <Box
                component='button'
                type='button'
                aria-label='Закрыть'
                onClick={onClose}
                sx={theme => ({ ...iconButtonSx(28, 7)(theme), mr: '-4px' })}
              >
                <X size={16} strokeWidth={1.8} />
              </Box>
            </Box>
            <ActionTiles
              connection={selected}
              decision={selectedDecision}
              options={optionsByRef[selected.ref] ?? EMPTY_OPTIONS}
              onChange={next =>
                setDraft(prev => ({ ...prev, [selected.ref]: next }))
              }
            />
          </Box>
        ) : null}
      </Box>

      <Box
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            p: '12px 24px 12px 12px',
            borderTop: `1px solid ${t.border}`,
            background: t.bg,
          };
        }}
      >
        <BulkMenu onPick={applyBulk} />
        <Box sx={{ flex: 1 }} />
        <Box
          component='button'
          type='button'
          onClick={onClose}
          sx={ghostButtonSx}
        >
          Отмена
        </Box>
        <Box
          component='button'
          type='button'
          disabled={incomplete}
          data-testid='features/project-transfer/import-connections-apply'
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          sx={primaryButtonSx}
        >
          {changed ? 'Применить' : 'Готово'}
        </Box>
      </Box>
    </Dialog>
  );
};
