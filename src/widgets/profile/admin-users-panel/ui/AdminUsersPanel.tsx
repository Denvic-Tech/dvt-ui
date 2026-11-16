import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Alert } from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebar,
  IconSearch,
} from '@tabler/icons-react';

import { useAdmin } from '@/entities/admin/admin';
import { useOrganizations } from '@/entities/admin/organizations';
import { normalizeRole } from '@/entities/user';

import type { AdminUserReadSchema } from '@/shared/gatewayClient';
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
  buildCreateUserPayload,
  buildEditUserPayload,
  emptyCreateForm,
  getInitialEditForm,
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
import {
  AlertSection,
  UsersFooter,
  UsersFooterRange,
  UsersPageButton,
} from './styles';
import { UserRow, UserRowSkeleton } from './UserRow';

const FOOTER_HEIGHT = 44;

const SKELETON_ROWS = [
  { emailWidth: 196 },
  { emailWidth: 152 },
  { emailWidth: 228 },
  { emailWidth: 176 },
  { emailWidth: 140 },
];

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

  const [sortBy] = React.useState<SortKey>('signed_up_at');
  const [sortDir] = React.useState<SortDir>('desc');

  React.useEffect(() => {
    loadUsers(page, limit, emailSearch).catch(() => {});
  }, [page, limit, emailSearch, loadUsers]);

  React.useEffect(() => {
    loadOrganizations().catch(() => {});
  }, [loadOrganizations]);

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

  const handleToggleVerified = async (user: AdminUserReadSchema) => {
    if (!user.id) {
      return;
    }

    const nextVerified = !(user.is_verified ?? false);

    // Confirming is harmless; only taking the confirmation back asks first.
    if (!nextVerified) {
      const ok = await confirm({
        title: 'Снять верификацию',
        message: `Снять верификацию с пользователя ${user.email}?`,
        confirmLabel: 'Снять верификацию',
        confirmColor: 'error',
      });

      if (!ok) {
        return;
      }
    }

    await updateUser({
      user_id: user.id,
      is_verified: nextVerified,
    });
    await loadUsers(page, limit, emailSearch);
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleApplySearch = () => {
    const value = searchInput.trim();
    setPage(1);
    setEmailSearch(value || undefined);
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

  // Page changes and reloads after actions keep the rows instead of the
  // skeleton; only the first load shows it.
  const hasLoadedRef = React.useRef(false);
  if (!usersLoading) {
    hasLoadedRef.current = true;
  }
  const isLoadingList = !hasLoadedRef.current;
  const showSkeleton = useDelayedLoading(isLoadingList);

  const rowsCount = usersWithPinnedSelf.length;
  const firstRowNumber = (page - 1) * limit + 1;

  return (
    <>
      <PageLayout
        width='default'
        title='Admin Panel'
        icon={IconLayoutSidebar}
        headerActions={
          <>
            <TokenListSearch
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleApplySearch();
                }
              }}
              placeholder='Поиск по email'
              inputProps={{ 'aria-label': 'Поиск по email' }}
              startAdornment={<IconSearch size={14} stroke={1.6} />}
              sx={{ width: 240 }}
            />
            <TokenListCreateButton disableRipple onClick={handleOpenCreate}>
              <AddRoundedIcon sx={{ fontSize: 16 }} />
              Новый пользователь
            </TokenListCreateButton>
          </>
        }
        fitContent
      >
        {usersError ? (
          <AlertSection>
            <Alert severity='error'>{String(usersError)}</Alert>
          </AlertSection>
        ) : null}

        <TokenListBox
          aria-label='Пользователи'
          sx={{
            flex: `0 1 ${getTokenListBoxHeight(rowsCount) + FOOTER_HEIGHT}px`,
          }}
        >
          <TokenListScroll sx={{ flex: 1 }}>
            {showSkeleton ? (
              SKELETON_ROWS.map(row => (
                <UserRowSkeleton
                  key={row.emailWidth}
                  emailWidth={row.emailWidth}
                  showOrganization={isSuperAdmin}
                />
              ))
            ) : isLoadingList ? null : rowsCount === 0 ? (
              <TokenListMessage>
                {emailSearch ? 'Никого не найдено' : 'Пользователи не найдены.'}
              </TokenListMessage>
            ) : (
              usersWithPinnedSelf.map(user => (
                <UserRow
                  key={user.id ?? user.email}
                  user={user}
                  isSelf={Boolean(
                    currentUserEmail && currentUserEmail === user.email
                  )}
                  showOrganization={isSuperAdmin}
                  organizations={organizations}
                  isToggling={Boolean(isUpdating && updatingUserId === user.id)}
                  onEdit={handleOpenEdit}
                  onToggleActive={item => void handleToggleActive(item)}
                  onToggleVerified={item => void handleToggleVerified(item)}
                />
              ))
            )}
          </TokenListScroll>

          <UsersFooter>
            <UsersFooterRange>
              {rowsCount > 0
                ? `${firstRowNumber}–${firstRowNumber + rowsCount - 1}`
                : null}
            </UsersFooterRange>
            <UsersPageButton
              disableRipple
              aria-label='Предыдущая страница'
              onClick={handlePrevPage}
              disabled={page === 1 || usersLoading}
            >
              <IconChevronLeft size={14} stroke={1.6} />
            </UsersPageButton>
            <UsersPageButton
              disableRipple
              aria-label='Следующая страница'
              onClick={handleNextPage}
              disabled={usersLoading || rowsCount < limit}
            >
              <IconChevronRight size={14} stroke={1.6} />
            </UsersPageButton>
          </UsersFooter>
        </TokenListBox>
      </PageLayout>

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
