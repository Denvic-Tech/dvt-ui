import { SettingsSuggest, TableChart, Tune } from '@mui/icons-material';

import { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types';

import {
  confirmWriteModeOnContinue,
  createTableBeforeFinish,
  dismissCreateTableError,
  type ExtensionState,
  getPendingColumnActions,
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
    dialogSize: { width: 1180, height: 720 },
    fullBleed: true,
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
          getPendingColumnActions(sharedState).length > 0
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
        // На экране ошибки «Назад» ведёт на «Настройка схемы», как и ссылка.
        canGoBackFromOverlay: context =>
          Boolean(context.sharedState?.applyColumnActionsError?.trim()),
        onContinue: confirmWriteModeOnContinue,
      },
      {
        id: 'write-settings',
        label: 'Параметры записи',
        activeIcon: Tune,
        component: WriteSettingsStep,
        condition: isWriteSettingsStepValid,
        // Для новой таблицы «Сохранить» сначала создаёт её в базе.
        getContinueLabel: (_inputValues, sharedState) =>
          sharedState?.isTableNew ? 'Применить и сохранить' : null,
        onBeforeFinish: createTableBeforeFinish,
        finishOverlay: WriteStepLoadingOverlay,
        // На экране ошибки «Назад» возвращает к форме этого шага, как и ссылка.
        canGoBackFromOverlay: context =>
          Boolean(context.sharedState?.createTableError?.trim()),
        onBackFromOverlay: dismissCreateTableError,
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
