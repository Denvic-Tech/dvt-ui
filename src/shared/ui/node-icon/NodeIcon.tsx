import { type CSSProperties, memo } from 'react';
// eslint-disable-next-line import/no-unresolved -- supplied by the node-icons Vite plugin
import { iconKeys, spriteUrl } from 'virtual:node-icons';

const availableKeys = new Set(iconKeys);

interface NodeIconProps {
  iconKey?: string | null | undefined;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const NodeIcon = memo(function NodeIcon({
  iconKey,
  size = 16,
  className,
  style,
}: NodeIconProps) {
  if (!iconKey || !availableKeys.has(iconKey)) {
    return (
      <span
        aria-hidden='true'
        data-node-icon='default'
        className={className}
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: 'currentColor',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <svg
      aria-hidden='true'
      focusable='false'
      data-node-icon={iconKey}
      className={className}
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <use href={`${spriteUrl}#node-${iconKey}`} width='100%' height='100%' />
    </svg>
  );
});
