import { useId, useMemo, useState } from 'react';

import {
  createDefaultTableCreateSpecDraft,
  type DraftForeignKeySpec,
  type DraftIndexSpec,
  parseCommaSeparatedList,
  stringifyStringList,
  validateTableCreateSpecDraft,
} from '@/features/node/table-create-spec-editor';

import { CloseIcon } from '@/shared/ui/clean-minimal/icons';

import {
  IconCloseButton,
  SmallButton,
  SmallDialog,
  SmallDialogBody,
  SmallDialogFooter,
  SmallDialogHeader,
  SmallDialogTitle,
} from '../kit.styles';
import { ToggleSwitch } from '../schema-step/SchemaStep.styles';

import { ColumnsSelect } from './ColumnsSelect';
import {
  DialogField,
  DialogFieldRow,
  DialogSwitchRow,
  SettingInput,
} from './settings.styles';

export type SpecItemDialogState =
  | { kind: 'index'; isNew: boolean; item: DraftIndexSpec }
  | { kind: 'foreignKey'; isNew: boolean; item: DraftForeignKeySpec };

type SpecItemDialogProps = {
  state: SpecItemDialogState;
  columnOptions: readonly string[];
  onSave: (state: SpecItemDialogState) => void;
  onClose: () => void;
};

const buildAutoName = (prefix: string, columns: readonly string[]) =>
  columns.length ? `${prefix}${columns.join('_')}` : '';

/** Ошибки элемента — та же проверка, что у всего черновика спецификации. */
const getItemErrors = (state: SpecItemDialogState) => {
  const draft = createDefaultTableCreateSpecDraft();
  if (state.kind === 'index') draft.indexes = [state.item];
  else draft.foreignKeys = [state.item];
  return validateTableCreateSpecDraft(draft, []).errors;
};

