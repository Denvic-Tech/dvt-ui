import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { z } from 'zod';

import {
  client,
  type OrganizationCreateSchema,
  type OrganizationReadSchema,
  type OrganizationUpdateSchema,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

const zName = z
  .string()
  .trim()
  .min(1, { message: 'Organization name is required' })
  .max(255, { message: 'Organization name is too long' });

const zInn = z
  .string()
  .trim()
  .max(32, { message: 'INN must be 32 characters or less' });

const emptyForm = {
  name: '',
  description: '',
  inn: '',
  is_active: true,
};

type OrganizationFormState = typeof emptyForm;

type OrganizationFormErrors = {
  name?: string;
  inn?: string;
};

type SortKey = 'name' | 'inn' | 'active' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

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
      nameResult.error.issues[0]?.message ?? 'Organization name is required';
  }

  const innResult = zInn.safeParse(form.inn);
  if (!innResult.success) {
    errors.inn = innResult.error.issues[0]?.message ?? 'Invalid INN';
  }

  return errors;
};

const buildOrganizationPayload = (
  form: OrganizationFormState
): OrganizationCreateSchema => {
  const description = form.description.trim();
  const inn = form.inn.trim();

  return {
    name: form.name.trim(),
    description: description || null,
    inn: inn || null,
    is_active: form.is_active,
  };
};

