import type {
  ConflictDecision,
  ConnectionDecisionAction,
  ConnectionDecisionSchema,
  ConnectionPreviewSchema,
  ImportPreviewSchema,
  ImportRequestSchema,
  MergeStrategy,
  ProjectVariableBase,
  VariableDecisionSchema,
} from '@/shared/gatewayClient';

export type ImportTarget =
  | { mode: 'create'; folderId: string | null }
  | { mode: 'merge'; projectId: string };

export type ConnectionDecisionState = {
  action: ConnectionDecisionAction;
  /** ID существующего подключения для `use_existing` */
  connectionId: string | null;
  /** JSON-объект секретов для `create` (пустая строка — секреты не передаются) */
  secretsText: string;
};

export type VariableDecisionState = {
  /** Текстовое представление значения (см. `formatVariableValue`) */
  valueText: string;
  /** `null` — пользователь не выбирал решение по конфликту */
  conflict: ConflictDecision | null;
};

export type ScheduleDecisionState = {
  importSchedule: boolean;
  enable: boolean;
  conflict: ConflictDecision;
};

export type ImportDecisionsState = {
  passphrase: string;
  mergeStrategy: MergeStrategy | null;
  connections: Record<string, ConnectionDecisionState>;
  /** project_ref -> key -> состояние */
  variables: Record<string, Record<string, VariableDecisionState>>;
  schedule: ScheduleDecisionState;
};

export type ImportRequestIssue = {
  field: string;
  message: string;
};

export type BuildImportRequestResult = {
  request: ImportRequestSchema;
  issues: ImportRequestIssue[];
};

export const DEFAULT_CONNECTION_DECISION: ConnectionDecisionState = {
  action: 'skip',
  connectionId: null,
  secretsText: '',
};

export const DEFAULT_SCHEDULE_DECISION: ScheduleDecisionState = {
  importSchedule: false,
  enable: false,
  conflict: 'keep',
};

const isPlainStringVariable = (
  value: ProjectVariableBase | null | undefined
): boolean => value?.type === 'STRING' && !value.is_list_type;

/**
 * Текстовое представление значения переменной для поля ввода.
 * Строковые скалярные переменные показываются как есть, остальное — как JSON.
 */
export const formatVariableValue = (
  value: ProjectVariableBase | null | undefined
): string => {
  if (!value) {
    return '';
  }

  if (isPlainStringVariable(value)) {
    if (typeof value.value === 'string') {
      return value.value;
    }
    return value.value == null ? '' : String(value.value);
  }

  if (value.value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value.value);
  } catch {
    return String(value.value);
  }
};

/**
 * Обратное преобразование текста поля в `ProjectVariableBase` с сохранением
 * типа и `is_list_type` исходной переменной.
 */
export const parseVariableValue = (
  text: string,
  base: ProjectVariableBase
): { value: ProjectVariableBase } | { error: string } => {
  if (isPlainStringVariable(base)) {
    return { value: { ...base, value: text } };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { value: { ...base, value: null } };
  }

  try {
    return { value: { ...base, value: JSON.parse(trimmed) } };
  } catch {
    return { error: 'Значение должно быть корректным JSON' };
  }
};

/**
 * Решение по умолчанию для подключения из архива: создать новое. Если
 * создавать подключения этого типа нельзя, сопоставляем с существующим
 * подключением с тем же именем, а без него — пропускаем.
 */
export const getDefaultConnectionDecision = (
  connection: ConnectionPreviewSchema
): ConnectionDecisionState => {
  if (!connection.inaccessible) {
    return { ...DEFAULT_CONNECTION_DECISION, action: 'create' };
  }
  const sameName = connection.candidates?.find(
    candidate =>
      candidate.type === connection.type && candidate.name === connection.name
  );
  return sameName
    ? {
        ...DEFAULT_CONNECTION_DECISION,
        action: 'use_existing',
        connectionId: sameName.id,
      }
    : { ...DEFAULT_CONNECTION_DECISION };
};

/**
 * Начальное состояние решений по preview: подключения создаются заново
 * (см. `getDefaultConnectionDecision`), граф добавляется рядом с текущим,
 * переменные берутся из бандла, расписание не импортируется.
 */
export const createInitialDecisions = (
  preview: ImportPreviewSchema
): ImportDecisionsState => {
  const connections: Record<string, ConnectionDecisionState> = {};
  for (const connection of preview.connections) {
    connections[connection.ref] = getDefaultConnectionDecision(connection);
  }

  const variables: Record<string, Record<string, VariableDecisionState>> = {};
  for (const project of preview.projects) {
    const projectVariables: Record<string, VariableDecisionState> = {};
    for (const variable of project.variables) {
      projectVariables[variable.key] = {
        valueText: formatVariableValue(variable.value),
        conflict: null,
      };
    }
    variables[project.ref] = projectVariables;
  }

  return {
    passphrase: '',
    mergeStrategy: 'append',
    connections,
    variables,
    schedule: { ...DEFAULT_SCHEDULE_DECISION },
  };
};

