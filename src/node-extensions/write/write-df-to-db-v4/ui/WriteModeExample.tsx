import {
  ExampleColumn,
  ExampleCount,
  ExampleGrid,
  ExampleHeadRow,
  ExampleLabel,
  ExampleOperator,
  ExampleRow,
  type ExampleRowTone,
  ExampleTable,
} from './WriteModeStep.styles';

type ExampleRecord = {
  id: string;
  sku: string;
  amount: string;
  tone?: ExampleRowTone;
  previousAmount?: string;
};

type ExampleCounter = {
  tone: 'added' | 'removed' | 'updated';
  label: string;
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

const withTone = (rows: ExampleRecord[], tone: ExampleRowTone) =>
  rows.map(row => ({ ...row, tone }));

const EXAMPLES: Record<
  string,
  { rows: ExampleRecord[]; counters: ExampleCounter[] }
> = {
  append: {
    rows: [
      ...withTone(CURRENT_ROWS, 'keep'),
      ...withTone(INCOMING_ROWS, 'added'),
    ],
    counters: [{ tone: 'added', label: '3 добавлено' }],
  },
  truncate: {
    rows: [
      ...withTone(CURRENT_ROWS, 'removed'),
      ...withTone(INCOMING_ROWS, 'added'),
    ],
    counters: [
      { tone: 'removed', label: '3 удалено' },
      { tone: 'added', label: '3 добавлено' },
    ],
  },
  upsert: {
    rows: [
      ...withTone(CURRENT_ROWS.slice(0, 2), 'keep'),
      {
        ...INCOMING_ROWS[0],
        tone: 'updated',
        previousAmount: CURRENT_ROWS[2].amount,
      },
      ...withTone(INCOMING_ROWS.slice(1), 'added'),
    ],
    counters: [
      { tone: 'updated', label: '1 обновлено' },
      { tone: 'added', label: '2 добавлено' },
    ],
  },
};

const SampleTable = ({
  title,
  rows,
  counters,
}: {
  title: string;
  rows: ExampleRecord[];
  counters?: ExampleCounter[];
}) => (
  <ExampleColumn>
    <ExampleLabel>
      <span>{title}</span>
      {counters?.length ? (
        <>
          <span style={{ flex: 1 }} />
          {counters.map(counter => (
            <ExampleCount key={counter.tone} tone={counter.tone}>
              {counter.label}
            </ExampleCount>
          ))}
        </>
      ) : null}
    </ExampleLabel>
    <ExampleTable role='table' aria-label={title}>
      <ExampleHeadRow role='row'>
        <span role='columnheader'>id</span>
        <span role='columnheader'>sku</span>
        <span role='columnheader' className='example-amount'>
          amount
        </span>
      </ExampleHeadRow>
      {rows.map((row, index) => (
        <ExampleRow
          key={`${row.id}-${index}`}
          role='row'
          tone={row.tone ?? 'keep'}
          data-first-row={index === 0}
        >
          <span role='cell'>{row.id}</span>
          <span role='cell'>{row.sku}</span>
          <span role='cell' className='example-amount'>
            {row.previousAmount ? (
              <span className='example-old-value'>{row.previousAmount}</span>
            ) : null}
            <span className='example-new-value'>{row.amount}</span>
          </span>
        </ExampleRow>
      ))}
    </ExampleTable>
  </ExampleColumn>
);

/** Статичная иллюстрация режима записи на условных данных. */
export const WriteModeExample = ({ mode }: { mode: string }) => {
  const example = EXAMPLES[mode];
  if (!example) return null;

  return (
    <ExampleGrid role='group' aria-label='Пример на условных данных'>
      <SampleTable title='Таблица сейчас' rows={CURRENT_ROWS} />
      <ExampleOperator aria-hidden='true'>+</ExampleOperator>
      <SampleTable title='DF' rows={INCOMING_ROWS} />
      <ExampleOperator aria-hidden='true'>=</ExampleOperator>
      <SampleTable
        title='Результат'
        rows={example.rows}
        counters={example.counters}
      />
    </ExampleGrid>
  );
};
