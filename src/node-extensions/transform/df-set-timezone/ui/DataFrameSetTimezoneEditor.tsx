import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Box, Collapse, Portal, Stack, Typography } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel } from '@/shared/ui';

import {
  ClearButton,
  CustomSelectActions,
  CustomSelectContainer,
  CustomSelectOption,
  CustomSelectTrigger,
  CustomSelectValue,
  DropdownPortal,
  EmptyState,
  OffsetBadge,
  OptionName,
  OptionsList,
  PlaceholderText,
  SearchContainer,
  SearchInput,
  SearchInputWrapper,
  SelectChevron,
} from './styles';

interface SetTimezoneValues {
  column?: string;
  timezone?: string;
}

type TimezoneOption = {
  value: string;
  name: string;
  offsetMinutes: number;
  offsetLabel: string;
};

const formatUtcOffset = (offsetMinutes: number) => {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const minutesPart = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
  return `UTC${sign}${hours}${minutesPart}`;
};

const getOffsetMinutes = (timeZone: string, date: Date) => {
  try {
    const locale = 'en-US';
    const tzDate = new Date(date.toLocaleString(locale, { timeZone }));
    const utcDate = new Date(date.toLocaleString(locale, { timeZone: 'UTC' }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 0;
  }
};

const buildTimezoneOptions = () => {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    }
  ).supportedValuesOf;
  let zones: string[] = [];
  try {
    if (typeof supportedValuesOf === 'function') {
      zones = supportedValuesOf('timeZone');
    }
  } catch {
    zones = [];
  }

  if (!zones.length) {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
    zones = fallback ? [fallback] : ['UTC'];
  }

  const now = new Date();
  return zones.map(zone => {
    const offsetMinutes = getOffsetMinutes(zone, now);
    const offsetLabel = formatUtcOffset(offsetMinutes);
    return {
      value: zone,
      name: zone,
      offsetMinutes,
      offsetLabel,
    };
  });
};

const isDateColumn = (dtype: unknown) => {
  const normalized = String(dtype ?? '').toUpperCase();
  return normalized.includes('DATE');
};

