import type {
  AiAnalysisCreateSchema,
  AiAnalysisHistoryResponseSchema,
  AiAnalysisReadSchema,
  AiAnalysisStatus,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

export type AIAnalysisStatus = AiAnalysisStatus;

export interface AIAnalysisFinding {
  severity: 'high' | 'medium' | 'low' | string;
  title: string;
  details: string;
  evidence?: string;
  related_node_ids?: string[];
}

export interface AIAnalysisRecommendationAction {
  title: string;
  description: string;
}

export interface AIAnalysisContent {
  summary: string;
  findings: AIAnalysisFinding[];
  risks: string[];
  recommendations: string[];
}

export interface AIAnalysisContext {
  response_language?: string;
  nodes_count?: number;
  edges_count?: number;
  subgraphs_count?: number;
  target_nodes: string[];
  is_truncated: boolean;
}

export interface AIAnalysisResult {
  content: AIAnalysisContent;
  raw_content?: string;
  response_language?: string;
  model?: string;
  openrouter_response_id?: string;
  finish_reason?: string;
  usage?: Record<string, unknown>;
  context?: AIAnalysisContext;
  classification?: string;
  severity?: string;
  details?: string;
  recommended_actions?: AIAnalysisRecommendationAction[];
  bug_report_suggested?: boolean;
  matched_pattern?: string | null;
  source_context_used?: string[];
}

export interface AIAnalysisRequest {
  request_id: string;
  project_id: string;
  task_id: string | null;
  status: AIAnalysisStatus;
  title: string | null;
  result: AIAnalysisResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CreateAIAnalysisPayload {
  task_id: string;
  selected_node_ids?: string[];
}

export interface AIAnalysisHistoryParams {
  limit?: number;
  offset?: number;
  status?: AIAnalysisStatus;
  task_id?: string;
}

export interface AIAnalysisHistoryResponse {
  items: AIAnalysisRequest[];
  total: number;
  limit: number;
  offset: number;
}

const ACCEPT_LANGUAGE_HEADER = { 'Accept-Language': 'ru' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const normalizeFinding = (value: unknown): AIAnalysisFinding | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value['title']);
  const details = asString(value['details']);

  if (!title || !details) {
    return null;
  }

  const severity = asString(value['severity']) ?? 'info';
  const evidence = asString(value['evidence']);
  const relatedNodeIds = asStringArray(value['related_node_ids']);

  return {
    severity,
    title,
    details,
    ...(evidence ? { evidence } : {}),
    ...(relatedNodeIds.length > 0 ? { related_node_ids: relatedNodeIds } : {}),
  };
};

const normalizeContext = (value: unknown): AIAnalysisContext | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const responseLanguage = asString(value['response_language']);
  const nodesCount =
    typeof value['nodes_count'] === 'number' ? value['nodes_count'] : undefined;
  const edgesCount =
    typeof value['edges_count'] === 'number' ? value['edges_count'] : undefined;
  const subgraphsCount =
    typeof value['subgraphs_count'] === 'number'
      ? value['subgraphs_count']
      : undefined;
  const targetNodes = asStringArray(value['target_nodes']);
  const isTruncated = asBoolean(value['is_truncated']) ?? false;

  return {
    target_nodes: targetNodes,
    is_truncated: isTruncated,
    ...(responseLanguage ? { response_language: responseLanguage } : {}),
    ...(nodesCount !== undefined ? { nodes_count: nodesCount } : {}),
    ...(edgesCount !== undefined ? { edges_count: edgesCount } : {}),
    ...(subgraphsCount !== undefined
      ? { subgraphs_count: subgraphsCount }
      : {}),
  };
};

const formatRecommendedAction = (action: AIAnalysisRecommendationAction) =>
  action.title.trim().length > 0
    ? `${action.title}\n${action.description}`
    : action.description;

const normalizeRecommendedActions = (
  value: unknown
): AIAnalysisRecommendationAction[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (!isRecord(item)) {
        return null;
      }

      const description = asString(item['description']);

      if (!description) {
        return null;
      }

      return {
        title: asString(item['title']) ?? '',
        description,
      } satisfies AIAnalysisRecommendationAction;
    })
    .filter((item): item is AIAnalysisRecommendationAction => item !== null);
};

const normalizeLegacyResult = (
  result: Record<string, unknown>
): AIAnalysisResult | null => {
  const content = result['content'];

  if (!isRecord(content)) {
    return null;
  }

  const summary = asString(content['summary']);

  if (!summary) {
    return null;
  }

  const findings = Array.isArray(content['findings'])
    ? content['findings']
        .map(normalizeFinding)
        .filter((item): item is AIAnalysisFinding => item !== null)
    : [];
  const risks = asStringArray(content['risks']);
  const recommendations = asStringArray(content['recommendations']);
  const rawContent = asString(result['raw_content']);
  const responseLanguage = asString(result['response_language']);
  const model = asString(result['model']);
  const openRouterResponseId = asString(result['openrouter_response_id']);
  const finishReason = asString(result['finish_reason']);
  const usage = isRecord(result['usage']) ? result['usage'] : undefined;
  const context = normalizeContext(result['context']);

  return {
    content: {
      summary,
      findings,
      risks,
      recommendations,
    },
    ...(rawContent ? { raw_content: rawContent } : {}),
    ...(responseLanguage ? { response_language: responseLanguage } : {}),
    ...(model ? { model } : {}),
    ...(openRouterResponseId
      ? { openrouter_response_id: openRouterResponseId }
      : {}),
    ...(finishReason ? { finish_reason: finishReason } : {}),
    ...(usage ? { usage } : {}),
    ...(context ? { context } : {}),
  };
};

