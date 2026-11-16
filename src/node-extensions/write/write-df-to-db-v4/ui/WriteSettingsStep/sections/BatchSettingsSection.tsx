import { type ChangeEvent, useEffect, useState } from 'react';

import { ChevronRightIcon } from '@/shared/ui/clean-minimal/icons';

import { ToggleSwitch } from '../../schema-step/SchemaStep.styles';
import { SettingLine } from '../SettingLine';
import {
  CollapseButton,
  SettingInput,
  SettingsBox,
  SettingsGroup,
} from '../settings.styles';

type SyncDescriptionsSectionProps = {
  syncDescriptions: boolean;
  onSyncDescriptionsChange: (checked: boolean) => void;
};

/** Синхронизация описаний колонок (макет: первая `.qbox`). */
export const SyncDescriptionsSection = ({
  syncDescriptions,
  onSyncDescriptionsChange,
}: SyncDescriptionsSectionProps) => (
  <SettingsBox>
    <SettingLine
      label='Синхронизировать описания колонок'
      hint='На каждом прогоне описания из Data Catalog записываются в комментарии колонок таблицы; пустое описание комментарий не стирает.'
      autoControl
    >
      <ToggleSwitch
        type='button'
        role='switch'
        checked={syncDescriptions}
        aria-checked={syncDescriptions}
        aria-label='Синхронизировать описания колонок с каталогом'
        onClick={() => onSyncDescriptionsChange(!syncDescriptions)}
      />
    </SettingLine>
  </SettingsBox>
);

type Bounds = { min: number; max: number };

type AdvancedSettingsSectionProps = {
  rowsPerBatch: number | null | undefined;
  rowsPerBatchBounds: Bounds;
  onRowsPerBatchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string[]>;
};

/** Раскрываемый блок «Дополнительно» (стиль как у «Параметры ClickHouse»). */
export const AdvancedSettingsSection = ({
  rowsPerBatch,
  rowsPerBatchBounds,
  onRowsPerBatchChange,
  errors = {},
}: AdvancedSettingsSectionProps) => {
  const [open, setOpen] = useState(false);
  const error = errors['rows_per_batch']?.join(' ');

  // Ошибка не должна прятаться в свёрнутом блоке.
  useEffect(() => {
    if (error) setOpen(true);
  }, [error]);

  return (
    <SettingsGroup>
      <SettingsBox>
        <CollapseButton
          type='button'
          open={open}
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          <span className='collapse-chevron'>
            <ChevronRightIcon size={12} strokeWidth={1.7} />
          </span>
          Дополнительно
        </CollapseButton>
        {open ? (
          <div>
            <SettingLine
              label='Размер чанка'
              hint='Строк в одном пакете записи. Пусто — размер подбирается автоматически по ширине строки.'
              error={error}
            >
              <SettingInput numeric invalid={Boolean(error)}>
                <input
                  id='rows_per_batch'
                  type='number'
                  inputMode='numeric'
                  value={rowsPerBatch ?? ''}
                  onChange={onRowsPerBatchChange}
                  min={rowsPerBatchBounds.min}
                  max={rowsPerBatchBounds.max}
                  step={1}
                  placeholder='Авто'
                  aria-label='Размер чанка'
                  aria-invalid={Boolean(error)}
                  spellCheck={false}
                />
                {rowsPerBatch != null ? (
                  <span className='input-suffix'>строк</span>
                ) : null}
              </SettingInput>
            </SettingLine>
          </div>
        ) : null}
      </SettingsBox>
    </SettingsGroup>
  );
};
