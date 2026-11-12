import { useId, useMemo, useState } from 'react';

import type { Column } from '@/shared/gatewayClient';
import {
  DropdownMenu,
  type DropdownOption,
} from '@/shared/ui/clean-minimal/dropdown';
import { ChevronDownIcon } from '@/shared/ui/clean-minimal/icons';

import { KeySelectButton, ModeKeyRow } from './WriteModeStep.styles';

type UpsertKeySelectProps = {
  value: string;
  columns: readonly Column[];
  onChange: (keyColumn: string) => void;
  disabled?: boolean;
};

/** Строка «Ключ сопоставления» с выбором колонки (макет: `.zrk` / `.zsel`). */
export const UpsertKeySelect = ({
  value,
  columns,
  onChange,
  disabled = false,
}: UpsertKeySelectProps) => {
  const labelId = useId();
  const valueId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const keyColumn = value.trim();

  const options = useMemo<DropdownOption<string>[]>(() => {
    const names = new Set<string>();
    for (const column of columns) {
      if (column.name) names.add(column.name);
    }
    // Сохранённый ключ показываем, даже если его уже нет среди колонок.
    if (keyColumn) names.add(keyColumn);
    return Array.from(names, name => ({ value: name, label: name }));
  }, [columns, keyColumn]);

  return (
    <ModeKeyRow>
      <span className='key-label' id={labelId}>
        Ключ сопоставления
      </span>
      <KeySelectButton
        type='button'
        open={open}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={event => setAnchorEl(open ? null : event.currentTarget)}
      >
        {keyColumn ? (
          <span className='key-value' id={valueId}>
            {keyColumn}
          </span>
        ) : (
          <span className='key-placeholder' id={valueId}>
            Выберите колонку
          </span>
        )}
        <span className='key-chevron'>
          <ChevronDownIcon size={13} />
        </span>
      </KeySelectButton>
      <DropdownMenu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        options={options}
        value={keyColumn || null}
        onSelect={onChange}
        onClear={() => onChange('')}
        ariaLabel='Ключ сопоставления'
        align='end'
        width={280}
        mono
        showCheck
      />
    </ModeKeyRow>
  );
};
