import * as React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import * as MUI from '@mui/material';

import { fileStorageHostCapabilities } from '@/app/extensions/public/fileStorage.tsx';
import { repackS3ParquetHostCapabilities } from '@/app/extensions/public/repackS3Parquet.ts';
import { ExtensionHost } from '@/app/extensions/types.ts';

import { PrimitiveNodeInput } from '@/features/node/use-universal-node-data-input/ui/inputs';

import { client } from '@/shared/gatewayClient';
import { makeConst } from '@/shared/lib/node-input-values';

export const host: ExtensionHost = {
  version: '1',
  react: React,
  ui: {
    mui: MUI,
    icons: {
      Link: LinkIcon,
      Settings: SettingsIcon,
      ViewColumn: ViewColumnIcon,
    },
    components: {
      PrimitiveNodeInput,
    },
  },
  capabilities: {
    fileStorage: fileStorageHostCapabilities,
    nodes: {
      repackS3Parquet: repackS3ParquetHostCapabilities,
    },
  },
  utils: {
    makeConst,
  },
  client,
};
