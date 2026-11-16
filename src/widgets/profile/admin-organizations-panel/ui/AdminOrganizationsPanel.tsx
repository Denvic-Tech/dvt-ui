import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Alert } from '@mui/material';
import { IconSearch, IconUsers } from '@tabler/icons-react';
import { z } from 'zod';

import {
  client,
  type OrganizationCreateSchema,
  type OrganizationReadSchema,
  type OrganizationUpdateSchema,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageLayout } from '@/shared/ui/page-layout';
import {
  getTokenListBoxHeight,
  TokenListBox,
  TokenListCreateButton,
  TokenListMessage,
  TokenListScroll,
  TokenListSearch,
} from '@/shared/ui/token-list';

import {
  OrganizationDialog,
  type OrganizationFormErrors,
  type OrganizationFormState,
} from './OrganizationDialog';
import { OrganizationRow, OrganizationRowSkeleton } from './OrganizationRow';
import { AlertSection } from './styles';

const SKELETON_ROWS = [
  { nameWidth: 168 },
  { nameWidth: 132 },
  { nameWidth: 196 },
  { nameWidth: 148 },
  { nameWidth: 120 },
];

const zName = z
  .string()
  .trim()
  .min(1, { message: 'Укажите название организации' })
  .max(255, { message: 'Название не длиннее 255 символов' });

const zInn = z
  .string()
  .trim()
  .max(32, { message: 'ИНН не длиннее 32 символов' });

const emptyForm: OrganizationFormState = {
  name: '',
  description: '',
  inn: '',
};

const getCreatedTime = (organization: OrganizationReadSchema) =>
  organization.created_at ? new Date(organization.created_at).getTime() : 0;

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const validateForm = (form: OrganizationFormState): OrganizationFormErrors => {
  const errors: OrganizationFormErrors = {};

  const nameResult = zName.safeParse(form.name);
  if (!nameResult.success) {
    errors.name =
      nameResult.error.issues[0]?.message ?? 'Укажите название организации';
  }

  const innResult = zInn.safeParse(form.inn);
  if (!innResult.success) {
    errors.inn = innResult.error.issues[0]?.message ?? 'Некорректный ИНН';
  }

  return errors;
};

// The status is changed from the row menu, not in the form.
const buildOrganizationPayload = (
  form: OrganizationFormState
): Omit<OrganizationCreateSchema, 'is_active'> => {
  const description = form.description.trim();
  const inn = form.inn.trim();

  return {
    name: form.name.trim(),
    description: description || null,
    inn: inn || null,
  };
};