const parseSecrets = (
  text: string
): { secrets: Record<string, unknown> | null } | { error: string } => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { secrets: null };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { error: 'Секреты должны быть JSON-объектом' };
    }
    return { secrets: parsed as Record<string, unknown> };
  } catch {
    return { error: 'Секреты должны быть корректным JSON-объектом' };
  }
};

/**
 * Собирает `ImportRequestSchema` из решений пользователя.
 * В `variables` попадают только изменённые значения и/или явно выбранный
 * `overwrite`; подключения с действием `skip` не отправляются.
 */
export const buildImportRequest = (
  target: ImportTarget,
  preview: ImportPreviewSchema,
  decisions: ImportDecisionsState
): BuildImportRequestResult => {
  const issues: ImportRequestIssue[] = [];
  const passphrase = decisions.passphrase.trim();
  const connections: Record<string, ConnectionDecisionSchema> = {};
  const variables: Record<string, Record<string, VariableDecisionSchema>> = {};

  const request: ImportRequestSchema = {
    mode: target.mode,
    folder_id: target.mode === 'create' ? target.folderId : null,
    project_id: target.mode === 'merge' ? target.projectId : null,
    merge_strategy:
      target.mode === 'merge'
        ? (decisions.mergeStrategy ?? 'append')
        : 'append',
    passphrase: passphrase.length > 0 ? passphrase : null,
    connections,
    variables,
    schedule: {
      import_schedule: false,
      enable: false,
      conflict: 'keep',
    },
  };

  if (
    target.mode === 'merge' &&
    preview.target_has_graph &&
    !decisions.mergeStrategy
  ) {
    issues.push({
      field: 'merge_strategy',
      message: 'Выберите стратегию импорта в текущий проект',
    });
  }

  for (const connection of preview.connections) {
    const decision = decisions.connections[connection.ref];
    if (!decision || decision.action === 'skip') {
      continue;
    }

    if (decision.action === 'use_existing') {
      if (!decision.connectionId) {
        issues.push({
          field: `connections.${connection.ref}`,
          message: `Подключение «${connection.name}»: выберите существующее подключение`,
        });
        continue;
      }
      connections[connection.ref] = {
        action: 'use_existing',
        connection_id: decision.connectionId,
      };
      continue;
    }

    if (connection.inaccessible) {
      issues.push({
        field: `connections.${connection.ref}`,
        message: `Подключение «${connection.name}» недоступно для создания`,
      });
      continue;
    }

    const schema: ConnectionDecisionSchema = { action: 'create' };
    const secretsFromBundle =
      connection.has_secrets_in_bundle && passphrase.length > 0;
    if (!secretsFromBundle) {
      const parsed = parseSecrets(decision.secretsText);
      if ('error' in parsed) {
        issues.push({
          field: `connections.${connection.ref}`,
          message: `Подключение «${connection.name}»: ${parsed.error}`,
        });
        continue;
      }
      if (parsed.secrets) {
        schema.secrets = parsed.secrets;
      }
    }
    connections[connection.ref] = schema;
  }

  for (const project of preview.projects) {
    const projectDecisions = decisions.variables[project.ref];
    if (!projectDecisions) {
      continue;
    }

    const projectVariables: Record<string, VariableDecisionSchema> = {};
    for (const variable of project.variables) {
      const decision = projectDecisions[variable.key];
      if (!decision) {
        continue;
      }

      const entry: VariableDecisionSchema = {};
      const originalText = formatVariableValue(variable.value);
      if (variable.value && decision.valueText !== originalText) {
        const parsed = parseVariableValue(decision.valueText, variable.value);
        if ('error' in parsed) {
          issues.push({
            field: `variables.${project.ref}.${variable.key}`,
            message: `Переменная «${variable.key}» (${project.name}): ${parsed.error}`,
          });
          continue;
        }
        entry.value = parsed.value;
      }

      if (
        target.mode === 'merge' &&
        variable.conflicts_with_existing &&
        decision.conflict === 'overwrite'
      ) {
        entry.conflict = 'overwrite';
      }

      if (entry.value !== undefined || entry.conflict !== undefined) {
        projectVariables[variable.key] = entry;
      }
    }

    if (Object.keys(projectVariables).length > 0) {
      variables[project.ref] = projectVariables;
    }
  }

  const bundleHasSchedule = preview.projects.some(
    project => project.has_schedule_in_bundle
  );
  if (
    bundleHasSchedule &&
    preview.can_manage_schedules &&
    decisions.schedule.importSchedule
  ) {
    const hasExistingSchedule =
      target.mode === 'merge' &&
      preview.projects.some(project => project.has_existing_schedule);
    request.schedule = {
      import_schedule: true,
      enable: decisions.schedule.enable,
      conflict: hasExistingSchedule ? decisions.schedule.conflict : 'keep',
    };
  }

  return { request, issues };
};
