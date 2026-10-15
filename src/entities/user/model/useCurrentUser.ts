import * as React from 'react';

import type { UserReadSchema } from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

let cachedCurrentUser: UserReadSchema | null = null;
let hasResolvedCurrentUser = false;

/**
 * Forget the cached profile. Must be called whenever the session changes
 * (sign in / sign out); otherwise the next account briefly inherits the
 * previous user's role and role-gated UI fires requests it is not allowed to.
 */
export const resetCurrentUserCache = () => {
  cachedCurrentUser = null;
  hasResolvedCurrentUser = false;
};

export const useCurrentUser = () => {
  const [user, setUser] = React.useState<UserReadSchema | null>(
    cachedCurrentUser
  );
  const [loading, setLoading] = React.useState(!hasResolvedCurrentUser);

  const loadUser = React.useCallback(
    async (options?: { silent?: boolean }): Promise<UserReadSchema | null> => {
      if (!hasResolvedCurrentUser) {
        setLoading(true);
      }

      try {
        const response = await client.user.info.get(undefined, {
          silent: options?.silent ?? false,
        });
        cachedCurrentUser = response.data;
        hasResolvedCurrentUser = true;
        setUser(response.data);
        return response.data;
      } catch {
        hasResolvedCurrentUser = true;
        setUser(cachedCurrentUser);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    void loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    reload: loadUser,
  } as const;
};
