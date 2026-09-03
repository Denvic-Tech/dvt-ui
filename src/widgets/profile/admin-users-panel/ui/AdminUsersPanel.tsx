import * as React from 'react';
import { Alert } from '@mui/material';

import { normalizeRole } from '@/entities/user';
import { useAdmin } from '@/entities/admin/admin';
import { useOrganizations } from '@/entities/admin/organizations';
import type { AdminUserReadSchema } from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  buildCreateUserPayload,
  buildEditUserPayload,
  emptyCreateForm,
  getInitialEditForm,
  getNextSortState,
  pinCurrentUserToTop,
  sortUsers,
  validateCreateForm,
  validateEditForm,
} from '../model/helpers';
import type {
  AdminUsersPanelProps,
  CreateEditFormErrors,
  CreateFormState,
  EditFormState,
  SortDir,
  SortKey,
} from '../model/types';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { PanelHeader } from './PanelHeader';
import {
  AlertSection,
  PaginationButton,
  PaginationButtons,
  PaginationInfo,
  PaginationSection,
  PanelContainer,
} from './styles';
import { UsersTable } from './UsersTable';
import { UsersToolbar } from './UsersToolbar';

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  currentUser,
}) => {
  const {
    users,
    usersLoading,
    usersError,
    createUser,
    updateUser,
    isCreating,
    isUpdating,
    updatingUserId,
    loadUsers,
    resetCreateState,
    resetUpdateState,
  } = useAdmin();
  const {
    organizations,
    organizationsError,
    organizationsLoading,
    loadOrganizations,
  } = useOrganizations();
  const { confirm } = useConfirmDialog();

  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(30);

  const [createForm, setCreateForm] =
    React.useState<CreateFormState>(emptyCreateForm);
  const [createErrors, setCreateErrors] = React.useState<CreateEditFormErrors>(
    {}
  );
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const [editUser, setEditUser] = React.useState<AdminUserReadSchema | null>(
    null
  );
  const [editForm, setEditForm] = React.useState<EditFormState | null>(null);
  const [editErrors, setEditErrors] = React.useState<CreateEditFormErrors>({});
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const [searchInput, setSearchInput] = React.useState('');
  const [emailSearch, setEmailSearch] = React.useState<string | undefined>(
    undefined
  );

  const [sortBy, setSortBy] = React.useState<SortKey>('signed_up_at');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  React.useEffect(() => {
    loadUsers(page, limit, emailSearch).catch(() => {});
  }, [page, limit, emailSearch, loadUsers]);

  React.useEffect(() => {
    loadOrganizations().catch(() => {});
  }, [loadOrganizations]);

  const handleRefresh = () => {
    loadUsers(page, limit, emailSearch).catch(() => {});
  };

  const handleOpenCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateErrors({});
    resetCreateState();
    setCreateDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateDialogOpen(false);
    resetCreateState();
  };

  const handleExitedCreate = () => {
    setCreateErrors({});
    setCreateForm(emptyCreateForm);
    resetCreateState();
  };

  const handleChangeCreateField = React.useCallback(
    <Key extends keyof CreateFormState>(
      field: Key,
      value: CreateFormState[Key]
    ) => {
      setCreateForm(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmitCreate = async () => {
    const errors = validateCreateForm(createForm);
    setCreateErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await createUser(buildCreateUserPayload(createForm));
    await loadUsers(page, limit, emailSearch);
    handleCloseCreate();
  };

  const handleOpenEdit = (user: AdminUserReadSchema) => {
    setEditUser(user);
    setEditForm(getInitialEditForm(user));
    setEditErrors({});
    resetUpdateState();
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    resetUpdateState();
  };

  const handleExitedEdit = () => {
    setEditUser(null);
    setEditForm(null);
    setEditErrors({});
    resetUpdateState();
  };

  const handleChangeEditField = React.useCallback(
    <Key extends keyof EditFormState>(
      field: Key,
      value: EditFormState[Key]
    ) => {
      setEditForm(prev => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const handleSubmitEdit = async () => {
    if (!editUser || !editForm || !editUser.id) {
      return;
    }

    const errors = validateEditForm(editForm, editUser);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    await updateUser(buildEditUserPayload(editForm, editUser));
    await loadUsers(page, limit, emailSearch);
    handleCloseEdit();
  };

  const handleToggleActive = async (user: AdminUserReadSchema) => {
    if (!user.id) {
      return;
    }

    const currentActive = user.is_active ?? true;
    const nextActive = !currentActive;

    const ok = await confirm({
      title: nextActive
        ? 'Активировать пользователя'
        : 'Заблокировать пользователя',
      message: nextActive
        ? `Активировать пользователя ${user.email}?`
        : `Заблокировать пользователя ${user.email}? Он не сможет войти в систему.`,
      confirmLabel: nextActive ? 'Активировать' : 'Заблокировать',
      confirmColor: nextActive ? 'primary' : 'error',
    });

    if (!ok) {
      return;
    }

    await updateUser({
      user_id: user.id,
      is_active: nextActive,
    });
    await loadUsers(page, limit, emailSearch);
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleRequestSort = (key: SortKey) => {
    const nextSortState = getNextSortState(sortBy, sortDir, key);
    setSortBy(nextSortState.sortBy);
    setSortDir(nextSortState.sortDir);
  };

  const handleApplySearch = () => {
    const value = searchInput.trim();
    setPage(1);
    setEmailSearch(value || undefined);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setEmailSearch(undefined);
    setPage(1);
  };

  const sortedUsers = React.useMemo(
    () => sortUsers(users ?? [], sortBy, sortDir),
    [users, sortBy, sortDir]
  );

  const currentUserEmail = currentUser?.email ?? null;
  const isSuperAdmin = normalizeRole(currentUser?.role) === 'superadmin';
  const usersWithPinnedSelf = React.useMemo(
    () => pinCurrentUserToTop(sortedUsers, currentUserEmail),
    [sortedUsers, currentUserEmail]
  );

  const organizationsErrorText = organizationsError
    ? String(organizationsError.message ?? organizationsError.code)
    : null;

  return (
    <>
      <PanelContainer>
        <PanelHeader
          onOpenCreate={handleOpenCreate}
          onRefresh={handleRefresh}
        />

        <UsersToolbar
          onApplySearch={handleApplySearch}
          onClearSearch={handleClearSearch}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />

        {usersError ? (
          <AlertSection>
            <Alert severity='error'>{String(usersError)}</Alert>
          </AlertSection>
        ) : null}

        <UsersTable
          currentUserEmail={currentUserEmail}
          isSuperAdmin={isSuperAdmin}
          isUpdating={isUpdating}
          onEdit={handleOpenEdit}
          onRequestSort={handleRequestSort}
          onToggleActive={handleToggleActive}
          organizations={organizations}
          sortBy={sortBy}
          sortDir={sortDir}
          updatingUserId={updatingUserId}
          users={usersWithPinnedSelf}
          usersLoading={usersLoading}
        />

        <PaginationSection>
          <PaginationInfo>Page {page}</PaginationInfo>

          <PaginationButtons>
            <PaginationButton
              type='button'
              onClick={handlePrevPage}
              disabled={page === 1 || usersLoading}
            >
              Prev
            </PaginationButton>
            <PaginationButton
              type='button'
              onClick={handleNextPage}
              disabled={usersLoading || usersWithPinnedSelf.length === 0}
            >
              Next
            </PaginationButton>
          </PaginationButtons>
        </PaginationSection>
      </PanelContainer>

      <CreateUserDialog
        currentUserRole={currentUser?.role}
        errors={createErrors}
        form={createForm}
        isCreating={isCreating}
        onClose={handleCloseCreate}
        onFieldChange={handleChangeCreateField}
        onExited={handleExitedCreate}
        onSubmit={() => void handleSubmitCreate()}
        open={createDialogOpen}
        organizations={organizations}
        organizationsError={organizationsErrorText}
        organizationsLoading={organizationsLoading}
      />

      <EditUserDialog
        currentUserEmail={currentUserEmail}
        currentUserRole={currentUser?.role}
        editUser={editUser}
        errors={editErrors}
        form={editForm}
        isUpdating={isUpdating}
        onClose={handleCloseEdit}
        onFieldChange={handleChangeEditField}
        onExited={handleExitedEdit}
        onSubmit={() => void handleSubmitEdit()}
        open={editDialogOpen}
        organizations={organizations}
        organizationsError={organizationsErrorText}
        organizationsLoading={organizationsLoading}
        updatingUserId={updatingUserId}
      />
    </>
  );
};
