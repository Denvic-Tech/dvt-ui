import React from 'react';
import type { ChangeEvent } from 'react';

import {
  InputCard,
  InputCardsRow,
  InputLabel,
  StyledInput,
} from '../index.styles';

type BatchSettingsSectionProps = {
  chunkSize: number | null | undefined;
  chunkSizeBounds: { min: number; max: number };
  minBatchRows: number | null | undefined;
  minBatchRowsBounds: { min: number; max: number };
  onChunkSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMinBatchRowsChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const BatchSettingsSection: React.FC<BatchSettingsSectionProps> = ({
  chunkSize,
  chunkSizeBounds,
  minBatchRows,
  minBatchRowsBounds,
  onChunkSizeChange,
  onMinBatchRowsChange,
}) => {
  return (
    <InputCardsRow>
      <InputCard>
        <InputLabel>Chunk size</InputLabel>
        <StyledInput
          type='number'
          value={chunkSize ?? ''}
          onChange={onChunkSizeChange}
          min={chunkSizeBounds.min}
          max={chunkSizeBounds.max}
          step={1}
        />
      </InputCard>
      <InputCard>
        <InputLabel>Min batch rows</InputLabel>
        <StyledInput
          type='number'
          value={minBatchRows ?? ''}
          onChange={onMinBatchRowsChange}
          min={minBatchRowsBounds.min}
          max={minBatchRowsBounds.max}
          step={1}
        />
      </InputCard>
    </InputCardsRow>
  );
};
