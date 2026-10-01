import type { Column } from '@/shared/gatewayClient';

export type Operation =
  | 'replace'
  | 'regex'
  | 'timezone'
  | 'period'
  | 'delta'
  | 'split'
  | 'expression';
export type ColumnKind =
  | 'text'
  | 'number'
  | 'datetime'
  | 'boolean'
  | 'timedelta'
  | 'other';
export type Token = { kind: 'name' | 'mask' | 'all'; value: string };
export type Selector = {
  tokens: Token[];
  types?: ColumnKind[];
  exclude?: string[];
  name_regex?: string;
};
export type Pair = {
  old: string | number | boolean | null;
  new: string | number | boolean | null;
};
export type Params = {
  pairs?: Pair[];
  legacy_dictionary?: Record<string, unknown>;
  pattern?: string;
  replacement?: string;
  timezone?: string;
  period?: string;
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  delimiter?: string;
  max_splits?: number;
  drop_source?: boolean;
  expression?: string;
};
export type Rule = {
  id: string;
  enabled?: boolean;
  selector: Selector;
  params: Params;
  output?: {
    mode: 'replace' | 'new';
    suffix?: string;
    names?: Record<string, string>;
    target?: string | null;
    fallback_to_source?: boolean;
    require_target?: boolean;
  };
  skip_incompatible?: boolean;
  compatibility?: 'v1';
  input_bindings?: Record<string, string>;
};
export type CalculatedColumn = {
  name: string;
  expression: string;
  overwrite_existing?: boolean;
  input_bindings?: Record<string, string>;
};
export type ColumnBinding = {
  source: string | null;
  target: string;
  input_bindings?: Record<string, string>;
};
export function withoutBinding<
  T extends { input_bindings?: Record<string, string> },
>(value: T, path: string): T {
  const bindings = { ...value.input_bindings };
  delete bindings[path];
  return { ...value, input_bindings: bindings };
}
export function updatedRule(previous: Rule, next: Rule): Rule {
  const bindings = { ...next.input_bindings };
  for (const path of Object.keys(bindings)) {
    const changed = path.startsWith('selector.')
      ? JSON.stringify(previous.selector.tokens) !==
        JSON.stringify(next.selector.tokens)
      : path.startsWith('output.')
        ? JSON.stringify(previous.output) !== JSON.stringify(next.output)
        : JSON.stringify(previous.params[path.slice(7) as keyof Params]) !==
          JSON.stringify(next.params[path.slice(7) as keyof Params]);
    if (changed) delete bindings[path];
  }
  return { ...next, input_bindings: bindings };
}
export type Values = {
  column_rules?: Rule[] | null;
  calculated_columns?: CalculatedColumn[] | null;
  column_bindings?: ColumnBinding[] | null;
  overwrite_existing?: boolean;
  column_to_replace?: string;
  column?: string;
  column_with_time?: string;
  column_name?: string;
  new_column?: string;
  new_column_with_time?: string;
  dictionary?: Record<string, unknown>;
} & Params;

export const operations: Record<string, Operation> = {
  DataFrameReplaceValues: 'replace',
  DataFrameRegexReplace: 'regex',
  DataFrameSetTimezone: 'timezone',
  DataFrameConvertToPeriodStart: 'period',
  AddTimeDeltaToDataFrame: 'delta',
  DataFrameSplitColumn: 'split',
  DataFrameAddColumnByExpression: 'expression',
};
export const kindLabels: Record<ColumnKind, string> = {
  text: 'Текст',
  number: 'Числа',
  datetime: 'Дата и время',
  boolean: 'Логические',
  timedelta: 'Интервалы',
  other: 'Другие',
};
export const defaults: Record<Operation, Params> = {
  replace: { pairs: [{ old: '', new: '' }] },
  regex: { pattern: '', replacement: '' },
  timezone: { timezone: 'Europe/Moscow' },
  period: { period: 'month' },
  delta: { days: 0 },
  split: { delimiter: '', max_splits: 1, drop_source: false },
  expression: { expression: '__column__' },
};
export const newRule = (operation: Operation): Rule => ({
  id: crypto.randomUUID(),
  enabled: true,
  selector: { tokens: [] },
  params: structuredClone(defaults[operation]),
  output: { mode: 'replace' },
});

