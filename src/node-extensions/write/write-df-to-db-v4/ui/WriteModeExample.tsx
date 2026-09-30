import {
  ExampleCard,
  ExampleCardTitle,
  ExampleGrid,
  ExampleHeading,
  ExampleLegend,
  ExampleNote,
  ExampleOperator,
  ExampleRow,
  ExampleTable,
  LegendItem,
  ModeExample,
  ModeSectionLabel,
} from './WriteModeStep.styles';

type ExampleRecord = {
  id: string;
  sku: string;
  amount: string;
  tone?: 'added' | 'removed' | 'updated';
};

const CURRENT_ROWS: ExampleRecord[] = [
  { id: '1041', sku: 'A-17', amount: '1 240.00' },
  { id: '1042', sku: 'B-03', amount: '860.50' },
  { id: '1043', sku: 'A-17', amount: '415.00' },
];

const INCOMING_ROWS: ExampleRecord[] = [
  { id: '1043', sku: 'A-17', amount: '399.00' },
  { id: '1044', sku: 'C-11', amount: '2 100.00' },
  { id: '1045', sku: 'B-03', amount: '640.00' },
];

const SampleTable = ({
  title,
  rows,
  muted = false,
  keyLabel,
}: {
  title: string;
  rows: ExampleRecord[];
  muted?: boolean;
  keyLabel: string;
}) => (
  <ExampleCard muted={muted}>
    <ExampleCardTitle>{title}</ExampleCardTitle>
    <ExampleTable aria-label={title}>
      <thead>
        <tr>
          <th title={keyLabel}>{keyLabel}</th>
          <th>{keyLabel === 'sku' ? 'item' : 'sku'}</th>
          <th>{keyLabel === 'amount' ? 'value' : 'amount'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <ExampleRow key={index} tone={row.tone}>
            <td>{row.id}</td>
            <td>{row.sku}</td>
            <td>{row.amount}</td>
          </ExampleRow>
        ))}
      </tbody>
    </ExampleTable>
  </ExampleCard>
);

export const WriteModeExample = ({
  mode,
  keyColumn,
}: {
  mode: string;
  keyColumn: string;
}) => {
  if (!['append', 'truncate', 'upsert'].includes(mode)) return null;
  const isUpsert = mode === 'upsert';
  const awaitingKey = isUpsert && !keyColumn.trim();
  const keyLabel = isUpsert ? keyColumn.trim() || 'id' : 'id';
  const result: ExampleRecord[] = isUpsert
    ? [
        ...CURRENT_ROWS.slice(0, 2),
        ...INCOMING_ROWS.map((row, index) => ({
          ...row,
          tone: index === 0 ? ('updated' as const) : ('added' as const),
        })),
      ]
    : [
        ...CURRENT_ROWS.map(row => ({
          ...row,
          ...(mode === 'truncate' ? { tone: 'removed' as const } : {}),
        })),
        ...INCOMING_ROWS.map(row => ({ ...row, tone: 'added' as const })),
      ];

  return (
    <ModeExample aria-label='Пример на условных данных'>
      <ExampleHeading>
        <ModeSectionLabel title='Иллюстрация на условных данных'>
          Пример результата
        </ModeSectionLabel>
        {!awaitingKey ? (
          <ExampleLegend>
            <LegendItem tone='added'>{isUpsert ? 2 : 3} добавлено</LegendItem>
            {mode === 'truncate' ? (
              <LegendItem tone='removed'>3 удалено</LegendItem>
            ) : null}
            {isUpsert ? (
              <LegendItem tone='updated'>1 обновлено</LegendItem>
            ) : null}
          </ExampleLegend>
        ) : null}
      </ExampleHeading>
      <ExampleGrid>
        <SampleTable
          title='Таблица сейчас'
          rows={CURRENT_ROWS}
          keyLabel={keyLabel}
        />
        <ExampleOperator aria-hidden>+</ExampleOperator>
        <SampleTable
          title='DataFrame'
          rows={INCOMING_ROWS}
          keyLabel={keyLabel}
        />
        <ExampleOperator aria-hidden>=</ExampleOperator>
        <SampleTable
          title={awaitingKey ? 'Результат · выберите ключ' : 'Результат'}
          rows={result}
          keyLabel={keyLabel}
          muted={awaitingKey}
        />
      </ExampleGrid>
      {mode === 'append' ? (
        <ExampleNote>Строка 1043 окажется в таблице дважды.</ExampleNote>
      ) : mode === 'truncate' ? (
        <ExampleNote>
          Текущие строки будут удалены из таблицы перед записью.
        </ExampleNote>
      ) : null}
    </ModeExample>
  );
};
