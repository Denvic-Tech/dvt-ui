import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { Io } from '@/shared/gatewayClient';

import { ConnectionIDInput } from './ui/ConnectionIDInput';

const CONNECTION_NODE_IO_TYPES: Io[] = [
  'DB_CONNECTION_ID',
  'S3_CONNECTION_ID',
  'FTP_CONNECTION_ID',
  'SMB_CONNECTION_ID',
];

const ConnectionIDInputExtension: NodeExtension = {
  id: 'connection-id-input',
  name: 'Connection ID Input',
  condition: (ctx): boolean => {
    return CONNECTION_NODE_IO_TYPES.includes(ctx.inputDefinition.type as Io);
  },
  type: 'input_definition',
  component: ConnectionIDInput,
};

export default ConnectionIDInputExtension;
