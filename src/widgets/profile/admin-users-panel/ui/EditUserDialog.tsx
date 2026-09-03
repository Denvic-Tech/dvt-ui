import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Alert, CircularProgress } from '@mui/material';

import { getRoleLabel, normalizeRole, roleOptions } from '@/entities/user';

import type { DvtDefaultRoles } from '@/shared/gatewayClient';

import { passwordRequirementsHint } from '../model/helpers';
import type { EditUserDialogProps } from '../model/types';

import {
  CancelButton,
  DialogMenuItem,
  DialogSelect,
  DialogSelectControl,
  FieldError,
  FieldHint,
  FieldLabel,
  FormField,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  RequiredMark,
  SaveButton,
  StyledDialog,
  TextInput,
  ToggleCard,
  ToggleDescription,
  ToggleInfo,
  ToggleLabel,
  ToggleSwitch,
  ToggleThumb,
} from './styles';

const getAvailableRoles = (
  currentUserRole: EditUserDialogProps['currentUserRole']
): DvtDefaultRoles[] => {
  if (normalizeRole(currentUserRole) === 'superadmin') {
    return roleOptions;
  }

  return roleOptions.filter(role => role !== 'superadmin');
};

const dialogSelectMenuProps = {
  PaperProps: {
    sx: {
      mt: 1,
      borderRadius: '14px',
      border: '1px solid #f3f4f6',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      '& .MuiList-root': {
        padding: '6px 0',
      },
    },
  },
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
  const availableRoles = getAvailableRoles(currentUserRole);
  const isSelf = Boolean(
    editUser && currentUserEmail && currentUserEmail === editUser.email
  );
  const isSaving = Boolean(
    isUpdating && editUser && updatingUserId === editUser.id
  );
  const currentRoleIsUnknown = Boolean(
    editUser && normalizeRole(editUser.role) == null
  );
  const roleValueIsAllowed = Boolean(
    form?.role && availableRoles.includes(form.role as DvtDefaultRoles)
  );
  const roleSelectValue = roleValueIsAllowed ? (form?.role ?? '') : '';
  const fallbackRoleLabel = form?.role
    ? getRoleLabel(form.role)
    : 'Unknown role';

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      TransitionProps={{
        onExited,
      }}
    >
      <ModalHeader>
        <ModalTitle>Редактирование пользователя</ModalTitle>
        <ModalDescription>Изменение данных учётной записи</ModalDescription>
      </ModalHeader>

      <ModalContent>
        {form && editUser ? (
          <>
            {organizationsError ? (
              <Alert severity='error'>{organizationsError}</Alert>
            ) : null}

            {currentRoleIsUnknown ? (
              <Alert severity='warning'>
                Текущая роль отсутствует или не распознана. Выберите корректную
                роль, если нужно нормализовать пользователя.
              </Alert>
            ) : null}

            <FormField>
              <FieldLabel htmlFor='edit-user-email'>Email</FieldLabel>
              <TextInput
                id='edit-user-email'
                value={form.email}
                onChange={event => onFieldChange('email', event.target.value)}
                type='email'
                fullWidth
                error={Boolean(errors.email)}
                placeholder='new_user@gmail.com'
              />
              {errors.email ? (
                <FieldError>{errors.email}</FieldError>
              ) : (
                <FieldHint>
                  Оставь без изменений, если не нужно менять email
                </FieldHint>
              )}
            </FormField>

            <FormField>
              <FieldLabel htmlFor='edit-user-name'>Username</FieldLabel>
              <TextInput
                id='edit-user-name'
                value={form.user_name}
                onChange={event =>
                  onFieldChange('user_name', event.target.value)
                }
                fullWidth
                placeholder='new_user'
              />
            </FormField>

            <FormField>
              <FieldLabel htmlFor='edit-user-password'>Новый пароль</FieldLabel>
              <TextInput
                id='edit-user-password'
                value={form.password}
                onChange={event =>
                  onFieldChange('password', event.target.value)
                }
                type='password'
                fullWidth
                error={Boolean(errors.password)}
                placeholder='Оставь пустым или введи новый пароль'
              />
              {errors.password ? (
                <FieldError>{errors.password}</FieldError>
              ) : (
                <FieldHint>
                  Оставь пустым или используй: {passwordRequirementsHint}
                </FieldHint>
              )}
            </FormField>

            {isSuperAdmin ? (
              <FormField>
                <FieldLabel id='edit-user-organization-label'>
                  Организация
                  <RequiredMark>*</RequiredMark>
                </FieldLabel>
                <DialogSelectControl error={Boolean(errors.organization_id)}>
                  <DialogSelect
                    labelId='edit-user-organization-label'
                    value={form.organization_id}
                    onChange={event =>
                      onFieldChange(
                        'organization_id',
                        String(event.target.value)
                      )
                    }
                    disabled={
                      organizationsLoading || organizations.length === 0
                    }
                    error={Boolean(errors.organization_id)}
                    IconComponent={ExpandMoreRoundedIcon}
                    MenuProps={dialogSelectMenuProps}
                  >
                    {organizations.map(organization => (
                      <DialogMenuItem
                        key={organization.id ?? organization.name}
                        value={organization.id ?? ''}
                      >
                        {organization.name}
                      </DialogMenuItem>
                    ))}
                  </DialogSelect>
                </DialogSelectControl>
                {errors.organization_id ? (
                  <FieldError>{errors.organization_id}</FieldError>
                ) : null}
              </FormField>
            ) : null}

            <FormField>
              <FieldLabel id='edit-user-role-label'>Роль</FieldLabel>
              <DialogSelectControl>
                <DialogSelect
                  labelId='edit-user-role-label'
                  value={roleSelectValue}
                  onChange={event =>
                    onFieldChange(
                      'role',
                      event.target.value as DvtDefaultRoles | ''
                    )
                  }
                  disabled={isSelf}
                  displayEmpty
                  IconComponent={ExpandMoreRoundedIcon}
                  MenuProps={dialogSelectMenuProps}
                  renderValue={value =>
                    value === ''
                      ? fallbackRoleLabel
                      : getRoleLabel(String(value))
                  }
                >
                  {!roleValueIsAllowed && form.role !== '' ? (
                    <DialogMenuItem value='' disabled>
                      {getRoleLabel(form.role)}
                    </DialogMenuItem>
                  ) : null}
                  {currentRoleIsUnknown ? (
                    <DialogMenuItem value='' disabled>
                      Unknown role
                    </DialogMenuItem>
                  ) : null}
                  {availableRoles.map(role => (
                    <DialogMenuItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </DialogMenuItem>
                  ))}
                </DialogSelect>
              </DialogSelectControl>
            </FormField>

            <ToggleCard>
              <ToggleInfo>
                <ToggleLabel>Верификация</ToggleLabel>
                <ToggleDescription>
                  Email пользователя подтверждён
                </ToggleDescription>
              </ToggleInfo>
              <ToggleSwitch
                type='button'
                isActive={form.is_verified}
                onClick={() => onFieldChange('is_verified', !form.is_verified)}
                disabled={isSelf}
                aria-pressed={form.is_verified}
              >
                <ToggleThumb isActive={form.is_verified} />
              </ToggleSwitch>
            </ToggleCard>
          </>
        ) : null}
      </ModalContent>

      <ModalFooter>
        <CancelButton type='button' onClick={onClose}>
          Отмена
        </CancelButton>
        <SaveButton
          type='button'
          onClick={onSubmit}
          disabled={!editUser || isUpdating}
        >
          {isSaving ? <CircularProgress size={18} /> : 'Сохранить'}
        </SaveButton>
      </ModalFooter>
    </StyledDialog>
  );
};
