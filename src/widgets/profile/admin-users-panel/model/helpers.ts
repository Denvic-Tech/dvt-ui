import { z } from 'zod';

import { compareRoles, normalizeRole } from '@/entities/user';

import type {
  AdminUserCreateSchema,
  AdminUserReadSchema,
  AdminUserUpdateSchema,
} from '@/shared/gatewayClient';

import type {
  CreateEditFormErrors,
  CreateFormState,
  EditFormState,
  SortDir,
  SortKey,
} from './types.ts';

const zEmail = z.string().max(255).email({ message: 'Invalid email address' });

export const passwordRequirementsHint =
  'Минимум 8 символов, 1 цифра и 1 спецсимвол';

const zPassword = z
  .string()
  .min(8, { message: passwordRequirementsHint })
  .regex(/\d/, { message: passwordRequirementsHint })
  .regex(/[^A-Za-z0-9]/, { message: passwordRequirementsHint })
  .max(255);

export const emptyCreateForm: CreateFormState = {
  email: '',
  user_name: '',
  password: '',
  role: 'user',
  organization_id: '',
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export const validateCreateForm = (
  form: CreateFormState
): CreateEditFormErrors => {
  const errors: CreateEditFormErrors = {};

  const emailResult = zEmail.safeParse(form.email.trim());
  if (!emailResult.success) {
    errors.email =
      emailResult.error.issues[0]?.message ?? 'Invalid email address';
  }

  const passwordResult = zPassword.safeParse(form.password);
  if (!passwordResult.success) {
    errors.password =
      passwordResult.error.issues[0]?.message ?? 'Invalid password';
  }

  if (!form.user_name.trim()) {
    errors.user_name = 'User name is required';
  }

  if (!form.organization_id) {
    errors.organization_id = 'Organization is required';
  }

  return errors;
};

export const validateEditForm = (
  form: EditFormState,
  original: AdminUserReadSchema
): CreateEditFormErrors => {
  const errors: CreateEditFormErrors = {};
  const emailTrimmed = form.email.trim();

  if (emailTrimmed && emailTrimmed !== (original.email ?? '')) {
    const emailResult = zEmail.safeParse(emailTrimmed);
    if (!emailResult.success) {
      errors.email =
        emailResult.error.issues[0]?.message ?? 'Invalid email address';
    }
  }

  if (form.password.trim()) {
    const passwordResult = zPassword.safeParse(form.password);
    if (!passwordResult.success) {
      errors.password =
        passwordResult.error.issues[0]?.message ?? 'Invalid password';
    }
  }

  return errors;
};

export const buildCreateUserPayload = (
  form: CreateFormState
): AdminUserCreateSchema => ({
  email: form.email.trim(),
  user_name: form.user_name.trim(),
  password: form.password,
  role: form.role,
  organization_id: form.organization_id,
});

export const buildEditUserPayload = (
  form: EditFormState,
  user: AdminUserReadSchema
): AdminUserUpdateSchema => {
  const payload: AdminUserUpdateSchema = {
    user_id: user.id ?? '',
  };

  const emailTrimmed = form.email.trim();
  if (emailTrimmed !== (user.email ?? '')) {
    payload.email = emailTrimmed;
  }

  const userNameTrimmed = form.user_name.trim();
  if ((userNameTrimmed || '') !== (user.user_name || '')) {
    payload.user_name = userNameTrimmed;
  }

  if (form.password.trim()) {
    payload.password = form.password;
  }

  const originalRole = normalizeRole(user.role);
  if (form.role !== '' && form.role !== originalRole) {
    payload.role = form.role;
  }

  if (form.organization_id !== user.organization_id) {
    payload.organization_id = form.organization_id;
  }

  if (form.is_verified !== (user.is_verified ?? false)) {
    payload.is_verified = form.is_verified;
  }

  return payload;
};

export const getInitialEditForm = (
  user: AdminUserReadSchema
): EditFormState => ({
  email: user.email ?? '',
  user_name: user.user_name ?? '',
  password: '',
  role: normalizeRole(user.role) ?? '',
  organization_id: user.organization_id,
  is_verified: user.is_verified ?? false,
});

export const getNextSortState = (
  currentKey: SortKey,
  currentDir: SortDir,
  nextKey: SortKey
) => {
  if (currentKey === nextKey) {
    return {
      sortBy: currentKey,
      sortDir: currentDir === 'asc' ? 'desc' : 'asc',
    } as const;
  }

  return {
    sortBy: nextKey,
    sortDir: 'asc' as const,
  };
};

export const sortUsers = (
  users: AdminUserReadSchema[],
  sortBy: SortKey,
  sortDir: SortDir
) => {
  const items = [...users];

  items.sort((a, b) => {
    if (sortBy === 'email') {
      const left = a.email?.toLowerCase() ?? '';
      const right = b.email?.toLowerCase() ?? '';
      const comparison = left.localeCompare(right);
      return sortDir === 'asc' ? comparison : -comparison;
    }

    if (sortBy === 'signed_up_at') {
      const left = a.signed_up_at ? new Date(a.signed_up_at).getTime() : 0;
      const right = b.signed_up_at ? new Date(b.signed_up_at).getTime() : 0;
      const comparison = left - right;
      return sortDir === 'asc' ? comparison : -comparison;
    }

    if (sortBy === 'verified') {
      const comparison =
        Number(a.is_verified ?? false) - Number(b.is_verified ?? false);
      return sortDir === 'asc' ? comparison : -comparison;
    }

    if (sortBy === 'active') {
      const comparison =
        Number(a.is_active !== false) - Number(b.is_active !== false);
      return sortDir === 'asc' ? comparison : -comparison;
    }

    const comparison = compareRoles(a.role, b.role);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return items;
};

export const pinCurrentUserToTop = (
  users: AdminUserReadSchema[],
  currentUserEmail: string | null
) => {
  if (!currentUserEmail) {
    return users;
  }

  const selfIndex = users.findIndex(user => user.email === currentUserEmail);
  if (selfIndex < 0) {
    return users;
  }

  const selfUser = users[selfIndex];
  return [selfUser, ...users.filter((_, index) => index !== selfIndex)];
};
