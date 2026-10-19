import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

import type { MergeStrategy } from '@/shared/gatewayClient';

import {
  getTransferTokens,
  iconButtonSx,
  MONO_FONT,
} from '../../ui/transferDialogStyles';

export const SectionLabel: React.FC<{
  children: React.ReactNode;
  hint?: string;
}> = ({ children, hint }) => (
  <Box sx={{ mb: '8px' }}>
    <Box
      sx={theme => ({
        fontSize: 13.5,
        fontWeight: 500,
        color: getTransferTokens(theme).text,
      })}
    >
      {children}
    </Box>
    {hint ? (
      <Box
        sx={theme => ({
          mt: '2px',
          fontSize: 12,
          lineHeight: 1.4,
          color: getTransferTokens(theme).text3,
        })}
      >
        {hint}
      </Box>
    ) : null}
  </Box>
);

const MERGE_OPTIONS: { value: MergeStrategy; label: string }[] = [
  { value: 'append', label: 'Добавить рядом' },
  { value: 'replace', label: 'Заменить' },
];

/** Сегментированный выбор стратегии, когда в проекте уже есть граф. */
export const MergeStrategySwitch: React.FC<{
  value: MergeStrategy;
  disabled: boolean;
  onChange: (value: MergeStrategy) => void;
}> = ({ value, disabled, onChange }) => (
  <Box data-testid='features/project-transfer/import-merge-strategy'>
    <SectionLabel>В проекте уже есть граф</SectionLabel>
    <Box
      role='radiogroup'
      aria-label='В проекте уже есть граф'
      sx={theme => ({
        display: 'flex',
        gap: '2px',
        p: '3px',
        borderRadius: '10px',
        background: getTransferTokens(theme).surface,
      })}
    >
      {MERGE_OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <Box
            key={option.value}
            component='button'
            type='button'
            role='radio'
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                flex: 1,
                height: 30,
                border: 0,
                borderRadius: '7px',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'background .12s, color .12s',
                background: selected ? t.bg : 'transparent',
                color: selected ? t.text : t.text2,
                boxShadow: selected ? '0 1px 2px rgba(22,24,46,.1)' : 'none',
              };
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
    <Box
      sx={theme => {
        const t = getTransferTokens(theme);
        return {
          mt: '6px',
          fontSize: 12,
          lineHeight: 1.4,
          color: value === 'replace' ? t.danger : t.text3,
        };
      }}
    >
      {value === 'replace'
        ? 'Текущие ноды будут удалены'
        : 'Импортированные ноды появятся рядом с текущими'}
    </Box>
  </Box>
);

/** Пароль архива для расшифровки секретов подключений. */
export const ImportPassphraseField: React.FC<{
  value: string;
  invalid: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}> = ({ value, invalid, disabled, onChange }) => {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Box>
      <SectionLabel hint='Файл содержит зашифрованные пароли и токены подключений'>
        Пароль
      </SectionLabel>
      <Box
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            display: 'flex',
            alignItems: 'center',
            height: 36,
            p: '0 4px 0 12px',
            borderRadius: '9px',
            background: t.bg,
            border: `1.5px solid ${
              invalid ? t.dangerBorder : focused ? t.accent : t.borderStrong
            }`,
            transition: 'border-color .12s',
          };
        }}
      >
        <Box
          component='input'
          type={visible ? 'text' : 'password'}
          autoComplete='off'
          placeholder='Пароль, заданный при экспорте'
          aria-label='Пароль архива'
          aria-invalid={invalid}
          data-testid='features/project-transfer/import-passphrase'
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
        <Box
          component='button'
          type='button'
          title={visible ? 'Скрыть' : 'Показать'}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          disabled={disabled}
          onClick={() => setVisible(prev => !prev)}
          sx={iconButtonSx(28, 7)}
        >
          {visible ? (
            <EyeOff size={15} strokeWidth={1.7} />
          ) : (
            <Eye size={15} strokeWidth={1.7} />
          )}
        </Box>
      </Box>
      <Box
        role={invalid ? 'alert' : undefined}
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            mt: '6px',
            fontSize: 12,
            lineHeight: 1.4,
            color: invalid ? t.danger : t.text3,
          };
        }}
      >
        {invalid
          ? 'Неверный пароль'
          : value
            ? 'Пароли и токены будут перенесены в подключения'
            : 'Без пароля подключения будут созданы без паролей и токенов'}
      </Box>
    </Box>
  );
};

/** Список коротких сообщений: предупреждения (amber) или ошибки (danger). */
export const MessageList: React.FC<{
  messages: string[];
  tone: 'warning' | 'error';
  testId: string;
}> = ({ messages, tone, testId }) =>
  messages.length > 0 ? (
    <Box
      role={tone === 'error' ? 'alert' : undefined}
      data-testid={testId}
      sx={theme => {
        const t = getTransferTokens(theme);
        return {
          display: 'grid',
          gap: '4px',
          fontSize: 12.5,
          lineHeight: 1.45,
          color: tone === 'error' ? t.danger : t.amber,
        };
      }}
    >
      {messages.map((message, index) => (
        <Box key={`${index}-${message}`}>{message}</Box>
      ))}
    </Box>
  ) : null;