export const SetTimezoneToDataFrameEditor: React.FC<
  NodeModalExtensionProps<SetTimezoneValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  const dataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  const dateColumns = useMemo(
    () => columns.filter(col => isDateColumn(col.dtype)),
    [columns]
  );

  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [timezoneDropdownPosition, setTimezoneDropdownPosition] = useState<{
    top?: number | undefined;
    bottom?: number | undefined;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    top: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
  });

  const timezoneContainerRef = useRef<HTMLDivElement>(null);
  const timezoneTriggerRef = useRef<HTMLButtonElement>(null);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const timezoneSearchInputRef = useRef<HTMLInputElement>(null);

  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    const options = buildTimezoneOptions();
    if (
      localValues.timezone &&
      !options.some(option => option.value === localValues.timezone)
    ) {
      options.unshift({
        value: localValues.timezone,
        name: localValues.timezone,
        offsetMinutes: 0,
        offsetLabel: formatUtcOffset(0),
      });
    }
    return options;
  }, [localValues.timezone]);

  const selectedTimezone = useMemo(() => {
    if (!localValues.timezone) return null;
    return (
      timezoneOptions.find(option => option.value === localValues.timezone) ??
      null
    );
  }, [localValues.timezone, timezoneOptions]);

  const filteredTimezones = useMemo(() => {
    const query = timezoneSearch.trim().toLowerCase();
    if (!query) return timezoneOptions;
    return timezoneOptions.filter(
      option =>
        option.name.toLowerCase().includes(query) ||
        option.offsetLabel.toLowerCase().includes(query)
    );
  }, [timezoneOptions, timezoneSearch]);

  const validate = useCallback(() => {
    const nextErrors: string[] = [];

    if (!localValues.column) {
      nextErrors.push('Select a date column.');
    }

    if (!localValues.timezone) {
      nextErrors.push('Select a time zone.');
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  }, [localValues.column, localValues.timezone]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  const handleColumnChange = useCallback(
    (value: string) => {
      const nextColumn = value ?? '';
      setLocalValues(prev => ({ ...prev, column: nextColumn }));
      if (errors.length) setErrors([]);
    },
    [setLocalValues, errors.length]
  );

  const handleTimezoneChange = useCallback(
    (value: string) => {
      setLocalValues(prev => ({ ...prev, timezone: value }));
      if (errors.length) setErrors([]);
    },
    [setLocalValues, errors.length]
  );

  const updateTimezoneDropdownPosition = useCallback(() => {
    if (timezoneTriggerRef.current) {
      const rect = timezoneTriggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const MAX_DROPDOWN_HEIGHT = 280;
      const GAP = 4;
      const spaceBelow = viewportHeight - rect.bottom;
      const shouldOpenUp =
        spaceBelow < MAX_DROPDOWN_HEIGHT && rect.top > spaceBelow;

      setTimezoneDropdownPosition({
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
        timezoneContainerRef.current &&
        !timezoneContainerRef.current.contains(target) &&
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(target)
      ) {
        setTimezoneDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      if (timezoneDropdownOpen) updateTimezoneDropdownPosition();
    };

    const handleResize = () => {
      if (timezoneDropdownOpen) updateTimezoneDropdownPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [timezoneDropdownOpen, updateTimezoneDropdownPosition]);

  useEffect(() => {
    if (timezoneDropdownOpen) {
      requestAnimationFrame(() => {
        timezoneSearchInputRef.current?.focus();
      });
    } else if (timezoneSearch) {
      setTimezoneSearch('');
    }
  }, [timezoneDropdownOpen, timezoneSearch]);

  if (!dataframeMetadata) {
    return (
      <Alert severity='info' sx={{ m: 1 }}>
        Connect a DataFrame input to configure the timezone.
      </Alert>
    );
  }

  const columnMissing = errors.length > 0 && !localValues.column;
  const timezoneMissing = errors.length > 0 && !localValues.timezone;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0.5 }}>
      <Collapse in={errors.length > 0}>
        <Alert severity='error' sx={{ mb: 1 }}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      </Collapse>

      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Column
        </Typography>
        <Panel
          sx={{
            mt: 1,
            p: 2.5,
            borderLeft: '4px solid',
            borderColor: 'primary.main',
          }}
        >
          <Stack spacing={1.5}>
            <ColumnDropdownSelect
              value={localValues.column || ''}
              columns={dateColumns}
              onChange={handleColumnChange}
              placeholder='Select a date column...'
              disabled={dateColumns.length === 0}
              error={columnMissing}
            />
            {dateColumns.length === 0 && (
              <Typography variant='caption' color='text.secondary'>
                No date columns available.
              </Typography>
            )}
          </Stack>
        </Panel>
      </Box>

      <Box>
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 700, ml: 1 }}
        >
          Time zone
        </Typography>
        <Panel sx={{ mt: 1, p: 2.5 }}>
          <CustomSelectContainer ref={timezoneContainerRef}>
            <CustomSelectTrigger
              ref={timezoneTriggerRef}
              type='button'
              hasValue={!!localValues.timezone}
              hasError={timezoneMissing}
              onClick={() => {
                updateTimezoneDropdownPosition();
                setTimezoneDropdownOpen(prev => !prev);
              }}
            >
              <CustomSelectValue>
                {selectedTimezone ? (
                  <>
                    <OptionName sx={{ flex: 1 }}>
                      {selectedTimezone.name}
                    </OptionName>
                    <OffsetBadge>{selectedTimezone.offsetLabel}</OffsetBadge>
                  </>
                ) : (
                  <PlaceholderText>Select a time zone...</PlaceholderText>
                )}
              </CustomSelectValue>

              <CustomSelectActions>
                {!!localValues.timezone && (
                  <ClearButton
                    type='button'
                    onClick={event => {
                      event.stopPropagation();
                      handleTimezoneChange('');
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </ClearButton>
                )}
                <SelectChevron isOpen={timezoneDropdownOpen} />
              </CustomSelectActions>
            </CustomSelectTrigger>

            {timezoneDropdownOpen && (
              <Portal>
                <DropdownPortal
                  ref={timezoneDropdownRef}
                  style={{
                    top: timezoneDropdownPosition.top,
                    bottom: timezoneDropdownPosition.bottom,
                    left: timezoneDropdownPosition.left,
                    width: timezoneDropdownPosition.width,
                    transformOrigin:
                      timezoneDropdownPosition.placement === 'top'
                        ? 'bottom center'
                        : 'top center',
                  }}
                >
                  <SearchContainer>
                    <SearchInputWrapper>
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                      <SearchInput
                        ref={timezoneSearchInputRef}
                        type='text'
                        placeholder='Search time zones...'
                        value={timezoneSearch}
                        onChange={event =>
                          setTimezoneSearch(event.target.value)
                        }
                      />
                    </SearchInputWrapper>
                  </SearchContainer>
                  <OptionsList>
                    {filteredTimezones.map(option => {
                      const isSelected = option.value === localValues.timezone;
                      return (
                        <CustomSelectOption
                          key={option.value}
                          type='button'
                          isSelected={isSelected}
                          onClick={() => {
                            handleTimezoneChange(option.value);
                            setTimezoneDropdownOpen(false);
                          }}
                        >
                          <OptionName>{option.name}</OptionName>
                          <OffsetBadge>{option.offsetLabel}</OffsetBadge>
                        </CustomSelectOption>
                      );
                    })}
                    {filteredTimezones.length === 0 && (
                      <EmptyState>
                        {timezoneSearch
                          ? 'No time zones found'
                          : 'No time zones available'}
                      </EmptyState>
                    )}
                  </OptionsList>
                </DropdownPortal>
              </Portal>
            )}
          </CustomSelectContainer>
        </Panel>
      </Box>
    </Box>
  );
};
