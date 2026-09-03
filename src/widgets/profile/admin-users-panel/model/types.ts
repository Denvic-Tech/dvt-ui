import type {
  AdminUserReadSchema,
  DvtDefaultRoles,
  OrganizationReadSchema,
  UserReadSchema,
} from '@/shared/gatewayClient';

export type AdminUsersPanelProps = {
  currentUser: UserReadSchema | null;
};

export type PanelHeaderProps = {
  onOpenCreate: () => void;
  onRefresh: () => void;
};

export type CreateFormState = {
  email: string;
  user_name: string;
  password: string;
  role: DvtDefaultRoles;
  organization_id: string;
};

export type EditFormState = {
  email: string;
  user_name: string;
  password: string;
  role: DvtDefaultRoles | '';
  organization_id: string;
  is_verified: boolean;
};

export type CreateEditFormErrors = {
  email?: string;
  password?: string;
  user_name?: string;
  organization_id?: string;
};

export type SortKey = 'email' | 'signed_up_at' | 'verified' | 'active' | 'role';

export type SortDir = 'asc' | 'desc';

export type UsersTableProps = {
  currentUserEmail: string | null;
  isUpdating: boolean;
  isSuperAdmin: boolean;
  onEdit: (user: AdminUserReadSchema) => void;
  onRequestSort: (key: SortKey) => void;
  onToggleActive: (user: AdminUserReadSchema) => void;
  organizations: OrganizationReadSchema[];
  sortBy: SortKey;
  sortDir: SortDir;
  updatingUserId: string | null;
  users: AdminUserReadSchema[];
  usersLoading: boolean;
};

export type UsersToolbarProps = {
  onApplySearch: () => void;
  onClearSearch: () => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
};

export type CreateUserDialogProps = {
  currentUserRole: UserReadSchema['role'] | null | undefined;
  errors: CreateEditFormErrors;
  form: CreateFormState;
  isCreating: boolean;
  onClose: () => void;
  onFieldChange: <Key extends keyof CreateFormState>(
    field: Key,
    value: CreateFormState[Key]
  ) => void;
  onSubmit: () => void;
  open: boolean;
  organizations: OrganizationReadSchema[];
  organizationsError: string | null;
  organizationsLoading: boolean;
  onExited: () => void;
};

export type EditUserDialogProps = {
  currentUserEmail: string | null;
  currentUserRole: UserReadSchema['role'] | null | undefined;
  editUser: AdminUserReadSchema | null;
  errors: CreateEditFormErrors;
  form: EditFormState | null;
  isUpdating: boolean;
  onClose: () => void;
  onFieldChange: <Key extends keyof EditFormState>(
    field: Key,
    value: EditFormState[Key]
  ) => void;
  onSubmit: () => void;
  open: boolean;
  organizations: OrganizationReadSchema[];
  organizationsError: string | null;
  organizationsLoading: boolean;
  onExited: () => void;
  updatingUserId: string | null;
};
