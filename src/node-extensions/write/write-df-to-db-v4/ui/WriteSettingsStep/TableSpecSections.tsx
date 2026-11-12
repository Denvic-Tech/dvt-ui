import { useMemo, useState } from 'react';

import {
  CLICKHOUSE_ENGINE_OPTIONS,
  createEmptyClickHouseSettingDraft,
  createEmptyForeignKeyDraft,
  createEmptyIndexDraft,
  type DraftForeignKeySpec,
  type DraftIndexSpec,
  hydrateTableCreateSpecDraft,
  type TableCreateSpecDraft,
  useTableCreateSpecDraft,
} from '@/features/node/table-create-spec-editor';

import type { Column, TableCreateSpec } from '@/shared/gatewayClient';
import { ChevronRightIcon, PlusIcon } from '@/shared/ui/clean-minimal/icons';

import { ColumnsSelect } from './ColumnsSelect';
import { SettingLine } from './SettingLine';
import {
  AddButton,
  CollapseButton,
  DeleteIconButton,
  KeyValueRow,
  ListHeader,
  SettingInput,
  SettingsBox,
  SettingsError,
  SettingsGroup,
} from './settings.styles';
import { SpecItemDialog, type SpecItemDialogState } from './SpecItemDialog';
import { SpecItemList, type SpecListItem } from './SpecItemList';

type DraftUpdater = (draft: TableCreateSpecDraft) => TableCreateSpecDraft;

type TableSpecSectionsProps = {
  isClickHouse: boolean;
  value: TableCreateSpec | null;
  columns: Column[];
  /** Ошибки typed-спецификации (Order by / Primary key и т. п.). */
  typedSpecErrors: readonly string[];
  /** Основные поля: всегда сериализуются сразу. */
  onPatchCore: (updater: DraftUpdater) => void;
  /** Индексы, внешние ключи и параметры ClickHouse: только валидный черновик. */
  onAdvancedChange: (value: TableCreateSpec | null) => void;
  onValidationChange: (errors: string[]) => void;
};

const TrashIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.4'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5' />
  </svg>
);

const ENGINE_OPTIONS: readonly string[] = CLICKHOUSE_ENGINE_OPTIONS;

const autoName = (prefix: string, columns: readonly string[]) =>
  columns.length ? `${prefix}${columns.join('_')}` : '';

const toIndexListItem = (index: DraftIndexSpec): SpecListItem => ({
  id: index.id,
  name: index.name || autoName('idx_', index.columns),
  isAutoName: !index.name,
  details: index.columns.join(', '),
  ...(index.unique ? { tag: 'Уникальный' } : {}),
});

const toForeignKeyListItem = (
  foreignKey: DraftForeignKeySpec
): SpecListItem => {
  const refTable = foreignKey.refSchema
    ? `${foreignKey.refSchema}.${foreignKey.refTable}`
    : foreignKey.refTable;
  return {
    id: foreignKey.id,
    name: foreignKey.name || autoName('fk_', foreignKey.columns),
    isAutoName: !foreignKey.name,
    details: `${foreignKey.columns.join(', ')}  →  ${refTable} (${foreignKey.refColumns.join(', ')})`,
  };
};

const hasError = (errors: readonly string[], fragment: string) =>
  errors.some(error => error.includes(fragment));

const singleValue = (value: string) => (value ? [value] : []);