const normalizeFlatResult = (
  result: Record<string, unknown>
): AIAnalysisResult | null => {
  const summary = asString(result['summary']);

  if (!summary) {
    return null;
  }

  const classification = asString(result['classification']);
  const details = asString(result['details']);
  const severity = asString(result['severity']) ?? 'info';
  const matchedPattern = asString(result['matched_pattern']) ?? null;
  const recommendedActions = normalizeRecommendedActions(
    result['recommended_actions']
  );
  const sourceContextUsed = asStringArray(result['source_context_used']);
  const bugReportSuggested = asBoolean(result['bug_report_suggested']) ?? false;
  const findingEvidence = matchedPattern
    ? `Matched pattern: ${matchedPattern}`
    : undefined;
  const synthesizedFinding =
    details || classification || matchedPattern
      ? [
          {
            severity,
            title: classification
              ? `Классификация: ${classification}`
              : 'Детали анализа',
            details: details ?? summary,
            ...(findingEvidence ? { evidence: findingEvidence } : {}),
          },
        ]
      : [];
  const responseLanguage = asString(result['response_language']);
  const model = asString(result['model']);
  const openRouterResponseId = asString(result['openrouter_response_id']);
  const finishReason = asString(result['finish_reason']);
  const usage = isRecord(result['usage']) ? result['usage'] : undefined;
  const context = normalizeContext(result['context']);

  return {
    content: {
      summary,
      findings: synthesizedFinding,
      risks: bugReportSuggested
        ? ['Анализ рекомендует завести bug report.']
        : [],
      recommendations: recommendedActions.map(formatRecommendedAction),
    },
    ...(responseLanguage ? { response_language: responseLanguage } : {}),
    ...(model ? { model } : {}),
    ...(openRouterResponseId
      ? { openrouter_response_id: openRouterResponseId }
      : {}),
    ...(finishReason ? { finish_reason: finishReason } : {}),
    ...(usage ? { usage } : {}),
    ...(context ? { context } : {}),
    ...(classification ? { classification } : {}),
    severity,
    ...(details ? { details } : {}),
    recommended_actions: recommendedActions,
    bug_report_suggested: bugReportSuggested,
    matched_pattern: matchedPattern,
    source_context_used: sourceContextUsed,
  };
};

const normalizeResult = (
  result: AiAnalysisReadSchema['result']
): AIAnalysisResult | null => {
  if (!isRecord(result)) {
    return null;
  }

  return normalizeLegacyResult(result) ?? normalizeFlatResult(result);
};

const normalizeRead = (item: AiAnalysisReadSchema): AIAnalysisRequest => ({
  request_id: item.request_id,
  project_id: item.project_id,
  task_id: null,
  status: item.status,
  title: item.title,
  result: normalizeResult(item.result),
  error: item.error,
  created_at: item.created_at,
  updated_at: item.updated_at,
  started_at: item.started_at,
  finished_at: item.finished_at,
});

const normalizeHistory = (
  response: AiAnalysisHistoryResponseSchema
): AIAnalysisHistoryResponse => ({
  ...response,
  items: response.items.map(item => ({
    ...item,
    result: null,
  })),
});

export const aiAnalysisApi = {
  async create(projectId: string, payload: CreateAIAnalysisPayload) {
    const response = await client.projects
      .projectId(projectId)
      .ai.analyze.post({
        body: payload satisfies AiAnalysisCreateSchema,
        headers: ACCEPT_LANGUAGE_HEADER,
      });

    const now = new Date().toISOString();

    return {
      request_id: response.data.request_id,
      project_id: projectId,
      task_id: payload.task_id,
      status: response.data.status,
      title: null,
      result: null,
      error: null,
      created_at: now,
      updated_at: now,
      started_at: null,
      finished_at: null,
    } satisfies AIAnalysisRequest;
  },

  async getById(projectId: string, requestId: string) {
    const response = await client.projects
      .projectId(projectId)
      .ai.analyze.requestId(requestId)
      .get();

    return normalizeRead(response.data);
  },

  async getHistory(projectId: string, params: AIAnalysisHistoryParams = {}) {
    const response = await client.projects.projectId(projectId).ai.analyze.get({
      query: { limit: 20, offset: 0, ...params },
    });

    return normalizeHistory(response.data);
  },
};