export const AdminOrganizationsPanel: React.FC = () => {
  const { confirm } = useConfirmDialog();

  const [organizations, setOrganizations] = React.useState<
    OrganizationReadSchema[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>('desc');

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] =
    React.useState<OrganizationFormState>(emptyForm);
  const [createErrors, setCreateErrors] =
    React.useState<OrganizationFormErrors>({});
  const [isCreating, setIsCreating] = React.useState(false);

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
    setLoading(true);
    setLoadError(null);

    try {
      const response = await client.organizations.get();
      setOrganizations(response.data);
    } catch (error) {
      setLoadError(
        resolveErrorMessage(error, 'Не удалось загрузить список организаций.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const handleRefresh = () => {
    void loadOrganizations();
  };

  const handleOpenCreate = () => {
    setActionError(null);
    setCreateErrors({});
    setCreateForm(emptyForm);
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
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
      await client.organizations.post({
        body: buildOrganizationPayload(createForm),
      });
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
      is_active: organization.is_active ?? true,
    });
  };

  const handleCloseEdit = () => {
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

  const handleRequestSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortDirection(
      key === 'created_at' || key === 'updated_at' ? 'desc' : 'asc'
    );
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

  const sortedOrganizations = React.useMemo(() => {
    const items = [...filteredOrganizations];

    items.sort((left, right) => {
      if (sortBy === 'name') {
        const comparison = left.name.localeCompare(right.name, 'ru', {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (sortBy === 'inn') {
        const comparison = (left.inn ?? '').localeCompare(
          right.inn ?? '',
          'ru',
          {
            sensitivity: 'base',
          }
        );
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (sortBy === 'active') {
        const comparison =
          Number(left.is_active ?? true) - Number(right.is_active ?? true);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const leftTime = left[sortBy]
        ? new Date(left[sortBy] as string).getTime()
        : 0;
      const rightTime = right[sortBy]
        ? new Date(right[sortBy] as string).getTime()
        : 0;
      const comparison = leftTime - rightTime;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [filteredOrganizations, sortBy, sortDirection]);

  const isUpdating = (organizationId?: string | null) =>
    organizationId != null && updatingOrganizationId === organizationId;

  return (
    <Box>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant='h5' gutterBottom>
            Organizations
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Управление организациями системы: создание, редактирование и
            управление статусом.
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <TextField
          size='small'
          label='Search organizations'
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
          sx={{ maxWidth: 360 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    edge='end'
                    onClick={() => setSearchInput('')}
                  >
                    <ClearIcon fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <Stack direction='row' spacing={1} justifyContent='flex-end'>
          <Button
            size='small'
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            size='small'
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            New organization
          </Button>
        </Stack>
      </Stack>

      {loadError ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      ) : null}

      <Paper variant='outlined'>
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sortDirection={sortBy === 'name' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === 'inn' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortBy === 'inn'}
                    direction={sortBy === 'inn' ? sortDirection : 'asc'}
                    onClick={() => handleRequestSort('inn')}
                  >
                    INN
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell
                  sortDirection={sortBy === 'active' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortBy === 'active'}
                    direction={sortBy === 'active' ? sortDirection : 'asc'}
                    onClick={() => handleRequestSort('active')}
                  >
                    Active
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={
                    sortBy === 'created_at' ? sortDirection : false
                  }
                >
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortDirection : 'desc'}
                    onClick={() => handleRequestSort('created_at')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={
                    sortBy === 'updated_at' ? sortDirection : false
                  }
                >
                  <TableSortLabel
                    active={sortBy === 'updated_at'}
                    direction={sortBy === 'updated_at' ? sortDirection : 'desc'}
                    onClick={() => handleRequestSort('updated_at')}
                  >
                    Updated
                  </TableSortLabel>
                </TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Stack
                      direction='row'
                      spacing={1}
                      alignItems='center'
                      justifyContent='center'
                      sx={{ py: 3 }}
                    >
                      <CircularProgress size={18} />
                      <Typography variant='body2' color='text.secondary'>
                        Загрузка организаций...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : sortedOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Stack
                      direction='row'
                      spacing={1}
                      alignItems='center'
                      justifyContent='center'
                      sx={{ py: 4 }}
                    >
                      <ApartmentIcon color='disabled' />
                      <Typography variant='body2' color='text.secondary'>
                        Организации не найдены.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrganizations.map(organization => {
                  const active = organization.is_active ?? true;
                  const updating = isUpdating(organization.id);

                  return (
                    <TableRow hover key={organization.id ?? organization.name}>
                      <TableCell>{organization.name}</TableCell>
                      <TableCell>{organization.inn || '—'}</TableCell>
                      <TableCell>{organization.description || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={active ? 'Active' : 'Inactive'}
                          color={active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(organization.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(organization.updated_at)}
                      </TableCell>
                      <TableCell align='right'>
                        <Stack
                          direction='row'
                          spacing={0.5}
                          justifyContent='flex-end'
                        >
                          <IconButton
                            size='small'
                            onClick={() => handleOpenEdit(organization)}
                            disabled={updating}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <Tooltip
                            title={
                              active
                                ? 'Deactivate organization'
                                : 'Activate organization'
                            }
                          >
                            <span>
                              <IconButton
                                size='small'
                                color={active ? 'error' : 'success'}
                                onClick={() =>
                                  void handleToggleActive(organization)
                                }
                                disabled={updating}
                              >
                                {updating ? (
                                  <CircularProgress size={16} />
                                ) : active ? (
                                  <BlockIcon fontSize='small' />
                                ) : (
                                  <CheckCircleIcon fontSize='small' />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={createOpen}
        onClose={isCreating ? undefined : handleCloseCreate}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>New organization</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label='Organization name'
              value={createForm.name}
              onChange={event =>
                setCreateForm(prev => ({ ...prev, name: event.target.value }))
              }
              error={Boolean(createErrors.name)}
              helperText={createErrors.name}
              autoFocus
              fullWidth
            />
            <TextField
              label='INN'
              value={createForm.inn}
              onChange={event =>
                setCreateForm(prev => ({ ...prev, inn: event.target.value }))
              }
              error={Boolean(createErrors.inn)}
              helperText={createErrors.inn}
              fullWidth
            />
            <TextField
              label='Description'
              value={createForm.description}
              onChange={event =>
                setCreateForm(prev => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={createForm.is_active}
                  onChange={(_, checked) =>
                    setCreateForm(prev => ({ ...prev, is_active: checked }))
                  }
                />
              }
              label='Organization is active'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => void handleSubmitCreate()}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOrganization != null && editForm != null}
        onClose={updatingOrganizationId ? undefined : handleCloseEdit}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Edit organization</DialogTitle>
        <DialogContent>
          {editForm ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label='Organization name'
                value={editForm.name}
                onChange={event =>
                  setEditForm(prev =>
                    prev == null ? prev : { ...prev, name: event.target.value }
                  )
                }
                error={Boolean(editErrors.name)}
                helperText={editErrors.name}
                autoFocus
                fullWidth
              />
              <TextField
                label='INN'
                value={editForm.inn}
                onChange={event =>
                  setEditForm(prev =>
                    prev == null ? prev : { ...prev, inn: event.target.value }
                  )
                }
                error={Boolean(editErrors.inn)}
                helperText={editErrors.inn}
                fullWidth
              />
              <TextField
                label='Description'
                value={editForm.description}
                onChange={event =>
                  setEditForm(prev =>
                    prev == null
                      ? prev
                      : { ...prev, description: event.target.value }
                  )
                }
                multiline
                minRows={3}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.is_active}
                    onChange={(_, checked) =>
                      setEditForm(prev =>
                        prev == null ? prev : { ...prev, is_active: checked }
                      )
                    }
                  />
                }
                label='Organization is active'
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEdit}
            disabled={updatingOrganizationId != null}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => void handleSubmitEdit()}
            disabled={updatingOrganizationId != null}
          >
            {updatingOrganizationId != null ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
