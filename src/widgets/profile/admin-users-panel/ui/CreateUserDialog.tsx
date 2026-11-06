import * as React from 'react';
import { Alert, Stack } from '@mui/material';
import { IconUserPlus } from '@tabler/icons-react';

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
import type { CreateUserDialogProps } from '../model/types';

const getAvailableRoles = (
  currentUserRole: CreateUserDialogProps['currentUserRole']
): DvtDefaultRoles[] => {
  if (normalizeRole(currentUserRole) === 'superadmin') {
    return roleOptions;
  }

  return roleOptions.filter(role => role !== 'superadmin');
};

export const CreateUserDialog = ({
  currentUserRole,
  errors,
  form,
  isCreating,
  onClose,
  onFieldChange,
  onExited,
  onSubmit,
  open,
  organizations,
  organizationsError,
  organizationsLoading,
}: CreateUserDialogProps) => {
  const roleSelectOptions = React.useMemo(
    () =>
      getAvailableRoles(currentUserRole).map(role => ({
        value: role,
        label: getRoleLabel(role),
      })),
    [currentUserRole]
  );
  const organizationOptions = React.useMemo(
    () =>
      organizations.map(organization => ({
        value: organization.id ?? '',
        label: organization.name,
      })),
    [organizations]
  );

  return (
    <TokenDialog
      open={open}
      icon={<IconUserPlus stroke={1.5} />}
      title='Новый пользователь'
      subtitle='Создание учётной записи'
      onExited={onExited}
      actions={
        <>
          <CancelButton type='button' onClick={onClose}>
            Отмена
          </CancelButton>
          <CreateButton
            type='button'
            onClick={onSubmit}
            disabled={
              isCreating || organizationsLoading || organizations.length === 0
            }
          >
            {isCreating ? 'Создание…' : 'Создать'}
          </CreateButton>
        </>
      }
    >
      <Stack spacing={1.5}>
        {organizationsError ? (
          <Alert severity='error'>{organizationsError}</Alert>
        ) : null}

        <TokenTextField
          id='create-user-email'
          label='Email'
          type='email'
          value={form.email}
          placeholder='new_user@gmail.com'
          error={errors.email}
          onChange={value => onFieldChange('email', value)}
        />

        <TokenTextField
          id='create-user-name'
          label='Username'
          value={form.user_name}
          placeholder='new_user'
          error={errors.user_name}
          onChange={value => onFieldChange('user_name', value)}
        />

        <TokenTextField
          id='create-user-password'
          label='Пароль'
          type='password'
          value={form.password}
          placeholder='Введите пароль'
          hint={passwordRequirementsHint}
          error={errors.password}
          onChange={value => onFieldChange('password', value)}
        />

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

        <TokenSelectField
          label='Роль'
          value={form.role}
          options={roleSelectOptions}
          placeholder='Выберите роль'
          onChange={value => onFieldChange('role', value as DvtDefaultRoles)}
        />
      </Stack>
    </TokenDialog>
  );
};
