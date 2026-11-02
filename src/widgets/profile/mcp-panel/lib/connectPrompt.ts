export const CONNECT_PROMPT_INTRO =
  'Подключи MCP-сервер DVT (Denvic Visual Transformer) к этому клиенту по инструкции:';
export const CONNECT_PROMPT_FALLBACK =
  'Если веб-инструмент не открывает адрес, запроси документ через curl.';

export const buildConnectPrompt = (url: string): string =>
  [CONNECT_PROMPT_INTRO, url, CONNECT_PROMPT_FALLBACK].join('\n\n');
