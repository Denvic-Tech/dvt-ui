import * as React from 'react';
import { Alert, Stack } from '@mui/material';
import { IconPencil } from '@tabler/icons-react';

import { getRoleLabel, normalizeRole, roleOptions } from '@/entities/user';

import type { DvtDefaultRoles } from '@/shared/gatewayClient';
import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';
import {
  TokenDialog,
  TokenSelectField,
  TokenTextField,
} from '@/shared/ui/token-form';

import { passwordRequirementsHint } from '../model/helpers';
import type { EditUserDialogProps } from '../model/types';

const getAvailableRoles = (
  currentUserRole: EditUserDialogProps['currentUserRole']
): DvtDefaultRoles[] => {
  if (normalizeRole(currentUserRole) === 'superadmin') {
    return roleOptions;
  }

  return roleOptions.filter(role => role !== 'superadmin');
};

export const EditUserDialog = ({
  currentUserEmail,
  currentUserRole,
  editUser,
  errors,
  form,
  isUpdating,
  onClose,
  onFieldChange,
  onSubmit,
  open,
  organizations,
  organizationsError,
  organizationsLoading,
  onExited,
  updatingUserId,
}: EditUserDialogProps) => {
  const isSuperAdmin = normalizeRole(currentUserRole) === 'superadmin';
  const isSelf = Boolean(
    editUser && currentUserEmail && currentUserEmail === editUser.email
  );
  const isSaving = Boolean(
    isUpdating && editUser && updatingUserId === editUser.id
  );
  const currentRoleIsUnknown = Boolean(
    editUser && normalizeRole(editUser.role) == null
  );

  const availableRoles = React.useMemo(
    () => getAvailableRoles(currentUserRole),
    [currentUserRole]
  );
  const roleSelectOptions = React.useMemo(
    () =>
      availableRoles.map(role => ({ value: role, label: getRoleLabel(role) })),
    [availableRoles]
  );
  const organizationOptions = React.useMemo(
    () =>
      organizations.map(organization => ({
        value: organization.id ?? '',
        label: organization.name,
      })),
    [organizations]
  );

  // A role the admin cannot assign stays visible as the placeholder.
  const roleValueIsAllowed = Boolean(
    form?.role && availableRoles.includes(form.role as DvtDefaultRoles)
  );
  const roleSelectValue = roleValueIsAllowed ? (form?.role ?? '') : '';
  const fallbackRoleLabel = form?.role
    ? getRoleLabel(form.role)
    : 'Unknown role';

  return (
    <TokenDialog
      open={open}
      icon={<IconPencil stroke={1.5} />}
      title='Редактирование пользователя'
      subtitle={editUser?.email || editUser?.user_name || ''}
      onExited={onExited}
      actions={
        <>
          <CancelButton type='button' onClick={onClose}>
            Отмена
          </CancelButton>
          <CreateButton
            type='button'
            onClick={onSubmit}
            disabled={!editUser || isUpdating}
          >
            {isSaving ? 'Сохранение…' : 'Сохранить изменения'}
          </CreateButton>
        </>
      }
    >
      {form && editUser ? (
        <Stack spacing={1.5}>
          {organizationsError ? (
            <Alert severity='error'>{organizationsError}</Alert>
          ) : null}

          {currentRoleIsUnknown ? (
            <Alert severity='warning'>
              Текущая роль отсутствует или не распознана. Выберите корректную
              роль, если нужно нормализовать пользователя.
            </Alert>
          ) : null}

          <TokenTextField
            id='edit-user-email'
            label='Email'
            type='email'
            value={form.email}
            placeholder='new_user@gmail.com'
            error={errors.email}
            onChange={value => onFieldChange('email', value)}
          />

          <TokenTextField
            id='edit-user-name'
            label='Username'
            value={form.user_name}
            placeholder='new_user'
            onChange={value => onFieldChange('user_name', value)}
          />

          <TokenTextField
            id='edit-user-password'
            label='Новый пароль'
            type='password'
            value={form.password}
            placeholder='Не менять'
            hint={passwordRequirementsHint}
            error={errors.password}
            onChange={value => onFieldChange('password', value)}
          />

          {isSuperAdmin ? (
            <TokenSelectField
              label='Организация'
              value={form.organization_id}
              options={organizationOptions}
              placeholder='Выберите организацию'
              disabled={organizationsLoading || organizations.length === 0}
              loading={organizationsLoading}
              searchable
              error={errors.organization_id}
              onChange={value => onFieldChange('organization_id', value)}
            />
          ) : null}

          <TokenSelectField
            label='Роль'
            value={roleSelectValue}
            options={roleSelectOptions}
            placeholder={fallbackRoleLabel}
            disabled={isSelf}
            onChange={value => onFieldChange('role', value as DvtDefaultRoles)}
          />
        </Stack>
      ) : null}
    </TokenDialog>
  );
};