export function legacyRule(values: Values, operation: Operation): Rule {
  const rule = newRule(operation);
  rule.id = 'legacy';
  const source =
    values.column_to_replace ??
    values.column ??
    values.column_with_time ??
    values.column_name;
  rule.selector.tokens = source ? [{ kind: 'name', value: source }] : [];
  for (const key of Object.keys(defaults[operation]) as (keyof Params)[]) {
    if (values[key] !== undefined)
      Object.assign(rule.params, { [key]: values[key] });
  }
  if (operation === 'replace' && values.dictionary) {
    rule.params = {
      legacy_dictionary: values.dictionary,
      pairs: Object.entries(values.dictionary).map(([old, value]) => ({
        old,
        new: value == null ? null : String(value),
      })),
    };
  }
  if (operation === 'delta') {
    rule.params = {};
    for (const key of [
      'years',
      'months',
      'days',
      'hours',
      'minutes',
      'seconds',
    ] as const) {
      rule.params[key] = Math.trunc(values[key] ?? 0);
    }
  }
  const target = values.new_column ?? values.new_column_with_time;
  if (target && target !== source && source)
    rule.output = { mode: 'new', names: { [source]: target } };
  return rule;
}

export function kindOf(column: Column): ColumnKind {
  switch (column.dtype) {
    case 'STRING':
      return 'text';
    case 'INT':
    case 'FLOAT':
      return 'number';
    case 'DATETIME':
      return 'datetime';
    case 'BOOLEAN':
      return 'boolean';
    case 'TIMEDELTA':
      return 'timedelta';
    default:
      return 'other';
  }
}

export function maskMatches(mask: string, name: string): boolean {
  const source = [...mask]
    .map(char =>
      char === '*'
        ? '[\\s\\S]*'
        : char === '?'
          ? '[\\s\\S]'
          : char.replace(/[.*+?^{}$()|[\]\\]/g, '\\$&')
    )
    .join('');
  return new RegExp('^' + source + '(?![\\s\\S])', 'u').test(name);
}

export function selectColumns(columns: Column[], selector: Selector): Column[] {
  const regex = selector.name_regex
    ? new RegExp(selector.name_regex, 'u')
    : null;
  return columns.filter(
    column =>
      !selector.exclude?.includes(column.name) &&
      (!selector.types?.length || selector.types.includes(kindOf(column))) &&
      (!regex || regex.test(column.name)) &&
      selector.tokens.some(
        token =>
          token.kind === 'all' ||
          (token.kind === 'name'
            ? token.value === column.name
            : maskMatches(token.value, column.name))
      )
  );
}

