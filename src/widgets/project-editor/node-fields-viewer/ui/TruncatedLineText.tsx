import { type ReactNode, useState } from 'react';

import { Tooltip } from '@/shared/ui/primitives';

import { LineTextSingle, TooltipFullText } from './NodeFieldsViewer.styles';

interface TruncatedLineTextProps {
  children: ReactNode;
  /** Пояснение, которое показывается в тултипе всегда (например, текст шага). */
  hint?: ReactNode;
}

/**
 * Текст в одну строку с многоточием. Полный текст появляется в тултипе,
 * только если строка действительно обрезана; `hint` — всегда.
 */
export const TruncatedLineText = ({
  children,
  hint = null,
}: TruncatedLineTextProps) => {
  const [truncated, setTruncated] = useState(false);
  const title =
    truncated || hint ? (
      <>
        {truncated ? <TooltipFullText>{children}</TooltipFullText> : null}
        {hint ? <TooltipFullText>{hint}</TooltipFullText> : null}
      </>
    ) : (
      ''
    );

  return (
    <Tooltip placement='top-start' title={title}>
      <LineTextSingle
        onMouseEnter={event => {
          const element = event.currentTarget;
          setTruncated(element.scrollWidth > element.clientWidth);
        }}
      >
        {children}
      </LineTextSingle>
    </Tooltip>
  );
};
