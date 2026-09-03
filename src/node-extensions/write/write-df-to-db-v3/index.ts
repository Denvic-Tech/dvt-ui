import { TableChart, Tune } from '@mui/icons-material';

import { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types';

import {
  createTableOnWriteStepEnter,
  type ExtensionState,
  isPrepareStepValid,
  isWriteStepReady,
  prepareWriteStepOnContinue,
} from './lib/helpers';
import { TableSetupStep } from './ui/TableSetupStep';
import { WriteSettingsStep } from './ui/WriteSettingsStep';
import { WriteStepLoadingOverlay } from './ui/WriteSettingsStep/WriteStepLoadingOverlay';

const WriteDataFrameToDBV3Extension: NodeModalStepperExtension<ExtensionState> =
  {
    id: 'write_data_frame_to_db_v3',
    name: 'Write Data Frame To DB V3',
    condition: nodeDefinition => {
      return nodeDefinition.name === 'WriteDataFrameToDBV3';
    },
    type: 'modal_stepper',
    steps: [
      {
        id: 'table-setup',
        label: 'Таблица и SQL',
        activeIcon: TableChart,
        component: TableSetupStep,
        condition: isPrepareStepValid,
        onContinue: prepareWriteStepOnContinue,
      },
      {
        id: 'write-settings',
        label: 'Параметры записи',
        activeIcon: Tune,
        component: WriteSettingsStep,
        onEnter: createTableOnWriteStepEnter,
        loadingCondition: isWriteStepReady,
        loadingOverlay: WriteStepLoadingOverlay,
      },
    ],
  };

export default WriteDataFrameToDBV3Extension;
