import React, { useCallback, useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  FormHelperText,
  Portal,
  Tooltip,
  Typography,
} from '@mui/material';

import { MODE_OPTIONS } from '../model/constants';
import {
  ColumnBaseType,
  PartitionGrouping,
  PartitionGroupingMode,
} from '../model/types';

import {
  ClearButton,
  DropdownPortal,
  GroupingContainer,
  HelperText,
  ModeInfoBlock,
  ModeInfoDescription,
  ModeInfoExample,
  ModeOption,
  ModeSelectActions,
  ModeSelectContainer,
  ModeSelectTrigger,
  ModeSelectValue,
  ParameterInput,
  ParameterLabel,
  ParameterRow,
  ParametersGrid,
  PlaceholderText,
  SelectChevron,
} from './styles';

interface PartitionGroupingInputProps {
  value: PartitionGrouping | null | undefined;
  onChange: (value: PartitionGrouping | null) => void;
  columnType?: ColumnBaseType;
  disabled?: boolean;
  error?: boolean;
  fieldErrors?: Record<string, string> | undefined;
}

export const PartitionGroupingInput: React.FC<PartitionGroupingInputProps> = ({
  value,
  onChange,
  columnType = 'UNKNOWN',
  disabled = false,
  error = false,
  fieldErrors,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number | undefined;
    bottom?: number | undefined;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    left: 0,
    width: 0,
    placement: 'bottom',
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter modes based on column type
  const availableModes =
    columnType === 'UNKNOWN'
      ? MODE_OPTIONS
      : MODE_OPTIONS.filter(opt => opt.compatibleTypes.includes(columnType));

  const selectedMode = value?.mode;
  const selectedModeInfo = availableModes.find(
    opt => opt.value === selectedMode
  );
  const selectedModeLabel = selectedModeInfo?.label || 'Не выбрано';
  const hasFieldErrors = Boolean(
    fieldErrors && Object.keys(fieldErrors).length > 0
  );
  const modeHasError = error || hasFieldErrors;
  const getJsonInputValue = (fieldValue: unknown, fallback: unknown) => {
    if (typeof fieldValue === 'string') return fieldValue;
    if (fieldValue === undefined || fieldValue === null) {
      return JSON.stringify(fallback);
    }
    return JSON.stringify(fieldValue);
  };

  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const MAX_DROPDOWN_HEIGHT = 280;
      const GAP = 4;

      const spaceBelow = viewportHeight - rect.bottom;
      const shouldOpenUp =
        spaceBelow < MAX_DROPDOWN_HEIGHT && rect.top > spaceBelow;

      setDropdownPosition({
        top: shouldOpenUp ? undefined : rect.bottom + GAP,
        bottom: shouldOpenUp ? viewportHeight - rect.top + GAP : undefined,
        left: rect.left,
        width: rect.width,
        placement: shouldOpenUp ? 'top' : 'bottom',
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) updateDropdownPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateDropdownPosition]);

  const handleOpen = () => {
    if (!disabled) {
      updateDropdownPosition();
      setIsOpen(!isOpen);
    }
  };

  const handleModeSelect = (mode: PartitionGroupingMode) => {
    // Initialize with only required parameters based on mode
    const newValue: PartitionGrouping = { mode };

    switch (mode) {
      case 'range':
        // No required parameters
        break;
      case 'prefix':
        newValue['length'] = 2;
        break;
      case 'explicit_values':
        // values is required, initialize as empty array
        newValue['values'] = [];
        break;
      case 'quantiles':
        // k is required
        newValue['k'] = 4;
        break;
      case 'percentiles':
        // percentiles is required
        newValue['percentiles'] = [0.1, 0.5, 0.9];
        break;
      case 'hash':
        // buckets is optional
        break;
      case 'ranges':
        // ranges is required
        newValue['ranges'] = [];
        break;
      case 'step':
        // All parameters are optional for step mode
        break;
      case 'granularity':
        // granularity is required, default to 'day'
        newValue['granularity'] = 'day';
        break;
      case 'as_is':
        // No parameters
        break;
    }

    onChange(newValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleParameterChange = (key: string, newValue: string) => {
    if (!value) return;

    // If value is empty, remove the parameter (for optional fields)
    if (newValue === '' || newValue === undefined) {
      const updated = { ...value };
      delete updated[key];
      onChange(updated);
      return;
    }

    let parsedValue: string | number | boolean | string[] | number[][] =
      newValue;

    // Parse based on key and mode
    if (
      key === 'length' ||
      key === 'max_groups' ||
      key === 'buckets' ||
      key === 'mod' ||
      key === 'k' ||
      key === 'bins'
    ) {
      const num = parseInt(newValue, 10);
      if (isNaN(num)) {
        // If not a valid number, remove the parameter
        const updated = { ...value };
        delete updated[key];
        onChange(updated);
        return;
      }
      parsedValue = num;
    } else if (key === 'lower' || key === 'other') {
      parsedValue = newValue === 'true';
    } else if (key === 'start' || key === 'step') {
      // For start, allow string (date) or number
      if (key === 'start' && isNaN(parseFloat(newValue))) {
        parsedValue = newValue; // Keep as string (date)
      } else {
        const num = parseFloat(newValue);
        if (isNaN(num)) {
          const updated = { ...value };
          delete updated[key];
          onChange(updated);
          return;
        }
        parsedValue = num;
      }
    } else if (
      key === 'quantiles' ||
      key === 'percentiles' ||
      key === 'values'
    ) {
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
    } else if (key === 'ranges') {
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
    }

    onChange({
      ...value,
      [key]: parsedValue,
    });
  };

  const renderParameters = () => {
    if (!value || !value.mode) return null;

    const mode = value.mode;

    switch (mode) {
      case 'range':
        return (
          <Box sx={{ py: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              No additional parameters required. Engine will apply range-based
              grouping automatically.
            </Typography>
          </Box>
        );

      case 'prefix':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Length</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['length'] ?? ''}
                onChange={e => handleParameterChange('length', e.target.value)}
                placeholder='2'
                hasError={!!fieldErrors?.['length']}
              />
              <HelperText>Prefix length in characters</HelperText>
              {fieldErrors?.['length'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['length']}
                </FormHelperText>
              )}
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Lower (optional)</ParameterLabel>
              <ParameterInput
                as='select'
                value={
                  value['lower'] !== undefined ? String(value['lower']) : ''
                }
                onChange={e => handleParameterChange('lower', e.target.value)}
              >
                <option value=''>Default (true)</option>
                <option value='true'>True</option>
                <option value='false'>False</option>
              </ParameterInput>
              <HelperText>Convert to lowercase (default: true)</HelperText>
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Max Groups (optional)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['max_groups'] ?? ''}
                onChange={e =>
                  handleParameterChange('max_groups', e.target.value)
                }
                placeholder='200'
              />
              <HelperText>Maximum number of groups (default: 200)</HelperText>
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Other (optional)</ParameterLabel>
              <ParameterInput
                as='select'
                value={
                  value['other'] !== undefined ? String(value['other']) : ''
                }
                onChange={e => handleParameterChange('other', e.target.value)}
              >
                <option value=''>Default (false)</option>
                <option value='true'>True</option>
                <option value='false'>False</option>
              </ParameterInput>
              <HelperText>
                Include __other__ segment for unmatched prefixes
              </HelperText>
            </ParameterRow>
          </ParametersGrid>
        );

      case 'explicit_values':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Values (JSON array) *</ParameterLabel>
              <ParameterInput
                value={getJsonInputValue(value['values'], [])}
                onChange={e => handleParameterChange('values', e.target.value)}
                placeholder='["value1", "value2"]'
                hasError={!!fieldErrors?.['values']}
              />
              <HelperText>Array of explicit values (required)</HelperText>
              {fieldErrors?.['values'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['values']}
                </FormHelperText>
              )}
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Other (optional)</ParameterLabel>
              <ParameterInput
                as='select'
                value={
                  value['other'] !== undefined ? String(value['other']) : ''
                }
                onChange={e => handleParameterChange('other', e.target.value)}
              >
                <option value=''>Default (false)</option>
                <option value='true'>True</option>
                <option value='false'>False</option>
              </ParameterInput>
              <HelperText>
                Include __other__ segment (default: false)
              </HelperText>
            </ParameterRow>
          </ParametersGrid>
        );

      case 'quantiles':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>K (required)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['k'] ?? 4}
                onChange={e => handleParameterChange('k', e.target.value)}
                placeholder='4'
                hasError={!!fieldErrors?.['k']}
              />
              <HelperText>
                Number of quantile groups (e.g. 4 = quartiles)
              </HelperText>
              {fieldErrors?.['k'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['k']}
                </FormHelperText>
              )}
            </ParameterRow>
          </ParametersGrid>
        );

      case 'percentiles':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Percentiles (JSON array) *</ParameterLabel>
              <ParameterInput
                value={getJsonInputValue(value['percentiles'], [0.1, 0.5, 0.9])}
                onChange={e =>
                  handleParameterChange('percentiles', e.target.value)
                }
                placeholder='[0.1, 0.5, 0.9]'
                hasError={!!fieldErrors?.['percentiles']}
              />
              <HelperText>Values from 0 to 1 (exclusive), required</HelperText>
              {fieldErrors?.['percentiles'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['percentiles']}
                </FormHelperText>
              )}
            </ParameterRow>
          </ParametersGrid>
        );

      case 'hash':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Buckets (optional)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['buckets'] ?? ''}
                onChange={e => handleParameterChange('buckets', e.target.value)}
                placeholder='32'
              />
              <HelperText>Number of hash buckets (default: 32)</HelperText>
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Mod (optional)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['mod'] ?? ''}
                onChange={e => handleParameterChange('mod', e.target.value)}
                placeholder='64'
              />
              <HelperText>
                Alias for bucket count, can be used instead of buckets
              </HelperText>
            </ParameterRow>
          </ParametersGrid>
        );

      case 'ranges':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Ranges (JSON array) *</ParameterLabel>
              <ParameterInput
                value={getJsonInputValue(value['ranges'], [])}
                onChange={e => handleParameterChange('ranges', e.target.value)}
                placeholder='[[0, 10], [10, 100]]'
                hasError={!!fieldErrors?.['ranges']}
              />
              <HelperText>
                Array of [start, end] or [start, end, inclusive] (required)
              </HelperText>
              {fieldErrors?.['ranges'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['ranges']}
                </FormHelperText>
              )}
            </ParameterRow>
          </ParametersGrid>
        );

      case 'step':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Start (optional)</ParameterLabel>
              <ParameterInput
                type='text'
                value={value['start'] ?? ''}
                onChange={e => handleParameterChange('start', e.target.value)}
                placeholder='0 or "2024-01-01"'
              />
              <HelperText>Start value - number or date (optional)</HelperText>
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Step (optional)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['step'] ?? ''}
                onChange={e => handleParameterChange('step', e.target.value)}
                placeholder='1'
              />
              <HelperText>
                Step size - for datetime: seconds; for date: days (optional)
              </HelperText>
            </ParameterRow>
            <ParameterRow>
              <ParameterLabel>Bins (optional)</ParameterLabel>
              <ParameterInput
                type='number'
                value={value['bins'] ?? ''}
                onChange={e => handleParameterChange('bins', e.target.value)}
                placeholder='10'
              />
              <HelperText>Number of intervals (optional)</HelperText>
            </ParameterRow>
          </ParametersGrid>
        );

      case 'granularity':
        return (
          <ParametersGrid>
            <ParameterRow>
              <ParameterLabel>Granularity *</ParameterLabel>
              <ParameterInput
                as='select'
                value={value['granularity'] ?? 'day'}
                onChange={e =>
                  handleParameterChange('granularity', e.target.value)
                }
                hasError={!!fieldErrors?.['granularity']}
              >
                <option value='hour'>Hour</option>
                <option value='day'>Day</option>
                <option value='week'>Week</option>
                <option value='month'>Month</option>
                <option value='year'>Year</option>
              </ParameterInput>
              <HelperText>Calendar granularity level (required)</HelperText>
              {fieldErrors?.['granularity'] && (
                <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                  {fieldErrors['granularity']}
                </FormHelperText>
              )}
            </ParameterRow>
          </ParametersGrid>
        );

      case 'as_is':
        return (
          <Box sx={{ py: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              No additional parameters required. Segments: true, false, null
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <GroupingContainer>
      <ModeSelectContainer ref={containerRef}>
        <ModeSelectTrigger
          ref={triggerRef}
          hasValue={!!selectedMode}
          hasError={modeHasError}
          disabled={disabled}
          onClick={handleOpen}
        >
          <ModeSelectValue>
            {selectedMode ? (
              <Typography sx={{ fontSize: '0.8125rem' }}>
                {selectedModeLabel}
              </Typography>
            ) : (
              <PlaceholderText>Выберите режим группировки...</PlaceholderText>
            )}
          </ModeSelectValue>

          <ModeSelectActions>
            {selectedMode && !disabled && (
              <ClearButton onClick={handleClear}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </ClearButton>
            )}
            <SelectChevron isOpen={isOpen} />
          </ModeSelectActions>
        </ModeSelectTrigger>

        {isOpen && !disabled && (
          <Portal>
            <DropdownPortal
              ref={dropdownRef}
              style={{
                top: dropdownPosition.top,
                bottom: dropdownPosition.bottom,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                transformOrigin:
                  dropdownPosition.placement === 'top'
                    ? 'bottom center'
                    : 'top center',
              }}
            >
              {availableModes.map(option => (
                <Tooltip
                  key={option.value}
                  title={option.description}
                  placement='right'
                  arrow
                  enterDelay={300}
                >
                  <ModeOption
                    type='button'
                    isSelected={option.value === selectedMode}
                    onClick={() => handleModeSelect(option.value)}
                  >
                    {option.label}
                  </ModeOption>
                </Tooltip>
              ))}
            </DropdownPortal>
          </Portal>
        )}
      </ModeSelectContainer>

      {/* Mode Description */}
      {selectedModeInfo && (
        <ModeInfoBlock>
          <ModeInfoDescription>
            {selectedModeInfo.description}
          </ModeInfoDescription>
          <ModeInfoExample>Пример: {selectedModeInfo.example}</ModeInfoExample>
        </ModeInfoBlock>
      )}

      {renderParameters()}
    </GroupingContainer>
  );
};