/** Добавление и правка индекса или внешнего ключа (макет: `.qdlg`). */
export const SpecItemDialog = ({
  state: initialState,
  columnOptions,
  onSave,
  onClose,
}: SpecItemDialogProps) => {
  const titleId = useId();
  const [state, setState] = useState(initialState);
  // Текст ref columns хранится как ввели (с пробелами и запятыми).
  const [refColumnsText, setRefColumnsText] = useState(() =>
    initialState.kind === 'foreignKey'
      ? stringifyStringList(initialState.item.refColumns)
      : ''
  );

  const errors = useMemo(() => getItemErrors(state), [state]);
  const canSave = errors.length === 0;
  const isIndex = state.kind === 'index';
  const title = isIndex
    ? state.isNew
      ? 'Новый индекс'
      : 'Индекс'
    : state.isNew
      ? 'Новый внешний ключ'
      : 'Внешний ключ';
  const namePlaceholder =
    buildAutoName(isIndex ? 'idx_' : 'fk_', state.item.columns) ||
    (isIndex ? 'idx_name' : 'fk_name');
  const countMismatch =
    state.kind === 'foreignKey' &&
    state.item.columns.length > 0 &&
    state.item.refColumns.length > 0 &&
    state.item.columns.length !== state.item.refColumns.length;

  const patch = (
    changes: Partial<DraftIndexSpec> & Partial<DraftForeignKeySpec>
  ) =>
    setState(current =>
      current.kind === 'index'
        ? {
            ...current,
            item: {
              ...current.item,
              ...(changes.columns ? { columns: changes.columns } : {}),
              ...(changes.name !== undefined ? { name: changes.name } : {}),
              ...(changes.unique !== undefined
                ? { unique: changes.unique }
                : {}),
            },
          }
        : {
            ...current,
            item: {
              ...current.item,
              ...(changes.columns ? { columns: changes.columns } : {}),
              ...(changes.name !== undefined ? { name: changes.name } : {}),
              ...(changes.refSchema !== undefined
                ? { refSchema: changes.refSchema }
                : {}),
              ...(changes.refTable !== undefined
                ? { refTable: changes.refTable }
                : {}),
              ...(changes.refColumns ? { refColumns: changes.refColumns } : {}),
            },
          }
    );

  const save = () => {
    if (canSave) onSave(state);
  };

  return (
    <SmallDialog
      open
      onClose={onClose}
      aria-labelledby={titleId}
      sx={{ '& .MuiDialog-paper': { width: 440 } }}
    >
      <SmallDialogHeader>
        <SmallDialogTitle id={titleId}>{title}</SmallDialogTitle>
        <span style={{ flex: 1 }} />
        <IconCloseButton type='button' aria-label='Закрыть' onClick={onClose}>
          <CloseIcon size={13} strokeWidth={1.7} />
        </IconCloseButton>
      </SmallDialogHeader>
      <SmallDialogBody
        sx={{ gap: '14px', padding: '4px 16px 18px' }}
        onKeyDown={event => {
          if (
            event.key === 'Enter' &&
            event.target instanceof HTMLInputElement
          ) {
            event.preventDefault();
            save();
          }
        }}
      >
        <DialogField>
          <span className='field-label'>Колонки</span>
          <ColumnsSelect
            ariaLabel='Колонки'
            variant='field'
            multiple
            values={state.item.columns}
            options={columnOptions}
            onChange={columns => patch({ columns })}
            placeholder='Выберите колонки'
          />
        </DialogField>
        {state.kind === 'foreignKey' ? (
          <>
            <DialogField>
              <span className='field-label'>Ссылается на</span>
              <DialogFieldRow>
                <SettingInput style={{ width: 130 }}>
                  <input
                    value={state.item.refSchema}
                    onChange={event => patch({ refSchema: event.target.value })}
                    placeholder='schema'
                    aria-label='Ref schema'
                    spellCheck={false}
                    autoComplete='off'
                  />
                </SettingInput>
                <span className='field-dot'>.</span>
                <SettingInput fullWidth>
                  <input
                    value={state.item.refTable}
                    onChange={event => patch({ refTable: event.target.value })}
                    placeholder='table'
                    aria-label='Ref table'
                    spellCheck={false}
                    autoComplete='off'
                  />
                </SettingInput>
              </DialogFieldRow>
            </DialogField>
            <DialogField>
              <span className='field-label'>Колонки в связанной таблице</span>
              <SettingInput fullWidth invalid={countMismatch}>
                <input
                  value={refColumnsText}
                  onChange={event => {
                    setRefColumnsText(event.target.value);
                    patch({
                      refColumns: parseCommaSeparatedList(event.target.value),
                    });
                  }}
                  placeholder='id, code'
                  aria-label='Ref columns'
                  spellCheck={false}
                  autoComplete='off'
                />
              </SettingInput>
              <span className='field-hint' data-error={countMismatch}>
                {countMismatch
                  ? 'Количество колонок должно совпадать'
                  : 'Через запятую, в том же порядке'}
              </span>
            </DialogField>
          </>
        ) : null}
        <DialogField>
          <span className='field-label'>Имя</span>
          <SettingInput fullWidth>
            <input
              value={state.item.name}
              onChange={event => patch({ name: event.target.value })}
              placeholder={namePlaceholder}
              aria-label='Имя'
              spellCheck={false}
              autoComplete='off'
            />
          </SettingInput>
        </DialogField>
        {state.kind === 'index' ? (
          <DialogSwitchRow>
            <span>Уникальный</span>
            <ToggleSwitch
              type='button'
              role='switch'
              checked={state.item.unique}
              aria-checked={state.item.unique}
              aria-label='Уникальный индекс'
              onClick={() => patch({ unique: !state.item.unique })}
            />
          </DialogSwitchRow>
        ) : null}
      </SmallDialogBody>
      <SmallDialogFooter>
        <SmallButton type='button' tone='secondary' onClick={onClose}>
          Отмена
        </SmallButton>
        <SmallButton
          type='button'
          tone='primary'
          disabled={!canSave}
          title={canSave ? undefined : errors.join('\n')}
          onClick={save}
        >
          {state.isNew ? 'Добавить' : 'Сохранить'}
        </SmallButton>
      </SmallDialogFooter>
    </SmallDialog>
  );
};