export const AdminOrganizationsPanel: React.FC = () => {
  const { confirm } = useConfirmDialog();

  const [organizations, setOrganizations] = React.useState<
    OrganizationReadSchema[]
  >([]);
  // Reloads after actions keep the rows; only the first load shows the
  // skeleton.
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState('');

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] =
    React.useState<OrganizationFormState>(emptyForm);
  const [createErrors, setCreateErrors] =
    React.useState<OrganizationFormErrors>({});
  const [isCreating, setIsCreating] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editOrganization, setEditOrganization] =
    React.useState<OrganizationReadSchema | null>(null);
  const [editForm, setEditForm] = React.useState<OrganizationFormState | null>(
    null
  );
  const [editErrors, setEditErrors] = React.useState<OrganizationFormErrors>(
    {}
  );
  const [updatingOrganizationId, setUpdatingOrganizationId] = React.useState<
    string | null
  >(null);

  const loadOrganizations = React.useCallback(async () => {
    setLoadError(null);

    try {
      const response = await client.organizations.get();
      setOrganizations(response.data);
    } catch (error) {
      setLoadError(
        resolveErrorMessage(error, 'Не удалось загрузить список организаций.')
      );
    } finally {
      setHasLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const handleOpenCreate = () => {
    setActionError(null);
    setCreateErrors({});
    setCreateForm(emptyForm);
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  // Resets after the closing animation, so the fields do not flash empty.
  const handleExitedCreate = () => {
    setCreateErrors({});
    setActionError(null);
    setCreateForm(emptyForm);
  };

  const handleSubmitCreate = async () => {
    const errors = validateForm(createForm);
    setCreateErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsCreating(true);
    setActionError(null);

    try {
      const body: OrganizationCreateSchema = {
        ...buildOrganizationPayload(createForm),
        is_active: true,
      };
      await client.organizations.post({ body });
      await loadOrganizations();
      handleCloseCreate();
    } catch (error) {
      setActionError(
        resolveErrorMessage(error, 'Не удалось создать организацию.')
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (organization: OrganizationReadSchema) => {
    setActionError(null);
    setEditErrors({});
    setEditOrganization(organization);
    setEditForm({
      name: organization.name ?? '',
      description: organization.description ?? '',
      inn: organization.inn ?? '',
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const handleExitedEdit = () => {
    setEditOrganization(null);
    setEditForm(null);
    setEditErrors({});
    setActionError(null);
  };

  const handleSubmitEdit = async () => {
    if (!editOrganization?.id || editForm == null) {
      return;
    }

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setUpdatingOrganizationId(editOrganization.id);
    setActionError(null);

    const payload: OrganizationUpdateSchema = {
      ...buildOrganizationPayload(editForm),
    };

    try {
      await client.organizations.organizationId(editOrganization.id).patch({
        body: payload,
      });
      await loadOrganizations();
      handleCloseEdit();
    } catch (error) {
      setActionError(
        resolveErrorMessage(error, 'Не удалось обновить организацию.')
      );
    } finally {
      setUpdatingOrganizationId(null);
    }
  };

  const handleToggleActive = async (organization: OrganizationReadSchema) => {
    if (!organization.id) {
      return;
    }

    const currentActive = organization.is_active ?? true;
    const nextActive = !currentActive;

    const approved = await confirm({
      title: nextActive
        ? 'Активировать организацию'
        : 'Деактивировать организацию',
      message: nextActive
        ? `Активировать организацию ${organization.name}?`
        : `Деактивировать организацию ${organization.name}?`,
      confirmLabel: nextActive ? 'Активировать' : 'Деактивировать',
      confirmColor: nextActive ? 'primary' : 'error',
    });

    if (!approved) {
      return;
    }

    setUpdatingOrganizationId(organization.id);
    setActionError(null);

    try {
      await client.organizations.organizationId(organization.id).patch({
        body: { is_active: nextActive },
      });
      await loadOrganizations();
    } catch (error) {
      setActionError(
        resolveErrorMessage(error, 'Не удалось изменить статус организации.')
      );
    } finally {
      setUpdatingOrganizationId(null);
    }
  };

  const filteredOrganizations = React.useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    if (!normalizedSearch) {
      return organizations;
    }

    return organizations.filter(organization => {
      const name = organization.name.toLowerCase();
      const inn = organization.inn?.toLowerCase() ?? '';
      const description = organization.description?.toLowerCase() ?? '';

      return (
        name.includes(normalizedSearch) ||
        inn.includes(normalizedSearch) ||
        description.includes(normalizedSearch)
      );
    });
  }, [organizations, searchInput]);

  // Newest first.
  const sortedOrganizations = React.useMemo(
    () =>
      [...filteredOrganizations].sort(
        (left, right) => getCreatedTime(right) - getCreatedTime(left)
      ),
    [filteredOrganizations]
  );

  const isUpdating = (organizationId?: string | null) =>
    organizationId != null && updatingOrganizationId === organizationId;

  const isLoadingList = !hasLoaded;
  const showSkeleton = useDelayedLoading(isLoadingList);
  const rowsCount = sortedOrganizations.length;
  const hasSearch = searchInput.trim().length > 0;

  return (
    <>
      <PageLayout
        width='default'
        title='Organizations'
        icon={IconUsers}
        headerActions={
          <>
            <TokenListSearch
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder='Поиск по названию или ИНН'
              inputProps={{ 'aria-label': 'Поиск организаций' }}
              startAdornment={<IconSearch size={14} stroke={1.6} />}
              sx={{ width: 240 }}
            />
            <TokenListCreateButton disableRipple onClick={handleOpenCreate}>
              <AddRoundedIcon sx={{ fontSize: 16 }} />
              Новая организация
            </TokenListCreateButton>
          </>
        }
        fitContent
      >
        {loadError ? (
          <AlertSection>
            <Alert severity='error'>{loadError}</Alert>
          </AlertSection>
        ) : null}

        {/* A dialog shows its own request error. */}
        {actionError && !createOpen && !editOpen ? (
          <AlertSection>
            <Alert severity='error'>{actionError}</Alert>
          </AlertSection>
        ) : null}

        <TokenListBox
          aria-label='Организации'
          sx={{ flex: `0 1 ${getTokenListBoxHeight(rowsCount)}px` }}
        >
          <TokenListScroll sx={{ flex: 1 }}>
            {showSkeleton ? (
              SKELETON_ROWS.map(row => (
                <OrganizationRowSkeleton
                  key={row.nameWidth}
                  nameWidth={row.nameWidth}
                />
              ))
            ) : isLoadingList ? null : rowsCount === 0 ? (
              <TokenListMessage>
                {hasSearch ? 'Ничего не найдено' : 'Организации не найдены.'}
              </TokenListMessage>
            ) : (
              sortedOrganizations.map(organization => (
                <OrganizationRow
                  key={organization.id ?? organization.name}
                  organization={organization}
                  isUpdating={isUpdating(organization.id)}
                  onEdit={handleOpenEdit}
                  onToggleActive={item => void handleToggleActive(item)}
                />
              ))
            )}
          </TokenListScroll>
        </TokenListBox>
      </PageLayout>

      <OrganizationDialog
        open={createOpen}
        mode='create'
        form={createForm}
        errors={createErrors}
        error={createOpen ? actionError : null}
        isSaving={isCreating}
        onChange={setCreateForm}
        onSubmit={() => void handleSubmitCreate()}
        onClose={handleCloseCreate}
        onExited={handleExitedCreate}
      />

      {editForm ? (
        <OrganizationDialog
          open={editOpen}
          mode='edit'
          organizationName={editOrganization?.name}
          form={editForm}
          errors={editErrors}
          error={editOpen ? actionError : null}
          isSaving={updatingOrganizationId != null}
          onChange={setEditForm}
          onSubmit={() => void handleSubmitEdit()}
          onClose={handleCloseEdit}
          onExited={handleExitedEdit}
        />
      ) : null}
    </>
  );
};
