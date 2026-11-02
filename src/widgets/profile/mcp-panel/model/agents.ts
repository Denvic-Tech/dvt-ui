export const TOKEN_PLACEHOLDER = '<токен>';

export type AgentPalette = {
  buttonBg: string;
  buttonFg: string;
  codeBg: string;
  codeFg: string;
  tokenFg: string;
  tokenWeight: number;
  text: string;
  link: string;
  linkUnderline: boolean;
  inlineFg: string;
  inlineBg: string;
};

export type AgentStep = {
  // Inline code in the text is wrapped in backticks.
  text: string;
  snippet?: string;
};

export type McpAgent = {
  id: string;
  name: string;
  palette: AgentPalette;
  buildSteps: (mcpUrl: string) => AgentStep[];
};

const CLAUDE_PALETTE: AgentPalette = {
  buttonBg: '#FBEEE9',
  buttonFg: '#D97757',
  codeBg: '#FBEEE9',
  codeFg: '#3B2018',
  tokenFg: '#A84A2A',
  tokenWeight: 500,
  text: '#4A3329',
  link: '#A84A2A',
  linkUnderline: false,
  inlineFg: '#A84A2A',
  inlineBg: '#FBEEE9',
};

const AUTHORIZATION_VALUE = `Bearer ${TOKEN_PLACEHOLDER}`;

const buildMcpRemoteArgs = (mcpUrl: string): string =>
  [
    '"mcp-remote"',
    `"${mcpUrl}"`,
    // mcp-remote refuses plain HTTP addresses without this flag.
    ...(mcpUrl.startsWith('http://') ? ['"--allow-http"'] : []),
    '"--header"',
    // Claude Desktop on Windows does not escape spaces in args, so the value
    // with a space goes through env.
    '"Authorization:${AUTH_HEADER}"',
  ].join(', ');

export const MCP_AGENTS: McpAgent[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    palette: CLAUDE_PALETTE,
    buildSteps: mcpUrl => [
      {
        text: 'Выполните команду в терминале:',
        snippet: `claude mcp add --transport http --scope user dvt "${mcpUrl}" --header "Authorization: ${AUTHORIZATION_VALUE}"`,
      },
      {
        text: 'Перезапустите сессию и проверьте подключение командой `/mcp`.',
      },
    ],
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    palette: CLAUDE_PALETTE,
    buildSteps: mcpUrl => [
      { text: 'Откройте Settings → Developer → Edit Config.' },
      {
        text: 'Добавьте сервер в `claude_desktop_config.json`:',
        snippet: `{
  "mcpServers": {
    "dvt": {
      "command": "npx",
      "args": [${buildMcpRemoteArgs(mcpUrl)}],
      "env": { "AUTH_HEADER": "${AUTHORIZATION_VALUE}" }
    }
  }
}`,
      },
      { text: 'Перезапустите Claude Desktop.' },
    ],
  },
  {
    id: 'codex',
    name: 'Codex',
    palette: {
      buttonBg: '#F0F0F0',
      buttonFg: '#0D0D0D',
      codeBg: '#F3F3F3',
      codeFg: '#0D0D0D',
      tokenFg: '#0D0D0D',
      tokenWeight: 700,
      text: '#2B2B2B',
      link: '#0D0D0D',
      linkUnderline: true,
      inlineFg: '#0D0D0D',
      inlineBg: '#F3F3F3',
    },
    buildSteps: mcpUrl => [
      {
        text: 'Добавьте сервер в `~/.codex/config.toml`:',
        snippet: `[mcp_servers.dvt]
url = "${mcpUrl}"
http_headers = { Authorization = "${AUTHORIZATION_VALUE}" }`,
      },
      { text: 'Перезапустите Codex.' },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    palette: {
      buttonBg: '#F7F7F4',
      buttonFg: '#14120B',
      codeBg: '#F7F7F4',
      codeFg: '#14120B',
      tokenFg: '#14120B',
      tokenWeight: 700,
      text: '#26251E',
      link: '#14120B',
      linkUnderline: true,
      inlineFg: '#14120B',
      inlineBg: '#F7F7F4',
    },
    buildSteps: mcpUrl => [
      {
        text: 'Добавьте сервер в файл `~/.cursor/mcp.json`:',
        snippet: `{
  "mcpServers": {
    "dvt": {
      "url": "${mcpUrl}",
      "headers": { "Authorization": "${AUTHORIZATION_VALUE}" }
    }
  }
}`,
      },
      { text: 'Включите сервер `dvt` в разделе Customize.' },
    ],
  },
  {
    id: 'vscode',
    name: 'VS Code',
    palette: {
      buttonBg: '#E6F2FA',
      buttonFg: '#007ACC',
      codeBg: '#E8F3FB',
      codeFg: '#0E2A40',
      tokenFg: '#005A9E',
      tokenWeight: 500,
      text: '#1F2D3A',
      link: '#005A9E',
      linkUnderline: false,
      inlineFg: '#005A9E',
      inlineBg: '#E8F3FB',
    },
    buildSteps: mcpUrl => [
      {
        text: 'Создайте в проекте файл `.vscode/mcp.json`:',
        snippet: `{
  "servers": {
    "dvt": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": { "Authorization": "${AUTHORIZATION_VALUE}" }
    }
  }
}`,
      },
      {
        text: 'Запустите сервер через `MCP: List Servers` в палитре команд.',
      },
    ],
  },
  {
    id: 'other',
    name: 'Другой',
    palette: {
      buttonBg: '#EEF0FF',
      buttonFg: '#5B5BEF',
      codeBg: '#F5F5FF',
      codeFg: '#1B1F2A',
      tokenFg: '#4343D6',
      tokenWeight: 600,
      text: '#1B1F2A',
      link: '#4343D6',
      linkUnderline: false,
      inlineFg: '#4343D6',
      inlineBg: '#F5F5FF',
    },
    buildSteps: mcpUrl => [
      {
        text: 'Добавьте в клиент удалённый MCP-сервер с этими параметрами:',
        snippet: `URL:    ${mcpUrl}
Header: Authorization: ${AUTHORIZATION_VALUE}`,
      },
    ],
  },
];
