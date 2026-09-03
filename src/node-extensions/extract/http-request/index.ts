import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { HTTPRequest } from './ui/HTTPRequest';

const HTTPRequestExtension: NodeExtension = {
  id: 'http_request',
  name: 'HTTP Request',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'HTTPRequest';
  },
  type: 'modal',
  component: HTTPRequest,
};

export default HTTPRequestExtension;
