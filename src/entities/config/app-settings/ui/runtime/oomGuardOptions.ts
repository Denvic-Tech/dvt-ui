import { createDefaultOomGuardSettingsFormValue } from '../../model/adapters';
import type {
  OomGuardMode,
  OomGuardSettingsFormErrors,
  OomGuardSettingsFormValue,
  OomGuardWorkerThresholdType,
} from '../../model/types';

// Modes of the OOM guard and the form changes they bring.

export const OOM_GUARD_MODE_OPTIONS: Array<{
  value: OomGuardMode;
  label: string;
  description: string;
}> = [
  {
    value: 'DISABLED',
    label: 'Выключен',
    description: 'Защита от OOM отключена — task снимает только сам Dask.',
  },
  {
    value: 'HOST_PRESSURE',
    label: 'По нагрузке хоста',
    description:
      'Останавливает task с максимальным RSS, если память host/container превышает порог.',
  },
  {
    value: 'WORKER_THRESHOLD',
    label: 'По лимиту воркера',
    description:
      'Останавливает executing task, который превысил индивидуальный лимит.',
  },
];

export const OOM_GUARD_THRESHOLD_TYPE_OPTIONS: Array<{
  value: OomGuardWorkerThresholdType;
  label: string;
}> = [
  {
    value: 'PERCENT',
    label: '%',
  },
  {
    value: 'ABSOLUTE_MB',
    label: 'MB',
  },
];

export const getVisibleOomGuardErrors = (
  showValidation: boolean,
  errors: OomGuardSettingsFormErrors
): OomGuardSettingsFormErrors => (showValidation ? errors : {});

export const applyOomGuardMode = (
  currentValue: OomGuardSettingsFormValue,
  mode: OomGuardMode
): OomGuardSettingsFormValue => {
  if (mode === 'DISABLED') {
    return createDefaultOomGuardSettingsFormValue();
  }

  if (mode === 'HOST_PRESSURE') {
    return {
      mode,
      host_threshold_percent: currentValue.host_threshold_percent,
      worker_threshold_type: '',
      worker_threshold_percent: '',
      worker_threshold_mb: '',
    };
  }

  const workerThresholdType = currentValue.worker_threshold_type || 'PERCENT';

  return {
    mode,
    host_threshold_percent: '',
    worker_threshold_type: workerThresholdType,
    worker_threshold_percent:
      workerThresholdType === 'PERCENT'
        ? currentValue.worker_threshold_percent
        : '',
    worker_threshold_mb:
      workerThresholdType === 'ABSOLUTE_MB'
        ? currentValue.worker_threshold_mb
        : '',
  };
};

export const applyOomGuardWorkerThresholdType = (
  currentValue: OomGuardSettingsFormValue,
  workerThresholdType: OomGuardWorkerThresholdType
): OomGuardSettingsFormValue => ({
  ...currentValue,
  worker_threshold_type: workerThresholdType,
  worker_threshold_percent:
    workerThresholdType === 'PERCENT'
      ? currentValue.worker_threshold_percent
      : '',
  worker_threshold_mb:
    workerThresholdType === 'ABSOLUTE_MB'
      ? currentValue.worker_threshold_mb
      : '',
});
