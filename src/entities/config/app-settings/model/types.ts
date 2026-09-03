import type {
  AppSettingDefinitionSchema,
  AppSettingsReadSchema,
  AppSettingsUpdateSchema,
  OomGuardConfig,
} from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

export type AppSettingsRecord = Record<string, unknown> & AppSettingsReadSchema;

export type AppSettingsDefinition = AppSettingDefinitionSchema;
export type AppSettingsUpdatePayload = AppSettingsUpdateSchema;

export type AppSettingsRequestStatus =
  | 'idle'
  | 'loading'
  | 'succeeded'
  | 'failed';

export type AppSettingsFieldKind =
  | 'text'
  | 'password'
  | 'number'
  | 'boolean'
  | 'select'
  | 'json'
  | 'oom_guard';

export type AppSettingsFormPrimitive = string | number | boolean;

export type OomGuardMode = 'DISABLED' | 'HOST_PRESSURE' | 'WORKER_THRESHOLD';

export type OomGuardWorkerThresholdType = 'PERCENT' | 'ABSOLUTE_MB';

export type AppSettingsNumericFormValue = number | string;

export interface OomGuardSettingsFormValue {
  mode: OomGuardMode;
  host_threshold_percent: AppSettingsNumericFormValue;
  worker_threshold_type: OomGuardWorkerThresholdType | '';
  worker_threshold_percent: AppSettingsNumericFormValue;
  worker_threshold_mb: AppSettingsNumericFormValue;
}

export type OomGuardSettingsPayload = OomGuardConfig;

export interface OomGuardSettingsFormErrors {
  mode?: string;
  host_threshold_percent?: string;
  worker_threshold_type?: string;
  worker_threshold_percent?: string;
  worker_threshold_mb?: string;
  _form?: string;
}

export interface AppSettingsSelectOption {
  value: string;
  label: string;
  rawValue: unknown;
}

export interface AppSettingsFieldDescriptor {
  key: string;
  namespace: string;
  relativePath: string[];
  label: string;
  description: string | null;
  group: string | null;
  kind: AppSettingsFieldKind;
  valueType: AppSettingsDefinition['value_type'];
  enumOptions: AppSettingsSelectOption[];
  nullable: boolean;
  required: boolean;
  runtimeEditable: boolean;
  secret: boolean;
  readEnv: boolean;
  envVar: string | null;
  defaultValue: unknown;
  ge: number | null;
  le: number | null;
  minLength: number | null;
  maxLength: number | null;
}

export type AppSettingsFormValue =
  | AppSettingsFormPrimitive
  | OomGuardSettingsFormValue;

export type AppSettingsFormValues = Partial<
  Record<string, AppSettingsFormValue>
>;

export type AppSettingsFormErrors = Partial<Record<string, string>>;

export interface AppSettingsGroup {
  id: string;
  label: string;
  fields: AppSettingsFieldDescriptor[];
}

export interface AppSettingsNamespace {
  id: string;
  label: string;
  groups: AppSettingsGroup[];
}

export interface AppSettingsSliceState {
  settings: AppSettingsRecord | null;
  definitions: AppSettingsDefinition[];
  status: AppSettingsRequestStatus;
  error: ApiErrorPayload | null;
  definitionsStatus: AppSettingsRequestStatus;
  definitionsError: ApiErrorPayload | null;
  upsertStatus: AppSettingsRequestStatus;
  upsertError: ApiErrorPayload | null;
  setValueStatus: AppSettingsRequestStatus;
  setValueError: ApiErrorPayload | null;
  deleteValueStatus: AppSettingsRequestStatus;
  deleteValueError: ApiErrorPayload | null;
  activeNamespace: string | null;
  activeKey: string | null;
  lastUpdatedAt: string | null;
}
