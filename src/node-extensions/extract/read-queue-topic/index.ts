import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { ReadQueueTopic } from './ui/ReadQueueTopic.tsx';

const ReadQueueTopicExtension: NodeExtension = {
  id: 'read_queue_topic',
  name: 'Read Queue Topic',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'ReadQueueTopic';
  },
  type: 'modal',
  component: ReadQueueTopic,
};

export default ReadQueueTopicExtension;
