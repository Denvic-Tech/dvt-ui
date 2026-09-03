import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Alert, CircularProgress } from '@mui/material';

import { getRoleLabel, normalizeRole, roleOptions } from '@/entities/user';

import type { DvtDefaultRoles } from '@/shared/gatewayClient';

import { passwordRequirementsHint } from '../model/helpers';
import type { CreateUserDialogProps } from '../model/types';

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
} from './styles';

const getAvailableRoles = (
  currentUserRole: CreateUserDialogProps['currentUserRole']
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
  const availableRoles = getAvailableRoles(currentUserRole);

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
        <ModalTitle>Создание пользователя</ModalTitle>
        <ModalDescription>Создание новой учётной записи</ModalDescription>
      </ModalHeader>

      <ModalContent>
        {organizationsError ? (
          <Alert severity='error'>{organizationsError}</Alert>
        ) : null}

        <FormField>
          <FieldLabel htmlFor='create-user-email'>
            Email
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            id='create-user-email'
            value={form.email}
            onChange={event => onFieldChange('email', event.target.value)}
            type='email'
            fullWidth
            error={Boolean(errors.email)}
            placeholder='new_user@gmail.com'
          />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </FormField>

        <FormField>
          <FieldLabel htmlFor='create-user-name'>
            Username
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            id='create-user-name'
            value={form.user_name}
            onChange={event => onFieldChange('user_name', event.target.value)}
            fullWidth
            error={Boolean(errors.user_name)}
            placeholder='new_user'
          />
          {errors.user_name ? (
            <FieldError>{errors.user_name}</FieldError>
          ) : null}
        </FormField>

        <FormField>
          <FieldLabel htmlFor='create-user-password'>
            Пароль
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            id='create-user-password'
            value={form.password}
            onChange={event => onFieldChange('password', event.target.value)}
            type='password'
            fullWidth
            error={Boolean(errors.password)}
            placeholder={passwordRequirementsHint}
          />
          {errors.password ? (
            <FieldError>{errors.password}</FieldError>
          ) : (
            <FieldHint>{passwordRequirementsHint}</FieldHint>
          )}
        </FormField>

        <FormField>
          <FieldLabel id='create-user-organization-label'>
            Организация
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <DialogSelectControl error={Boolean(errors.organization_id)}>
            <DialogSelect
              labelId='create-user-organization-label'
              value={form.organization_id}
              onChange={event =>
                onFieldChange('organization_id', String(event.target.value))
              }
              disabled={organizationsLoading || organizations.length === 0}
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

        <FormField>
          <FieldLabel id='create-user-role-label'>Роль</FieldLabel>
          <DialogSelectControl>
            <DialogSelect
              labelId='create-user-role-label'
              value={form.role}
              onChange={event =>
                onFieldChange('role', event.target.value as DvtDefaultRoles)
              }
              IconComponent={ExpandMoreRoundedIcon}
              MenuProps={dialogSelectMenuProps}
              renderValue={value => getRoleLabel(String(value))}
            >
              {availableRoles.map(role => (
                <DialogMenuItem key={role} value={role}>
                  {getRoleLabel(role)}
                </DialogMenuItem>
              ))}
            </DialogSelect>
          </DialogSelectControl>
        </FormField>
      </ModalContent>

      <ModalFooter>
        <CancelButton type='button' onClick={onClose}>
          Отмена
        </CancelButton>
        <SaveButton
          type='button'
          onClick={onSubmit}
          disabled={
            isCreating || organizationsLoading || organizations.length === 0
          }
        >
          {isCreating ? <CircularProgress size={18} /> : 'Создать'}
        </SaveButton>
      </ModalFooter>
    </StyledDialog>
  );
};
