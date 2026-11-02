import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { VariableOutput, VariableType } from '@/shared/lib/variables';

const MONO_FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const TYPE_GLYPHS: Partial<Record<VariableType, string>> = {
  STRING: 'Aa',
  BOOLEAN: 'T/F',
  INT: '12',
  FLOAT: '1.5',
  DICT: '{}',
  JSON: '{}',
  DATETIME: '⏱',
  TIMEDELTA: 'Δt',
};

const getTypeGlyph = (variable: VariableOutput): string => {
  const glyph = TYPE_GLYPHS[variable.type] ?? '…';
  return variable.isListType ? `[${glyph}]` : glyph;
};

const SCOPE_LABELS = {
  system: 'Системные переменные',
  user: 'Пользовательские переменные',
} as const;

const getPickerTitle = (variables: VariableOutput[]): string => {
  const scopes = new Set(variables.map(variable => variable.scope));
  if (scopes.size === 1) {
    const [scope] = scopes;
    return scope ? SCOPE_LABELS[scope] : 'Переменные';
  }
  return 'Переменные';
};

const groupBySource = (variables: VariableOutput[]) => {
  const groups = new Map<string, VariableOutput[]>();
  for (const variable of variables) {
    const label =
      variable.sourceLabel ??
      (variable.scope === 'system' ? 'Система' : 'Проект');
    const bucket = groups.get(label) ?? [];
    bucket.push(variable);
    groups.set(label, bucket);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
};

const DatabaseIcon: React.FC = () => (
  <svg
    aria-hidden
    width='12'
    height='12'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <ellipse cx='12' cy='5' rx='9' ry='3' />
    <path d='M3 5v14a9 3 0 0 0 18 0V5' />
    <path d='M3 12a9 3 0 0 0 18 0' />
  </svg>
);

const InsertIcon: React.FC = () => (
  <svg
    aria-hidden
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={{ flexShrink: 0 }}
  >
    <polyline points='9 10 4 15 9 20' />
    <path d='M20 4v7a4 4 0 0 1-4 4H4' />
  </svg>
);

type CompactVariablePickerProps = {
  variables: VariableOutput[];
  selectedName?: string | null | undefined;
  onSelect: (variable: VariableOutput) => void;
};

export const CompactVariablePicker: React.FC<CompactVariablePickerProps> = ({
  variables,
  selectedName,
  onSelect,
}) => {
  const groups = useMemo(() => groupBySource(variables), [variables]);
  const title = useMemo(() => getPickerTitle(variables), [variables]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Typography
          component='span'
          sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}
        >
          {title}
        </Typography>
        <Box
          component='span'
          sx={theme => ({
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '18px',
            px: 0.75,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.text.primary, 0.06),
            color: 'text.secondary',
          })}
        >
          {variables.length}
        </Box>
      </Box>

      <Box sx={{ maxHeight: 280, overflowY: 'auto', pt: 0.25, pb: 0.75 }}>
        {groups.length === 0 ? (
          <Typography
            sx={{ px: 1.5, py: 1.25, fontSize: 12, color: 'text.secondary' }}
          >
            Нет доступных переменных
          </Typography>
        ) : (
          groups.map(group => (
            <Box key={group.label}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  pt: 1,
                  pb: 0.5,
                  fontSize: 11,
                  color: 'text.secondary',
                }}
              >
                <DatabaseIcon />
                <span>{group.label}</span>
              </Box>
              {group.items.map(variable => {
                const isSelected = selectedName === variable.name;
                return (
                  <Box
                    key={`${variable.scope}:${variable.name}:${variable.type}`}
                    component='button'
                    type='button'
                    title={`Вставить ${variable.name}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(variable)}
                    sx={theme => ({
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 1.5,
                      py: 0.75,
                      border: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                      transition: 'background-color 100ms ease',
                      '& .compact-variable-insert': {
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        width: 0,
                        ml: '-10px',
                        opacity: 0,
                        overflow: 'hidden',
                        color: theme.palette.primary.main,
                        transition:
                          'width 120ms ease, margin 120ms ease, opacity 120ms ease',
                      },
                      '&:hover, &:focus-visible': {
                        outline: 'none',
                        backgroundColor: alpha(
                          theme.palette.text.primary,
                          0.04
                        ),
                        '& .compact-variable-name': {
                          color: theme.palette.primary.main,
                        },
                        '& .compact-variable-insert': {
                          width: 14,
                          ml: 0,
                          opacity: 1,
                        },
                      },
                    })}
                  >
                    <Box
                      component='code'
                      className='compact-variable-name'
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: MONO_FONT_FAMILY,
                        fontSize: 12,
                        color: 'text.primary',
                      }}
                    >
                      {variable.name}
                    </Box>
                    <Box component='span' className='compact-variable-insert'>
                      <InsertIcon />
                    </Box>
                    <Box
                      component='span'
                      sx={theme => ({
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 0.75,
                        py: '2px',
                        borderRadius: 1,
                        backgroundColor: alpha(
                          theme.palette.text.primary,
                          0.06
                        ),
                        color: 'text.secondary',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      })}
                    >
                      <Box
                        component='span'
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          letterSpacing: 0,
                          opacity: 0.8,
                        }}
                      >
                        {getTypeGlyph(variable)}
                      </Box>
                      {variable.type}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};
