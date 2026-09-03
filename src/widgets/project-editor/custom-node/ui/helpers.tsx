import React from 'react';

import {
  CopiedText,
  CopyIcon,
  CopyIconContainer,
  ErrorText,
  ErrorTooltipContainer,
  ErrorTooltipLayer,
  TooltipArrow,
} from './styles';

export {
  connectionEndToClientPosition,
  getHoveredNodeIdAtClientPosition,
} from '../model/connectionReveal';

interface NodeErrorTooltipProps {
  copied: boolean;
  message: string;
  onCopy: (event: React.MouseEvent) => void;
  scaleCompensation: number;
  visible: boolean;
}

export const NodeErrorTooltip: React.FC<NodeErrorTooltipProps> = ({
  copied,
  message,
  onCopy,
  scaleCompensation,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <ErrorTooltipLayer
      className='custom-node-error-tooltip'
      data-testid='node-error-tooltip'
      style={
        {
          '--dvt-node-error-tooltip-scale': String(scaleCompensation),
        } as React.CSSProperties
      }
    >
      <ErrorTooltipContainer className='tooltip-container' onClick={onCopy}>
        <ErrorText>{message}</ErrorText>
        <CopyIconContainer>
          {copied ? (
            <CopiedText>{'\u2713'}</CopiedText>
          ) : (
            <CopyIcon viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
              />
            </CopyIcon>
          )}
        </CopyIconContainer>
        <TooltipArrow />
      </ErrorTooltipContainer>
    </ErrorTooltipLayer>
  );
};
