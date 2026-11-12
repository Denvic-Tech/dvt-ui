import { type MouseEvent, useMemo, useState } from 'react';

import {
  DropdownMenu,
  type DropdownOption,
  MultiDropdownMenu,
} from '@/shared/ui/clean-minimal/dropdown';
import { ChevronDownIcon } from '@/shared/ui/clean-minimal/icons';

import { FieldSelectButton, GhostSelectButton } from './settings.styles';

type ColumnsSelectProps = {
  ariaLabel: string;
  /** Выбранные значения; для одиночного выбора — массив из 0–1 элемента. */
  values: readonly string[];
  options: readonly string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Значения не моноширинным шрифтом (например, Engine). */
  plainFont?: boolean;
  /** `ghost` — без рамки в строке настроек, `field` — в рамке на всю ширину. */
  variant?: 'ghost' | 'field';
  /** Одиночный выбор: повторный клик снимает значение. */
  clearable?: boolean;
};

/** Выбор колонок (макет: `.qsel`): одиночный или множественный. */
export const ColumnsSelect = ({
  ariaLabel,
  values,
  options,
  onChange,
  multiple = false,
  placeholder,
  invalid = false,
  disabled = false,
  plainFont = false,
  variant = 'ghost',
  clearable = true,
}: ColumnsSelectProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Сохранённые значения остаются в списке, даже если колонки уже нет.
  const menuOptions = useMemo<DropdownOption<string>[]>(() => {
    const names = new Set<string>(options);
    for (const value of values) names.add(value);
    return Array.from(names, name => ({ value: name, label: name }));
  }, [options, values]);

  const content = (
    <>
      {values.length ? (
        <span className='select-value' data-ui={plainFont}>
          {values.join(', ')}
        </span>
      ) : (
        <span className='select-placeholder'>{placeholder}</span>
      )}
      <span className='select-chevron'>
        <ChevronDownIcon size={13} />
      </span>
    </>
  );

  const buttonProps = {
    type: 'button' as const,
    'aria-label': ariaLabel,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': open,
    'aria-invalid': invalid || undefined,
    title: values.length ? values.join(', ') : undefined,
    disabled,
    onClick: (event: MouseEvent<HTMLButtonElement>) =>
      setAnchorEl(open ? null : event.currentTarget),
  };

  const close = () => setAnchorEl(null);
  const menuWidth = variant === 'field' ? 'anchor' : 260;

  return (
    <>
      {variant === 'field' ? (
        <FieldSelectButton {...buttonProps} open={open}>
          {content}
        </FieldSelectButton>
      ) : (
        <GhostSelectButton {...buttonProps} open={open} invalid={invalid}>
          {content}
        </GhostSelectButton>
      )}
      {multiple ? (
        <MultiDropdownMenu
          anchorEl={anchorEl}
          open={open}
          onClose={close}
          options={menuOptions}
          values={values}
          onToggle={value =>
            onChange(
              values.includes(value)
                ? values.filter(item => item !== value)
                : [...values, value]
            )
          }
          ariaLabel={ariaLabel}
          align='end'
          width={menuWidth}
          mono={!plainFont}
          emptyText='Нет колонок'
        />
      ) : (
        <DropdownMenu
          anchorEl={anchorEl}
          open={open}
          onClose={close}
          options={menuOptions}
          value={values[0] ?? null}
          onSelect={value => onChange([value])}
          {...(clearable ? { onClear: () => onChange([]) } : {})}
          ariaLabel={ariaLabel}
          align='end'
          width={menuWidth}
          mono={!plainFont}
          showCheck
        />
      )}
    </>
  );
};
