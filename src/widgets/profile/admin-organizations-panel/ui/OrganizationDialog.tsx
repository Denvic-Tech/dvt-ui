import { Alert, Stack } from '@mui/material';
import { IconBuildingPlus, IconPencil } from '@tabler/icons-react';

import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';
import { TokenDialog, TokenTextField } from '@/shared/ui/token-form';

export type OrganizationFormState = {
  name: string;
  description: string;
  inn: string;
};

export type OrganizationFormErrors = {
  name?: string;
  inn?: string;
};

type OrganizationDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  // Name of the organization being edited.
  organizationName?: string | undefined;
  form: OrganizationFormState;
  errors: OrganizationFormErrors;
  // The last request error, shown above the fields.
  error: string | null;
  isSaving: boolean;
  onChange: (form: OrganizationFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
  onExited: () => void;
};

export const OrganizationDialog = ({
  open,
  mode,
  organizationName,
  form,
  errors,
  error,
  isSaving,
  onChange,
  onSubmit,
  onClose,
  onExited,
}: OrganizationDialogProps) => {
  const isCreate = mode === 'create';
  const idPrefix = `${mode}-organization`;

  const update = <Key extends keyof OrganizationFormState>(
    field: Key,
    value: OrganizationFormState[Key]
  ) => onChange({ ...form, [field]: value });

  return (
    <TokenDialog
      open={open}
      icon={
        isCreate ? (
          <IconBuildingPlus stroke={1.5} />
        ) : (
          <IconPencil stroke={1.5} />
        )
      }
      title={isCreate ? 'Новая организация' : 'Редактирование организации'}
      subtitle={
        isCreate ? 'Название, ИНН и описание' : (organizationName ?? '')
      }
      onExited={onExited}
      actions={
        <>
          <CancelButton type='button' onClick={onClose} disabled={isSaving}>
            Отмена
          </CancelButton>
          <CreateButton type='button' onClick={onSubmit} disabled={isSaving}>
            {isCreate
              ? isSaving
                ? 'Создание…'
                : 'Создать'
              : isSaving
                ? 'Сохранение…'
                : 'Сохранить изменения'}
          </CreateButton>
        </>
      }
    >
      <Stack spacing={1.5}>
        {error ? <Alert severity='error'>{error}</Alert> : null}

        <TokenTextField
          id={`${idPrefix}-name`}
          label='Название'
          value={form.name}
          placeholder='ООО «Ромашка»'
          autoFocus
          error={errors.name}
          onChange={value => update('name', value)}
        />

        <TokenTextField
          id={`${idPrefix}-inn`}
          label='ИНН'
          value={form.inn}
          placeholder='Необязательно'
          error={errors.inn}
          onChange={value => update('inn', value)}
        />

        <TokenTextField
          id={`${idPrefix}-description`}
          label='Описание'
          value={form.description}
          placeholder='Необязательно'
          multiline
          onChange={value => update('description', value)}
        />
      </Stack>
    </TokenDialog>
  );
};
