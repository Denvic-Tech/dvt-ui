import type { AIAnalysisRequest } from '../api/aiAnalysisApi';

export const AI_ANALYSIS_COMPLETED_EVENT = 'ai-analysis:completed';

export const dispatchAIAnalysisCompleted = (item: AIAnalysisRequest) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AIAnalysisRequest>(AI_ANALYSIS_COMPLETED_EVENT, {
      detail: item,
    })
  );
};
