import * as React from 'react';

import {
  agentConnectApi,
  type AgentConnectLink,
} from '@/features/profile/agent-connect';

import {
  buildTokenAccessScope,
  createDefaultTokenAccessForm,
  defaultTokenName,
  isTokenAccessFormValid,
  resolveTokenExpiresAt,
  type TokenAccessForm,
} from '../lib/tokenForm';

import { MCP_AGENTS } from './agents';

export type ConnectMode = 'auto' | 'manual';

// Lives above the panel: the same state serves the floating panel and the
// column, so switching the layout neither resets it nor reissues the link.
export const useConnectAgentState = () => {
  const [mode, setMode] = React.useState<ConnectMode>('auto');
  const [agentId, setAgentId] = React.useState(MCP_AGENTS[0]!.id);
  const [name, setName] = React.useState('');
  const [form, setForm] = React.useState<TokenAccessForm>(
    createDefaultTokenAccessForm
  );
  const [link, setLink] = React.useState<AgentConnectLink | null>(null);
  const [isRevealing, setIsRevealing] = React.useState(false);
  const revealRequestRef = React.useRef(0);
  const namePlaceholder = React.useMemo(() => defaultTokenName(), []);

  const hidePrompt = () => {
    revealRequestRef.current += 1;
    setLink(null);
    setIsRevealing(false);
  };

  // The link is short-lived: an expired one must not stay ready to copy.
  React.useEffect(() => {
    if (!link) return undefined;

    const timeoutId = window.setTimeout(
      () => setLink(null),
      new Date(link.expiresAt).getTime() - Date.now()
    );

    return () => window.clearTimeout(timeoutId);
  }, [link]);

  const changeName = (value: string) => {
    setName(value);
    hidePrompt();
  };

  const changeForm = (value: TokenAccessForm) => {
    setForm(value);
    hidePrompt();
  };

  const revealPrompt = async () => {
    const requestId = revealRequestRef.current + 1;
    revealRequestRef.current = requestId;
    setIsRevealing(true);

    try {
      const created = await agentConnectApi.createLink({
        base_url: window.location.origin,
        name: name.trim() || namePlaceholder,
        token_expires_at: resolveTokenExpiresAt(form),
        access_scope: buildTokenAccessScope(form),
      });

      if (requestId === revealRequestRef.current) {
        setLink(created);
      }
    } catch {
      // The gateway client already shows the request error.
    } finally {
      if (requestId === revealRequestRef.current) {
        setIsRevealing(false);
      }
    }
  };

  return {
    mode,
    setMode,
    agentId,
    setAgentId,
    name,
    namePlaceholder,
    changeName,
    form,
    changeForm,
    linkUrl: link?.url ?? null,
    canReveal: !isRevealing && isTokenAccessFormValid(form),
    revealPrompt,
  };
};

export type ConnectAgentState = ReturnType<typeof useConnectAgentState>;
