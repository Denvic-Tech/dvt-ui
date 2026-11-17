import { useEffect, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';

import { client, type UserReadSchema } from '@/shared/gatewayClient';

import { ProtectedUpdatePanel } from './ProtectedUpdatePanel';
import { SystemUpdatePanel } from './SystemUpdatePanel';

export function OperatorUpdatePanel({
  currentUser,
}: {
  currentUser: UserReadSchema | null;
}) {
  const [origin, setOrigin] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client.update.manager
      .get(undefined, { silent: true })
      .then(({ data }) => {
        if (!cancelled) setOrigin(data.origin);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Alert severity='error'>
        Не удалось получить адрес мастера обновлений.
      </Alert>
    );
  }
  if (origin === undefined) return <CircularProgress size={24} />;
  if (origin === null) return <SystemUpdatePanel currentUser={currentUser} />;
  return <ProtectedUpdatePanel managerOrigin={origin} />;
}
