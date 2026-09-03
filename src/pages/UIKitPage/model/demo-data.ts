type DemoOption = {
  description: string;
  keywords: string[];
  label: string;
  value: string;
};

type ReviewRow = {
  healthLabel: string;
  healthTone: 'destructive' | 'success' | 'warning';
  id: string;
  owner: string;
  records: string;
  updatedAt: string;
};

export const projectOptions: DemoOption[] = [
  {
    label: 'Customer 360 Refresh',
    value: 'customer-360',
    description: 'Ночная синхронизация для продуктовой аналитики.',
    keywords: ['etl', 'production', 'nightly'],
  },
  {
    label: 'Finance Pulse',
    value: 'finance-pulse',
    description: 'Финансовые дашборды и контроль выплат.',
    keywords: ['finance', 'dashboard'],
  },
  {
    label: 'Marketing Events',
    value: 'marketing-events',
    description: 'События маркетинга и склейка рекламных данных.',
    keywords: ['marketing', 'events'],
  },
];

export const userOptions: DemoOption[] = [
  {
    label: 'Alice Johnson',
    value: 'alice',
    description: 'Лид продуктовой аналитики',
    keywords: ['owner', 'analytics'],
  },
  {
    label: 'Marcus Lee',
    value: 'marcus',
    description: 'Инженер платформы',
    keywords: ['platform', 'engineering'],
  },
  {
    label: 'Priya Raman',
    value: 'priya',
    description: 'Куратор данных',
    keywords: ['data', 'quality'],
  },
];

export const dataframeFieldOptions: DemoOption[] = [
  {
    label: 'customer_id',
    value: 'customer_id',
    description: 'Основной идентификатор клиента',
    keywords: ['id', 'primary'],
  },
  {
    label: 'lifetime_value',
    value: 'lifetime_value',
    description: 'FLOAT • допускает пустые значения',
    keywords: ['metric', 'float'],
  },
  {
    label: 'segment_name',
    value: 'segment_name',
    description: 'STRING • категориальный признак',
    keywords: ['dimension', 'string'],
  },
  {
    label: 'last_seen_at',
    value: 'last_seen_at',
    description: 'DATETIME • индексировано',
    keywords: ['datetime', 'index'],
  },
];

export const reviewRows: ReviewRow[] = [
  {
    id: 'SEG-1001',
    owner: 'Alice Johnson',
    healthLabel: 'Стабильно',
    healthTone: 'success',
    updatedAt: '2 мин назад',
    records: '124k',
  },
  {
    id: 'FIN-2024',
    owner: 'Marcus Lee',
    healthLabel: 'Нужно ревью',
    healthTone: 'warning',
    updatedAt: '18 мин назад',
    records: '42k',
  },
  {
    id: 'MKT-733',
    owner: 'Priya Raman',
    healthLabel: 'Задержка',
    healthTone: 'destructive',
    updatedAt: '1 час назад',
    records: '310k',
  },
];
