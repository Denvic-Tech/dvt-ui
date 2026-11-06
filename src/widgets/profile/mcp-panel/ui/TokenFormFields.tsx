import * as React from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import {
  type DBConnectionRecord,
  useConnections,
} from '@/entities/data/db-connection';
import { useProjects } from '@/entities/project/projects';

import {
  TokenExpiryField,
  TokenFieldRow,
  TokenPickerField,
} from '@/shared/ui/token-form';

import {
  formatResourceSelection,
  type ResourceSelection,
  type TokenAccessForm,
} from '../lib/tokenForm';

import { TokenResourcePicker } from './TokenResourcePicker';

const RESOURCE_POPOVER_HEIGHT = 330;
const ALL_PROJECTS_LABEL = 'Все проекты';
const ALL_CONNECTIONS_LABEL = 'Все подключения';

const chevronIcon = (
  <KeyboardArrowDownRoundedIcon
    sx={{ flexShrink: 0, color: '#6B7385', fontSize: 16 }}
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
        <TokenExpiryField form={form} onChange={onChange} />
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
