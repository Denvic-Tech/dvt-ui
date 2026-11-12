import { type ReactNode } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  EDGE_GAP,
  estimateDropdownHeight,
  getDropdownMenuOrigin,
  MENU_OFFSET,
  useDropdownPlacement,
} from './dropdownPlacement';
import { CheckIcon, ChevronDownIcon } from './icons';
import {
  FONT_FAMILY,
  MONO_FONT_FAMILY,
  scrollbarStyles,
  tokens,
} from './tokens';

const DropdownMenuRoot = styled(Menu, {
  shouldForwardProp: prop => prop !== 'mono',
})<{ mono?: boolean }>(({ mono = false }) => ({
  '& .MuiPaper-root': {
    boxSizing: 'border-box',
    padding: 4,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    backgroundColor: tokens.surface,
    boxShadow: tokens.menuShadow,
    overflowY: 'auto',
    ...scrollbarStyles(),
    scrollbarGutter: 'auto',
  },
  '& .MuiList-root': {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: 0,
  },
  '& .MuiMenuItem-root': {
    minHeight: 30,
    height: 30,
    flex: 'none',
    gap: 8,
    padding: '0 8px',
    borderRadius: 7,
    backgroundColor: 'transparent',
    color: tokens.text,
    fontFamily: mono ? MONO_FONT_FAMILY : FONT_FAMILY,
    fontSize: mono ? 12.5 : 13,
    fontWeight: mono ? 400 : 500,
    whiteSpace: 'nowrap',
    '&:hover, &.Mui-focusVisible, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible':
      { backgroundColor: tokens.hover },
    '&.Mui-selected': {
      backgroundColor: 'transparent',
      color: tokens.accentStrong,
      fontWeight: mono ? 500 : 600,
    },
    '&[data-tone="danger"]': { color: '#B42318' },
    '& .dropdown-label': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .dropdown-check': {
      display: 'flex',
      flex: 'none',
      marginLeft: 'auto',
      color: tokens.accentStrong,
    },
  },
}));

export type DropdownOption<V extends string> = {
  value: V;
  label: ReactNode;
  tone?: 'default' | 'danger';
};

type DropdownMenuProps<V extends string> = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  options: readonly DropdownOption<V>[];
  value: V | null;
  onSelect: (value: V) => void;
  ariaLabel: string;
  align?: 'start' | 'end';
  /** Ширина меню: как у якоря или фиксированная. */
  width?: number | 'anchor';
  mono?: boolean;
  /** Галочка у выбранного варианта. */
  showCheck?: boolean;
  /** Повторный клик по выбранному варианту снимает выбор. */
  onClear?: () => void;
};

/** Список вариантов (role=listbox) с автоматическим направлением раскрытия. */
export function DropdownMenu<V extends string>({
  anchorEl,
  open,
  onClose,
  options,
  value,
  onSelect,
  ariaLabel,
  align = 'start',
  width = 'anchor',
  mono = false,
  showCheck = false,
  onClear,
}: DropdownMenuProps<V>) {
  const placement = useDropdownPlacement(
    anchorEl,
    open,
    estimateDropdownHeight(options.length)
  );
  const menuWidth =
    width === 'anchor' ? (anchorEl?.getBoundingClientRect().width ?? 0) : width;

  return (
    <DropdownMenuRoot
      mono={mono}
      anchorEl={anchorEl}
      open={open && Boolean(anchorEl)}
      onClose={onClose}
      variant='selectedMenu'
      marginThreshold={EDGE_GAP}
      {...getDropdownMenuOrigin(placement, align)}
      MenuListProps={{ role: 'listbox', 'aria-label': ariaLabel }}
      slotProps={{
        paper: {
          style: {
            maxHeight: placement.maxHeight,
            width: menuWidth || undefined,
            minWidth: menuWidth || 120,
            marginTop: placement.side === 'top' ? -MENU_OFFSET : MENU_OFFSET,
          },
        },
      }}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <MenuItem
            key={option.value}
            role='option'
            aria-selected={selected}
            selected={selected}
            data-tone={option.tone ?? 'default'}
            onClick={() => {
              onClose();
              if (!selected) onSelect(option.value);
              else onClear?.();
            }}
          >
            {showCheck ? (
              <>
                <span className='dropdown-label'>{option.label}</span>
                {selected ? (
                  <span className='dropdown-check'>
                    <CheckIcon size={13} strokeWidth={1.8} />
                  </span>
                ) : null}
              </>
            ) : (
              option.label
            )}
          </MenuItem>
        );
      })}
    </DropdownMenuRoot>
  );
}

type MultiDropdownMenuProps<V extends string> = Omit<
  DropdownMenuProps<V>,
  'value' | 'onSelect' | 'showCheck' | 'onClear'
> & {
  values: readonly V[];
  /** Клик по варианту добавляет или убирает его; меню остаётся открытым. */
  onToggle: (value: V) => void;
  emptyText?: string;
};