export type PreviewRow = {
  source: string;
  dtype: string;
  ruleId: string;
  ruleNumber: number;
  targets: string[];
  skipped: boolean;
};
export function previewRules(
  columns: Column[],
  rules: Rule[],
  operation: Operation
) {
  const claimed = new Set<string>();
  const written = new Set<string>();
  const rows: PreviewRow[] = [];
  const errors: Record<string, string[]> = {};
  const counts: Record<string, { matched: number; applied: number }> = {};
  rules.forEach((rule, index) => {
    if (rule.enabled === false) return;
    const issues: string[] = [];
    const dynamicSource = !!rule.input_bindings?.['selector.tokens.0.value'];
    const dynamicTarget = !!rule.input_bindings?.['output.target'];
    if (!rule.selector.tokens.length && !dynamicSource)
      issues.push('Выберите колонки или введите маску.');
    for (const token of rule.selector.tokens) {
      if (
        token.kind === 'name' &&
        !dynamicSource &&
        !columns.some(col => col.name === token.value)
      )
        issues.push('Колонка «' + token.value + '» отсутствует.');
    }
    let matches: Column[] = [];
    try {
      matches = dynamicSource ? [] : selectColumns(columns, rule.selector);
    } catch {
      issues.push('Проверьте регулярное выражение имени колонки.');
    }
    counts[rule.id] = { matched: matches.length, applied: 0 };
    matches.forEach(column => {
      if (claimed.has(column.name)) return;
      claimed.add(column.name);
      const incompatible =
        operation === 'delta' &&
        rule.compatibility !== 'v1' &&
        kindOf(column) !== 'datetime';
      const skipped = incompatible && !!rule.skip_incompatible;
      if (incompatible && !skipped)
        issues.push('«' + column.name + '»: требуется тип дата/время.');
      const targets =
        operation === 'split'
          ? Array.from(
              {
                length: Math.min(
                  1001,
                  Math.max(1, Number(rule.params.max_splits ?? 1) + 1)
                ),
              },
              (_, i) => column.name + '_' + (i + 1)
            )
          : [
              rule.output?.mode === 'new'
                ? (rule.output.target ??
                  rule.output.names?.[column.name] ??
                  column.name + (rule.output.suffix ?? ''))
                : column.name,
            ];
      if (!skipped) {
        counts[rule.id]!.applied++;
        targets.forEach(target => {
          const replacesSource =
            operation !== 'split' &&
            rule.output?.mode !== 'new' &&
            target === column.name;
          if (
            !dynamicTarget &&
            (!target.trim() ||
              written.has(target) ||
              (!replacesSource &&
                (rule.compatibility !== 'v1' || operation === 'split') &&
                columns.some(col => col.name === target)))
          )
            issues.push('Конфликт имени результата: «' + target + '».');
          written.add(target);
        });
      }
      rows.push({
        source: column.name,
        dtype: column.dtype,
        ruleId: rule.id,
        ruleNumber: index + 1,
        targets,
        skipped,
      });
    });
    const p = rule.params;
    if (
      operation === 'replace' &&
      !p.pairs?.length &&
      p.legacy_dictionary == null &&
      !rule.input_bindings?.['params.legacy_dictionary']
    )
      issues.push('Добавьте замену.');
    if (operation === 'replace' && p.pairs) {
      const keys = p.pairs.map(pair =>
        JSON.stringify([typeof pair.old, pair.old])
      );
      if (new Set(keys).size !== keys.length)
        issues.push('Ключи замены должны быть уникальными.');
    }
    if (
      operation === 'regex' &&
      !p.pattern &&
      rule.compatibility !== 'v1' &&
      !rule.input_bindings?.['params.pattern']
    )
      issues.push('Введите регулярное выражение.');
    if (
      operation === 'timezone' &&
      !p.timezone?.trim() &&
      !rule.input_bindings?.['params.timezone']
    )
      issues.push('Укажите часовой пояс.');
    if (
      operation === 'split' &&
      rule.compatibility !== 'v1' &&
      (!p.delimiter ||
        !Number.isInteger(p.max_splits) ||
        p.max_splits! < 1 ||
        p.max_splits! > 1000)
    )
      issues.push('Укажите разделитель и число разделений от 1 до 1000.');
    if (
      operation === 'expression' &&
      !p.expression?.trim() &&
      !rule.input_bindings?.['params.expression']
    )
      issues.push('Введите выражение.');
    if (issues.length) errors[rule.id] = issues;
  });
  return { rows, errors, counts };
}
export const tokenLabel = (token: Token) =>
  token.kind === 'all'
    ? 'Все колонки'
    : token.value + (token.kind === 'mask' ? ' · маска' : '');
export const ruleSummary = (rule: Rule) =>
  rule.input_bindings?.['selector.tokens.0.value']
    ? 'Колонка из выражения или подключения'
    : [
        rule.selector.tokens.slice(0, 2).map(tokenLabel).join(', '),
        rule.selector.tokens.length > 2
          ? '+' + (rule.selector.tokens.length - 2)
          : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Колонки не выбраны';
export function advancedSummary(rule: Rule): string {
  return [
    rule.selector.types?.length
      ? rule.selector.types.map(type => kindLabels[type]).join(', ')
      : '',
    rule.selector.exclude?.length
      ? 'исключено ' + rule.selector.exclude.length
      : '',
    rule.selector.name_regex ? 'фильтр имени' : '',
    Object.keys(rule.input_bindings ?? {}).length
      ? 'динамические параметры'
      : '',
    rule.compatibility === 'v1' ? 'сохранена прежняя семантика' : '',
    rule.output?.mode === 'new' ? 'новые колонки' : '',
    rule.skip_incompatible ? 'пропуск несовместимых' : '',
    rule.params.drop_source ? 'удаление источников' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export function operationSummary(operation: Operation, params: Params): string {
  if (operation === 'replace') return (params.pairs?.length ?? 0) + ' замен';
  if (operation === 'regex')
    return (
      (params.pattern || 'шаблон не задан') +
      ' → ' +
      (params.replacement || 'пустая строка')
    );
  if (operation === 'timezone') return params.timezone ?? '';
  if (operation === 'period') return params.period ?? '';
  if (operation === 'split')
    return 'разделитель «' + (params.delimiter ?? '') + '»';
  if (operation === 'expression') return params.expression ?? '';
  return (
    Object.entries(params)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => String(value) + ' ' + key)
      .join(', ') || 'без смещения'
  );
}
