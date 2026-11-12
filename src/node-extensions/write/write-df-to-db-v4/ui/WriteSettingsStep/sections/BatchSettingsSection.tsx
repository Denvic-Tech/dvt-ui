import type { ChangeEvent } from 'react';

import { ToggleSwitch } from '../../schema-step/SchemaStep.styles';
import { SettingLine } from '../SettingLine';
import { SettingInput, SettingsBox } from '../settings.styles';

type Bounds = { min: number; max: number };

type BatchSettingsSectionProps = {
  chunkSize: number | null | undefined;
  chunkSizeBounds: Bounds;
  minBatchRows: number | null | undefined;
  minBatchRowsBounds: Bounds;
  onChunkSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMinBatchRowsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  syncDescriptions: boolean;
  onSyncDescriptionsChange: (checked: boolean) => void;
  errors?: Record<string, string[]>;
};

const NumberSetting = ({
  name,
  label,
  hint,
  value,
  bounds,
  onChange,
  error,
}: {
  name: string;
  label: string;
  hint: string;
  value: number | null | undefined;
  bounds: Bounds;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error: string | undefined;
}) => (
  <SettingLine label={label} hint={hint} error={error}>
    <SettingInput numeric invalid={Boolean(error)}>
      <input
        id={name}
        type='number'
        inputMode='numeric'
        value={value ?? ''}
        onChange={onChange}
        min={bounds.min}
        max={bounds.max}
        step={1}
        aria-label={label}
        aria-invalid={Boolean(error)}
        spellCheck={false}
      />
      <span className='input-suffix'>строк</span>
    </SettingInput>
  </SettingLine>
);

/** Пакетная запись и синхронизация описаний (макет: первая `.qbox`). */
export const BatchSettingsSection = ({
  chunkSize,
  chunkSizeBounds,
  minBatchRows,
  minBatchRowsBounds,
  onChunkSizeChange,
  onMinBatchRowsChange,
  syncDescriptions,
  onSyncDescriptionsChange,
  errors = {},
}: BatchSettingsSectionProps) => (
  <SettingsBox>
    <NumberSetting
      name='chunksize'
      label='Размер чанка'
      hint='Строк в одном INSERT'
      value={chunkSize}
      bounds={chunkSizeBounds}
      onChange={onChunkSizeChange}
      error={errors['chunksize']?.join(' ')}
    />
    <NumberSetting
      name='min_batch_rows'
      label='Мин. размер пакета'
      hint='Копить строки перед записью'
      value={minBatchRows}
      bounds={minBatchRowsBounds}
      onChange={onMinBatchRowsChange}
      error={errors['min_batch_rows']?.join(' ')}
    />
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