/** Список с множественным выбором (role=listbox, aria-multiselectable). */
export function MultiDropdownMenu<V extends string>({
  anchorEl,
  open,
  onClose,
  options,
  values,
  onToggle,
  ariaLabel,
  align = 'start',
  width = 'anchor',
  mono = false,
  emptyText = 'Нет вариантов',
}: MultiDropdownMenuProps<V>) {
  const placement = useDropdownPlacement(
    anchorEl,
    open,
    estimateDropdownHeight(Math.max(options.length, 1))
  );
  const menuWidth =
    width === 'anchor' ? (anchorEl?.getBoundingClientRect().width ?? 0) : width;

  return (
    <DropdownMenuRoot
      mono={mono}
      anchorEl={anchorEl}
      open={open && Boolean(anchorEl)}
      onClose={onClose}
      variant='menu'
      marginThreshold={EDGE_GAP}
      {...getDropdownMenuOrigin(placement, align)}
      MenuListProps={{
        role: 'listbox',
        'aria-label': ariaLabel,
        'aria-multiselectable': true,
      }}
      slotProps={{
        paper: {
          style: {
            maxHeight: placement.maxHeight,
            width: menuWidth || undefined,
            minWidth: menuWidth || 120,
            marginTop: placement.side === 'top' ? -MENU_OFFSET : MENU_OFFSET,
          },
        },
      }}
    >
      {options.length === 0 ? (
        <MenuItem disabled>{emptyText}</MenuItem>
      ) : (
        options.map(option => {
          const selected = values.includes(option.value);
          return (
            <MenuItem
              key={option.value}
              role='option'
              aria-selected={selected}
              selected={selected}
              data-tone={option.tone ?? 'default'}
              onClick={() => onToggle(option.value)}
            >
              <span className='dropdown-label'>{option.label}</span>
              {selected ? (
                <span className='dropdown-check'>
                  <CheckIcon size={13} strokeWidth={1.8} />
                </span>
              ) : null}
            </MenuItem>
          );
        })
      )}
    </DropdownMenuRoot>
  );
}

/**
 * Меню действий (макет: `.menu` / `.mi`): разделители — MUI Divider,
 * опасные пункты — `data-tone="danger"`.
 */
export const ActionMenu = styled(Menu)({
  '& .MuiPaper-root': {
    minWidth: 260,
    marginTop: 4,
    padding: 4,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    backgroundColor: tokens.surface,
    boxShadow: tokens.menuShadow,
  },
  '& .MuiList-root': {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: 0,
  },
  '& .MuiDivider-root': {
    margin: '4px 6px !important',
    borderColor: tokens.divider,
  },
  '& .MuiMenuItem-root': {
    minHeight: 32,
    height: 32,
    gap: 10,
    padding: '0 10px',
    borderRadius: 7,
    color: tokens.text,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: 500,
    '& svg': { color: tokens.textMuted },
    '&:hover, &.Mui-focusVisible': { backgroundColor: tokens.hover },
    '&.Mui-disabled': { opacity: 1, color: tokens.textDisabled },
    '&[data-tone="danger"]': {
      color: '#B42318',
      '& svg': { color: '#B42318' },
      '&:hover, &.Mui-focusVisible': { backgroundColor: '#FEF0F0' },
    },
  },
});

/** Кнопка-селект в рамке (макет: `.sel`). */
export const SelectButton = styled('button', {
  shouldForwardProp: prop =>
    prop !== 'open' && prop !== 'changed' && prop !== 'mono',
})<{ open?: boolean; changed?: boolean; mono?: boolean }>(
  ({ open = false, changed = false, mono = false }) => ({
    width: '100%',
    height: 30,
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px 0 10px',
    border: `1px solid ${
      open ? tokens.accent : changed ? '#A9AEF6' : tokens.border
    }`,
    borderRadius: 8,
    backgroundColor: changed && !open ? '#F7F8FF' : tokens.surface,
    boxShadow: open ? tokens.focusRing : 'none',
    color: tokens.text,
    fontFamily: mono ? MONO_FONT_FAMILY : 'inherit',
    fontSize: mono ? 12.5 : 13,
    fontWeight: mono ? 400 : 500,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      borderColor: open ? tokens.accent : changed ? '#A9AEF6' : '#C9CEDA',
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: tokens.accent,
      boxShadow: tokens.focusRing,
    },
    '&:disabled, &:disabled:hover': {
      backgroundColor: tokens.hover,
      borderColor: tokens.divider,
      color: tokens.textDisabled,
      cursor: 'default',
    },
    '& .select-value': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .select-chevron': {
      display: 'flex',
      flex: 'none',
      marginLeft: 'auto',
      color: tokens.textSubtle,
    },
    '&:disabled .select-chevron': { color: tokens.textDisabled },
  })
);

export const SelectButtonContent = ({ children }: { children: ReactNode }) => (
  <>
    <span className='select-value'>{children}</span>
    <span className='select-chevron'>
      <ChevronDownIcon />
    </span>
  </>
);
