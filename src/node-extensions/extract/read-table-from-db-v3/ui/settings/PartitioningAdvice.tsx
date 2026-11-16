import { useId } from 'react';

import { InfoIcon } from '@/shared/ui/clean-minimal/icons';

import type { PartitioningAdviceStatus } from '../../model/usePartitioningAdvice';

import { PARTITIONING_ADVICE_TEXT as TEXT } from './partitioningAdviceText';
import {
  Advice,
  AdviceInfo,
  AdviceLink,
  AdviceMessage,
  AdviceSpinner,
  AdviceState,
  AdviceTooltip,
} from './SettingsPane.styles';

type PartitioningAdviceProps = {
  status: PartitioningAdviceStatus;
  onRun: () => void;
  onUndo: () => void;
};

/** «Подобрать настройки» справа в строке вкладок «Параметров». */
export const PartitioningAdvice = ({
  status,
  onRun,
  onUndo,
}: PartitioningAdviceProps) => {
  const tooltipId = useId();

  const renderState = () => {
    switch (status) {
      case 'loading':
        return (
          <AdviceMessage>
            <AdviceSpinner size={12} />
            {TEXT.loading}
          </AdviceMessage>
        );
      case 'applied':
        return (
          <>
            <AdviceMessage>{TEXT.applied}</AdviceMessage>
            <AdviceLink type='button' onClick={onUndo}>
              {TEXT.undo}
            </AdviceLink>
          </>
        );
      case 'same':
        return <AdviceMessage>{TEXT.same}</AdviceMessage>;
      case 'error':
        return (
          <>
            <AdviceMessage tone='error'>{TEXT.failed}</AdviceMessage>
            <AdviceLink type='button' onClick={onRun}>
              {TEXT.retry}
            </AdviceLink>
          </>
        );
      default:
        return (
          <AdviceLink type='button' onClick={onRun}>
            {TEXT.run}
          </AdviceLink>
        );
    }
  };

  return (
    <Advice>
      <AdviceState role='status' aria-busy={status === 'loading'}>
        {renderState()}
      </AdviceState>
      <AdviceInfo
        type='button'
        aria-label={TEXT.infoLabel}
        aria-describedby={tooltipId}
      >
        <InfoIcon />
        <AdviceTooltip id={tooltipId} role='tooltip' className='advice-tooltip'>
          {TEXT.info}
        </AdviceTooltip>
      </AdviceInfo>
    </Advice>
  );
};
