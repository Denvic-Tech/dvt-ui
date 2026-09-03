export interface ColumnOption {
  name: string;
  type: string;
}

export interface OperationOption {
  id: string;
  label: string;
  symbol: string;
}

export interface OperationGroup {
  name: string;
  operations: OperationOption[];
}

export const OPERATION_GROUPS: OperationGroup[] = [
  {
    name: 'Сравнение',
    operations: [
      { id: '==', label: 'Равно', symbol: '=' },
      { id: '!=', label: 'Не равно', symbol: '≠' },
      { id: '<', label: 'Меньше', symbol: '<' },
      { id: '<=', label: '≤ равно', symbol: '≤' },
      { id: '>', label: 'Больше', symbol: '>' },
      { id: '>=', label: '≥ равно', symbol: '≥' },
    ],
  },
  {
    name: 'Текст',
    operations: [
      { id: 'contains', label: 'Содержит', symbol: '∋' },
      { id: 'startswith', label: 'Начало', symbol: 'A..' },
      { id: 'endswith', label: 'Конец', symbol: '..Z' },
    ],
  },
  {
    name: 'Множество',
    operations: [
      { id: 'isin', label: 'Входит', symbol: '∈' },
      { id: 'notin', label: 'Не входит', symbol: '∉' },
    ],
  },
  {
    name: 'NULL',
    operations: [
      { id: 'isnull', label: 'NULL', symbol: '∅' },
      { id: 'notnull', label: 'Не NULL', symbol: '¬∅' },
    ],
  },
];

export const getOperationById = (
  operationId: string
): OperationOption | undefined => {
  for (const group of OPERATION_GROUPS) {
    const operation = group.operations.find(op => op.id === operationId);
    if (operation) {
      return operation;
    }
  }

  return undefined;
};

export const getOperationSymbol = (operationId: string): string =>
  getOperationById(operationId)?.symbol ?? operationId;

export const getOperationLabel = (operationId: string): string =>
  getOperationById(operationId)?.label ?? operationId;

export const getOperationGroupsByOptions = (
  availableOperationIds: string[]
): OperationGroup[] => {
  const allowed = new Set(availableOperationIds);

  return OPERATION_GROUPS.map(group => ({
    ...group,
    operations: group.operations.filter(operation => allowed.has(operation.id)),
  })).filter(group => group.operations.length > 0);
};

export const filterColumns = (
  columns: ColumnOption[],
  searchQuery: string
): ColumnOption[] => {
  if (!searchQuery.trim()) {
    return columns;
  }

  const query = searchQuery.toLowerCase();
  return columns.filter(column => {
    return (
      column.name.toLowerCase().includes(query) ||
      column.type.toLowerCase().includes(query)
    );
  });
};

export const getTypeColor = (dataType: string): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    string: { bg: '#d1fae5', text: '#065f46' },
    int: { bg: '#dbeafe', text: '#1e40af' },
    integer: { bg: '#dbeafe', text: '#1e40af' },
    float: { bg: '#ede9fe', text: '#5b21b6' },
    double: { bg: '#ede9fe', text: '#5b21b6' },
    datetime: { bg: '#fef3c7', text: '#92400e' },
    date: { bg: '#fef3c7', text: '#92400e' },
    timestamp: { bg: '#fef3c7', text: '#92400e' },
    boolean: { bg: '#fce7f3', text: '#9d174d' },
    bool: { bg: '#fce7f3', text: '#9d174d' },
  };

  const typeKey = dataType?.toLowerCase() || 'default';
  return colors[typeKey] ?? { bg: '#f3f4f6', text: '#6b7280' };
};
