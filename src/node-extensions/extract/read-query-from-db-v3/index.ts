import { Code, Tune } from '@mui/icons-material';

import { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types';

import { ExtensionState } from '@/node-extensions/extract/read-query-from-db-v3/lib/types';

import {
  fetchMetadataOnEnter,
  isMetadataReady,
  isPartitionStepValid,
  isQueryValid,
} from './lib/helpers';
import { PartitionSettingsStep } from './ui/PartitionSettingsStep';
import { QueryEditorStep } from './ui/QueryEditorStep';

const ReadQueryFromDBV3Extension: NodeModalStepperExtension<ExtensionState> = {
  id: 'read_query_from_db_v3',
  name: 'Read Query From DB V3',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'ReadQueryFromDBV3';
  },
  type: 'modal_stepper',
  steps: [
    {
      id: 'query-input',
      label: 'SQL-запрос',
      activeIcon: Code,
      component: QueryEditorStep,
      condition: isQueryValid,
    },
    {
      id: 'partition-settings',
      label: 'Сегментация',
      activeIcon: Tune,
      component: PartitionSettingsStep,
      onEnter: fetchMetadataOnEnter,
      loadingCondition: isMetadataReady,
      condition: isPartitionStepValid,
    },
  ],
};

export default ReadQueryFromDBV3Extension;
