import * as React from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import type { NodeMetadata } from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';

import { loadExtensionFrontend } from '../lib/loadExtensionFrontend';

import NodeDefaultEditor from './NodeDefaultEditor';
import type { AnyDict } from './types';

type ExtensionEditorProxyProps = NodeModalExtensionProps<AnyDict> & {
  extensionName: string;
  nodeName: string;
  getConnectedInputMetadata: (inputName: string) => NodeMetadata[string];
};

const getErrorMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Editor для extension-ноды не найден.';
};

export const ExtensionEditorProxy: React.FC<ExtensionEditorProxyProps> = ({
  extensionName,
  nodeName,
  getConnectedInputMetadata,
  ...editorProps
}) => {
  const [EditorComponent, setEditorComponent] =
    React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadEditor = async () => {
      setLoading(true);
      setErrorMessage(null);
      setEditorComponent(null);

      try {
        const registry = await loadExtensionFrontend(extensionName);
        const extensionEditor = registry.editors?.[nodeName] ?? null;

        if (!extensionEditor) {
          return Promise.reject(
            new Error(
              `Editor for node "${nodeName}" was not found in extension "${extensionName}".`
            )
          );
        }

        if (!mounted) {
          return;
        }

        setEditorComponent(() => extensionEditor);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadEditor();

    return () => {
      mounted = false;
    };
  }, [extensionName, nodeName]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack spacing={1.5} alignItems='center'>
          <CircularProgress size={28} />
          <Typography variant='body2' color='text.secondary'>
            Загружаем editor extension-ноды...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (EditorComponent) {
    return (
      <EditorComponent
        {...editorProps}
        nodeID={editorProps.id}
        nodeName={nodeName}
        extensionName={extensionName}
        getConnectedInputMetadata={getConnectedInputMetadata}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity='warning'>
        <Typography fontWeight={600} mb={0.5}>
          Editor для extension-ноды не найден
        </Typography>
        <Typography variant='body2'>
          {errorMessage ??
            `Для ноды "${nodeName}" из расширения "${extensionName}" будет показан стандартный editor.`}
        </Typography>
      </Alert>

      <NodeDefaultEditor {...editorProps} />
    </Stack>
  );
};
