const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return import.meta.env['VITE_API_BASE_URL'] as string;
  }

  return `${window.location.origin}/api`;
};

// Функция для получения URL WebSocket
const getWebSocketUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  // Заменяем http/https на ws/wss и добавляем путь /ws (стандартный для ComfyUI)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Пытаемся получить хост из API URL
  try {
    const url = new URL(apiUrl);
    // Используем тот же хост и порт, что и API
    return `${wsProtocol}//${url.host}/ws`; // Путь /ws - предположение, может отличаться
  } catch (e) {
    console.error('Invalid API Base URL for WebSocket:', apiUrl);
    // Запасной вариант, если API URL некорректный
    const host = window.location.host;
    return `${wsProtocol}//${host}/ws`;
  }
};

const getInactiveTabSuffix = (): string => {
  const rawSuffix = import.meta.env['INACTIVE_TAB_SUFFIX'];

  if (typeof rawSuffix !== 'string') {
    return '';
  }

  return rawSuffix.trim();
};

const config = {
  apiBaseUrl: getApiBaseUrl(),
  webSocketUrl: getWebSocketUrl(), // Добавляем URL WebSocket
  inactiveTabSuffix: getInactiveTabSuffix(),
};

console.info('API Base URL:', config.apiBaseUrl);
console.info('WebSocket URL:', config.webSocketUrl);

export default config;
