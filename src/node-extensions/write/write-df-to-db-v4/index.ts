import { SettingsSuggest, TableChart, Tune } from '@mui/icons-material';

import { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types';

import {
  confirmWriteModeOnContinue,
  createTableBeforeFinish,
  type ExtensionState,
  isColumnActionsApplyReady,
  isSchemaStrategyStepValid,
  isTargetStepValid,
  isWriteModeStepValid,
  isWriteSettingsStepValid,
  prepareWriteStepOnContinue,
  shouldShowColumnActionsLoadingOverlay,
} from './lib/helpers';
import { ColumnActionsLoadingOverlay } from './ui/ColumnActionsLoadingOverlay';
import { SchemaStrategyStep } from './ui/SchemaStrategyStep';
import { TableSetupStep } from './ui/TableSetupStep';
import { WriteModeStep } from './ui/WriteModeStep';
import { WriteSettingsStep } from './ui/WriteSettingsStep';
import { WriteStepLoadingOverlay } from './ui/WriteSettingsStep/WriteStepLoadingOverlay';

const WriteDataFrameToDBV4Extension: NodeModalStepperExtension<ExtensionState> =
  {
    id: 'write_data_frame_to_db_v4',
    name: 'Write Data Frame To DB V4',
    condition: nodeDefinition => {
      return nodeDefinition.name === 'WriteDataFrameToDBV4';
    },
    type: 'modal_stepper',
    steps: [
      {
        id: 'target-setup',
        label: 'Таблица',
        activeIcon: TableChart,
        component: TableSetupStep,
        condition: isTargetStepValid,
      },
      {
        id: 'schema-strategy',
        label: 'Настройка схемы',
        activeIcon: SettingsSuggest,
        component: SchemaStrategyStep,
        condition: isSchemaStrategyStepValid,
        getContinueLabel: (_inputValues, sharedState) =>
          (sharedState?.selectedColumnActions?.length ?? 0) > 0
            ? 'Применить и продолжить'
            : null,
        onContinue: prepareWriteStepOnContinue,
      },
      {
        id: 'write-mode',
        label: 'Режим записи',
        activeIcon: Tune,
        component: WriteModeStep,
        condition: isWriteModeStepValid,
        loadingCondition: isColumnActionsApplyReady,
        shouldShowLoadingOverlay: shouldShowColumnActionsLoadingOverlay,
        loadingOverlay: ColumnActionsLoadingOverlay,
        onContinue: confirmWriteModeOnContinue,
      },
      {
        id: 'write-settings',
        label: 'Параметры записи',
        activeIcon: Tune,
        component: WriteSettingsStep,
        condition: isWriteSettingsStepValid,
        onBeforeFinish: createTableBeforeFinish,
        finishOverlay: WriteStepLoadingOverlay,
        shouldShowFinishOverlay: (context, isFinishing) =>
          Boolean(
            context.sharedState?.isTableNew &&
            (isFinishing ||
              context.sharedState.isCreateTableLoading ||
              context.sharedState.createTableSuccess ||
              context.sharedState.createTableError)
          ),
      },
    ],
  };

export default WriteDataFrameToDBV4Extension;
