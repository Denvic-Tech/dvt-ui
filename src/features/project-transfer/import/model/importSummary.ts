import type {
  ImportPreviewSchema,
  ImportResultSchema,
  MergeStrategy,
} from '@/shared/gatewayClient';

import type {
  ImportDecisionsState,
  ImportTarget,
} from '../../lib/importRequest';
import { pluralRu } from '../../lib/pluralRu';

export type ImportSummary = {
  type: 'success' | 'warning';
  title: string;
  description: string;
};

const describeMerge = (nodes: number, strategy: MergeStrategy | null) => {
  const noun = pluralRu(nodes, ['нода', 'ноды', 'нод']);
  const single = nodes % 10 === 1 && nodes % 100 !== 11;
  const verb =
    strategy === 'replace'
      ? single
        ? 'заменила текущий граф'
        : 'заменили текущий граф'
      : single
        ? 'добавлена в проект'
        : 'добавлены в проект';
  return `${nodes} ${noun} ${verb}`;
};

/**
 * Текст уведомления об успешном импорте: что импортировано, что требует
 * внимания (подключения без секретов, пропущенные подключения) и
 * предупреждения сервера.
 */
export const buildImportSummary = (
  mode: ImportTarget['mode'],
  preview: ImportPreviewSchema,
  decisions: ImportDecisionsState,
  result: ImportResultSchema
): ImportSummary => {
  const projectNames = new Map(
    preview.projects.map(project => [project.ref, project.name])
  );
  const importedRefs = Object.keys(result.project_ids ?? {});
  const nodes = preview.projects.reduce(
    (sum, project) => sum + project.node_count,
    0
  );
  const createdFolders = Object.keys(result.folder_ids ?? {}).length;

  const title =
    mode === 'merge'
      ? 'Граф импортирован'
      : importedRefs.length === 1
        ? 'Проект импортирован'
        : 'Проекты импортированы';

  const details =
    mode === 'merge'
      ? describeMerge(nodes, decisions.mergeStrategy)
      : [
          importedRefs.map(ref => projectNames.get(ref) ?? ref).join(', '),
          createdFolders > 0 ? `папок: ${createdFolders}` : '',
        ]
          .filter(Boolean)
          .join(' · ');

  const skipped = result.skipped_connection_refs?.length ?? 0;
  const noSecrets =
    preview.manifest.has_secrets &&
    decisions.passphrase.trim().length === 0 &&
    preview.connections.some(
      connection =>
        connection.has_secrets_in_bundle &&
        decisions.connections[connection.ref]?.action === 'create'
    );

  const notes = [
    noSecrets
      ? 'Новые подключения созданы без паролей и токенов — укажите их в настройках подключений.'
      : '',
    skipped > 0
      ? `Не импортировано подключений: ${skipped}. Ноды, которые их используют, потребуют настройки.`
      : '',
  ].filter(Boolean);
  const warnings = (result.warnings ?? []).map(warning => warning.message);

  const sentences = [details, ...notes, ...warnings]
    .filter(Boolean)
    .map(text => (/[.!?…]$/.test(text) ? text : `${text}.`));

  return {
    type: notes.length > 0 || warnings.length > 0 ? 'warning' : 'success',
    title,
    description: sentences.join(' '),
  };
};
