import { TablePathButton } from './SchemaStep.styles';

type TablePathChipProps = {
  /** Путь до таблицы: база и схема (без самой таблицы). */
  parents: readonly string[];
  tableName: string;
  countLabel: string;
  onClick?: (() => void) | undefined;
};

const TablePathIcon = () => (
  <svg
    className='path-icon'
    width='14'
    height='14'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.4'
    aria-hidden='true'
  >
    <rect x='2' y='2.5' width='12' height='11' rx='2' />
    <path d='M2 6.5h12M6 6.5v7' />
  </svg>
);

/** Путь выбранной таблицы; клик возвращает к выбору таблицы (шаг 1). */
export const TablePathChip = ({
  parents,
  tableName,
  countLabel,
  onClick,
}: TablePathChipProps) => {
  const parentPath = parents.join(' / ');
  const fullPath = [...parents, tableName].join(' / ');
  return (
    <TablePathButton
      type='button'
      title='Сменить таблицу — вернуться к шагу 1'
      aria-label={`Таблица ${fullPath}. Сменить таблицу`}
      disabled={!onClick}
      onClick={onClick}
    >
      <TablePathIcon />
      {parentPath ? (
        <>
          <span className='path-parent'>{parentPath}</span>
          <span className='path-separator'>/</span>
        </>
      ) : null}
      <span className='path-name'>{tableName}</span>
      <span className='path-dot' aria-hidden='true' />
      <span className='path-count'>{countLabel}</span>
    </TablePathButton>
  );
};