/** Параметры создаваемой таблицы на шаге 4 (макет: секции `.qs`). */
export const TableSpecSections = ({
  isClickHouse,
  value,
  columns,
  typedSpecErrors,
  onPatchCore,
  onAdvancedChange,
  onValidationChange,
}: TableSpecSectionsProps) => {
  const [dialog, setDialog] = useState<SpecItemDialogState | null>(null);
  const [clickHouseOpen, setClickHouseOpen] = useState(true);

  const coreDraft = useMemo(() => hydrateTableCreateSpecDraft(value), [value]);
  const { draft, errors, updateDraft } = useTableCreateSpecDraft({
    value,
    columns,
    onChange: onAdvancedChange,
    onValidationChange,
  });
  const columnNames = useMemo(
    () => columns.map(column => column.name).filter(Boolean),
    [columns]
  );

  const patchClickHouse = (
    patch: Partial<TableCreateSpecDraft['clickhouse']>
  ) =>
    updateDraft(current => ({
      ...current,
      clickhouse: { ...current.clickhouse, ...patch },
    }));

  const patchCoreClickHouse = (
    patch: Partial<TableCreateSpecDraft['clickhouse']>
  ) =>
    onPatchCore(current => ({
      ...current,
      clickhouse: { ...current.clickhouse, ...patch },
    }));

  const saveDialog = (state: SpecItemDialogState) => {
    updateDraft(current => {
      if (state.kind === 'index') {
        return {
          ...current,
          indexes: state.isNew
            ? [...current.indexes, state.item]
            : current.indexes.map(index =>
                index.id === state.item.id ? state.item : index
              ),
        };
      }
      return {
        ...current,
        foreignKeys: state.isNew
          ? [...current.foreignKeys, state.item]
          : current.foreignKeys.map(foreignKey =>
              foreignKey.id === state.item.id ? state.item : foreignKey
            ),
      };
    });
    setDialog(null);
  };

  const keyInvalid =
    hasError(typedSpecErrors, 'Order by') ||
    hasError(typedSpecErrors, 'Primary key');

  return (
    <>
      <SettingsGroup>
        <SettingsBox>
          {isClickHouse ? (
            <>
              <SettingLine label='Engine'>
                <ColumnsSelect
                  ariaLabel='Engine'
                  values={[coreDraft.clickhouse.engineName]}
                  options={ENGINE_OPTIONS}
                  onChange={([engineName]) => {
                    if (!engineName) return;
                    patchCoreClickHouse({
                      engineName:
                        engineName as TableCreateSpecDraft['clickhouse']['engineName'],
                    });
                  }}
                  placeholder='Engine'
                  plainFont
                  clearable={false}
                />
              </SettingLine>
              <SettingLine label='Order by'>
                <ColumnsSelect
                  ariaLabel='Order by'
                  multiple
                  values={coreDraft.clickhouse.orderBy}
                  options={columnNames}
                  onChange={orderBy => patchCoreClickHouse({ orderBy })}
                  placeholder='Выберите колонки'
                  invalid={keyInvalid}
                />
              </SettingLine>
              <SettingLine label='Partition by'>
                <ColumnsSelect
                  ariaLabel='Partition by'
                  multiple
                  values={coreDraft.clickhouse.partitionBy}
                  options={columnNames}
                  onChange={partitionBy => patchCoreClickHouse({ partitionBy })}
                  placeholder='Не задано'
                />
              </SettingLine>
              <SettingLine label='Первичный ключ'>
                <ColumnsSelect
                  ariaLabel='Первичный ключ'
                  multiple
                  values={coreDraft.clickhouse.primaryKey}
                  options={columnNames}
                  onChange={primaryKey => patchCoreClickHouse({ primaryKey })}
                  placeholder='Выберите колонки'
                  invalid={keyInvalid}
                />
              </SettingLine>
            </>
          ) : (
            <SettingLine label='Первичный ключ'>
              <ColumnsSelect
                ariaLabel='Первичный ключ'
                multiple
                values={coreDraft.primaryKeyColumns}
                options={columnNames}
                onChange={primaryKeyColumns =>
                  onPatchCore(current => ({ ...current, primaryKeyColumns }))
                }
                placeholder='Выберите колонки'
              />
            </SettingLine>
          )}
        </SettingsBox>
        {typedSpecErrors.map(error => (
          <SettingsError key={error}>{error}</SettingsError>
        ))}
      </SettingsGroup>

      <SettingsGroup>
        <SpecItemList
          title='Индексы'
          addLabel='Индекс'
          items={draft.indexes.map(toIndexListItem)}
          onAdd={() =>
            setDialog({
              kind: 'index',
              isNew: true,
              item: createEmptyIndexDraft(),
            })
          }
          onEdit={id => {
            const item = draft.indexes.find(index => index.id === id);
            if (item) setDialog({ kind: 'index', isNew: false, item });
          }}
          onDelete={id =>
            updateDraft(current => ({
              ...current,
              indexes: current.indexes.filter(index => index.id !== id),
            }))
          }
        />
      </SettingsGroup>

      <SettingsGroup>
        <SpecItemList
          title='Внешние ключи'
          addLabel='Внешний ключ'
          items={draft.foreignKeys.map(toForeignKeyListItem)}
          onAdd={() =>
            setDialog({
              kind: 'foreignKey',
              isNew: true,
              item: createEmptyForeignKeyDraft(),
            })
          }
          onEdit={id => {
            const item = draft.foreignKeys.find(
              foreignKey => foreignKey.id === id
            );
            if (item) setDialog({ kind: 'foreignKey', isNew: false, item });
          }}
          onDelete={id =>
            updateDraft(current => ({
              ...current,
              foreignKeys: current.foreignKeys.filter(
                foreignKey => foreignKey.id !== id
              ),
            }))
          }
        />
      </SettingsGroup>

      {isClickHouse ? (
        <SettingsGroup>
          <SettingsBox>
            <CollapseButton
              type='button'
              open={clickHouseOpen}
              aria-expanded={clickHouseOpen}
              onClick={() => setClickHouseOpen(open => !open)}
            >
              <span className='collapse-chevron'>
                <ChevronRightIcon size={12} strokeWidth={1.7} />
              </span>
              Параметры ClickHouse
            </CollapseButton>
            {clickHouseOpen ? (
              <div>
                <SettingLine label='Sample by'>
                  <ColumnsSelect
                    ariaLabel='Sample by'
                    multiple
                    values={draft.clickhouse.sampleBy}
                    options={columnNames}
                    onChange={sampleBy => patchClickHouse({ sampleBy })}
                    placeholder='Не задано'
                  />
                </SettingLine>
                <SettingLine label='TTL'>
                  <SettingInput>
                    <input
                      value={draft.clickhouse.ttlExpression}
                      onChange={event =>
                        patchClickHouse({ ttlExpression: event.target.value })
                      }
                      placeholder='created_at + INTERVAL 30 DAY'
                      aria-label='TTL expression'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </SettingInput>
                </SettingLine>
                <SettingLine label='Table path'>
                  <SettingInput invalid={hasError(errors, 'table path')}>
                    <input
                      value={draft.clickhouse.tablePath}
                      onChange={event =>
                        patchClickHouse({ tablePath: event.target.value })
                      }
                      placeholder='/clickhouse/tables/…'
                      aria-label='Table path'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </SettingInput>
                </SettingLine>
                <SettingLine label='Replica name'>
                  <SettingInput invalid={hasError(errors, 'replica')}>
                    <input
                      value={draft.clickhouse.replicaName}
                      onChange={event =>
                        patchClickHouse({ replicaName: event.target.value })
                      }
                      placeholder='{replica}'
                      aria-label='Replica name'
                      spellCheck={false}
                      autoComplete='off'
                    />
                  </SettingInput>
                </SettingLine>
                <SettingLine label='Version column'>
                  <ColumnsSelect
                    ariaLabel='Version column'
                    values={singleValue(draft.clickhouse.versionColumn)}
                    options={columnNames}
                    onChange={([versionColumn]) =>
                      patchClickHouse({ versionColumn: versionColumn ?? '' })
                    }
                    placeholder='Не задано'
                    invalid={hasError(errors, 'version column')}
                  />
                </SettingLine>
                <SettingLine label='Sign column'>
                  <ColumnsSelect
                    ariaLabel='Sign column'
                    values={singleValue(draft.clickhouse.signColumn)}
                    options={columnNames}
                    onChange={([signColumn]) =>
                      patchClickHouse({ signColumn: signColumn ?? '' })
                    }
                    placeholder='Не задано'
                    invalid={hasError(errors, 'sign column')}
                  />
                </SettingLine>
                <SettingLine label='Summing columns'>
                  <ColumnsSelect
                    ariaLabel='Summing columns'
                    multiple
                    values={draft.clickhouse.summingColumns}
                    options={columnNames}
                    onChange={summingColumns =>
                      patchClickHouse({ summingColumns })
                    }
                    placeholder='Не задано'
                    invalid={hasError(errors, 'summing columns')}
                  />
                </SettingLine>
                <ListHeader>
                  <span className='list-title'>Settings</span>
                  <AddButton
                    type='button'
                    onClick={() =>
                      patchClickHouse({
                        settings: [
                          ...draft.clickhouse.settings,
                          createEmptyClickHouseSettingDraft(),
                        ],
                      })
                    }
                  >
                    <PlusIcon size={12} strokeWidth={1.8} />
                    Настройка
                  </AddButton>
                </ListHeader>
                {draft.clickhouse.settings.map(setting => (
                  <KeyValueRow key={setting.id}>
                    <SettingInput fullWidth>
                      <input
                        value={setting.key}
                        onChange={event =>
                          patchClickHouse({
                            settings: draft.clickhouse.settings.map(item =>
                              item.id === setting.id
                                ? { ...item, key: event.target.value }
                                : item
                            ),
                          })
                        }
                        placeholder='key'
                        aria-label='Ключ настройки'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </SettingInput>
                    <SettingInput fullWidth>
                      <input
                        value={setting.value}
                        onChange={event =>
                          patchClickHouse({
                            settings: draft.clickhouse.settings.map(item =>
                              item.id === setting.id
                                ? { ...item, value: event.target.value }
                                : item
                            ),
                          })
                        }
                        placeholder='value'
                        aria-label='Значение настройки'
                        spellCheck={false}
                        autoComplete='off'
                      />
                    </SettingInput>
                    <DeleteIconButton
                      type='button'
                      aria-label='Удалить настройку'
                      title='Удалить'
                      onClick={() =>
                        patchClickHouse({
                          settings: draft.clickhouse.settings.filter(
                            item => item.id !== setting.id
                          ),
                        })
                      }
                    >
                      <TrashIcon />
                    </DeleteIconButton>
                  </KeyValueRow>
                ))}
              </div>
            ) : null}
          </SettingsBox>
          {errors.map(error => (
            <SettingsError key={error}>{error}</SettingsError>
          ))}
        </SettingsGroup>
      ) : errors.length ? (
        <SettingsGroup>
          {errors.map(error => (
            <SettingsError key={error}>{error}</SettingsError>
          ))}
        </SettingsGroup>
      ) : null}

      {dialog ? (
        <SpecItemDialog
          state={dialog}
          columnOptions={columnNames}
          onSave={saveDialog}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
};
