import { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { TableChart, Tune } from '@mui/icons-material';

import { TableSetupStep } from './ui/TableSetupStep.tsx';
import { WriteSettingsStep } from './ui/WriteSettingsStep.tsx';
import { WriteStepLoadingOverlay } from './ui/WriteStepLoadingOverlay.tsx';
import {
  createTableOnWriteStepEnter,
  isWriteStepReady,
  isPrepareStepValid,
  prepareWriteStepOnContinue,
  type ExtensionState,
} from './lib/helpers.ts';

const WriteDataFrameToDBV2Extension: NodeModalStepperExtension<ExtensionState> =
  {
    id: 'write_data_frame_to_db_v2',
    name: 'Write Data Frame To DB V2',
    condition: nodeDefinition => {
      return nodeDefinition.name === 'WriteDataFrameToDBV2';
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

export default WriteDataFrameToDBV2Extension;
