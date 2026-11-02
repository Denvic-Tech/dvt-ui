import * as React from 'react';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Box, InputBase, Typography } from '@mui/material';

import {
  type DBConnectionRecord,
  useConnections,
} from '@/entities/data/db-connection';
import { useProjects } from '@/entities/project/projects';

import {
  formatResourceSelection,
  formatTokenExpiry,
  type ResourceSelection,
  type TokenAccessForm,
} from '../lib/tokenForm';

import { fieldInputSx } from './styles';
import { TokenExpiryCalendar } from './TokenExpiryCalendar';
import { TokenPickerField } from './TokenPickerField';
import { TokenResourcePicker } from './TokenResourcePicker';

const EXPIRY_POPOVER_HEIGHT = 400;
const RESOURCE_POPOVER_HEIGHT = 330;
const ALL_PROJECTS_LABEL = 'Все проекты';
const ALL_CONNECTIONS_LABEL = 'Все подключения';

const fieldIconSx = { flexShrink: 0, color: '#6B7385' };
const chevronIcon = (
  <KeyboardArrowDownRoundedIcon sx={{ ...fieldIconSx, fontSize: 16 }} />
);
const calendarIcon = (
  <CalendarTodayOutlinedIcon sx={{ ...fieldIconSx, fontSize: 15 }} />
);

type TokenFieldRowProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
};

export const TokenFieldRow = ({
  label,
  htmlFor,
  children,
}: TokenFieldRowProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '116px minmax(0, 1fr)',
      alignItems: 'start',
      columnGap: 2,
    }}
  >
    <Typography
      component={htmlFor ? 'label' : 'span'}
      {...(htmlFor ? { htmlFor } : {})}
      sx={{ color: '#4A5161', fontSize: 13, lineHeight: '38px' }}
    >
      {label}
    </Typography>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

type TokenNameInputProps = {
  id: string;
  value: string;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
};

export const TokenNameInput = ({
  id,
  value,
  placeholder,
  autoFocus = false,
  onChange,
}: TokenNameInputProps) => (
  <InputBase
    id={id}
    value={value}
    placeholder={placeholder}
    autoFocus={autoFocus}
    onChange={event => onChange(event.target.value)}
    inputProps={{ maxLength: 255 }}
    sx={fieldInputSx}
  />
);

type TokenAccessFieldsProps = {
  form: TokenAccessForm;
  onChange: (form: TokenAccessForm) => void;
};

export const TokenAccessFields = ({
  form,
  onChange,
}: TokenAccessFieldsProps) => {
  const { projects, loading: projectsLoading, loadProjects } = useProjects();
  const {
    connections,
    loading: connectionsLoading,
    fetchConnections,
  } = useConnections();

  const projectOptions = React.useMemo(
    () =>
      (projects ?? []).map(project => ({
        value: project.id,
        label: project.name || project.id,
      })),
    [projects]
  );
  const connectionOptions = React.useMemo(
    () =>
      connections.map((connection: DBConnectionRecord) => ({
        value: connection.id,
        label: `${connection.name} (${connection.type})`,
      })),
    [connections]
  );

  const projectSelection: ResourceSelection = {
    mode: form.projectsMode,
    ids: form.projectIds,
  };
  const connectionSelection: ResourceSelection = {
    mode: form.connectionsMode,
    ids: form.connectionIds,
  };

  return (
    <>
      <TokenFieldRow label='Срок'>
        <TokenPickerField
          label='Срок'
          value={formatTokenExpiry(form)}
          icon={calendarIcon}
          estimatedHeight={EXPIRY_POPOVER_HEIGHT}
        >
          {close => (
            <TokenExpiryCalendar
              form={form}
              onChange={onChange}
              onClose={close}
            />
          )}
        </TokenPickerField>
      </TokenFieldRow>

      <TokenFieldRow label='Проекты'>
        <TokenPickerField
          label='Проекты'
          value={formatResourceSelection(
            projectSelection,
            projectOptions,
            ALL_PROJECTS_LABEL
          )}
          icon={chevronIcon}
          estimatedHeight={RESOURCE_POPOVER_HEIGHT}
          onOpen={() => {
            if (projects === null) {
              void loadProjects();
            }
          }}
        >
          {() => (
            <TokenResourcePicker
              allLabel={ALL_PROJECTS_LABEL}
              searchPlaceholder='Найти проект'
              options={projectOptions}
              loading={projectsLoading}
              selection={projectSelection}
              onChange={({ mode, ids }) =>
                onChange({ ...form, projectsMode: mode, projectIds: ids })
              }
            />
          )}
        </TokenPickerField>
      </TokenFieldRow>

      <TokenFieldRow label='Подключения'>
        <TokenPickerField
          label='Подключения'
          value={formatResourceSelection(
            connectionSelection,
            connectionOptions,
            ALL_CONNECTIONS_LABEL
          )}
          icon={chevronIcon}
          estimatedHeight={RESOURCE_POPOVER_HEIGHT}
          onOpen={() => {
            if (connections.length === 0) {
              void fetchConnections();
            }
          }}
        >
          {() => (
            <TokenResourcePicker
              allLabel={ALL_CONNECTIONS_LABEL}
              searchPlaceholder='Найти подключение'
              options={connectionOptions}
              loading={connectionsLoading}
              selection={connectionSelection}
              onChange={({ mode, ids }) =>
                onChange({
                  ...form,
                  connectionsMode: mode,
                  connectionIds: ids,
                })
              }
            />
          )}
        </TokenPickerField>
      </TokenFieldRow>
    </>
  );
};
