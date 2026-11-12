import type { ReactNode } from 'react';

import { InfoIcon } from '@/shared/ui/clean-minimal/icons';

import {
  InfoHintRoot,
  SettingControl,
  SettingLabel,
  SettingRow,
} from './settings.styles';

/** Значок (i) с подсказкой при наведении и фокусе. */
export const InfoHint = ({ text }: { text: string }) => (
  <InfoHintRoot tabIndex={0} aria-label={text}>
    <InfoIcon size={13} />
    <span className='hint-tip' role='tooltip'>
      {text}
    </span>
  </InfoHintRoot>
);

type SettingLineProps = {
  label: ReactNode;
  hint?: string;
  error?: string | undefined;
  /** Ширина контрола по содержимому (переключатель). */
  autoControl?: boolean;
  children: ReactNode;
};

/** Строка настроек «подпись — контрол» (макет: `.qr`). */
export const SettingLine = ({
  label,
  hint,
  error,
  autoControl = false,
  children,
}: SettingLineProps) => (
  <SettingRow>
    <SettingLabel>
      <span className='setting-name'>
        {label}
        {hint ? <InfoHint text={hint} /> : null}
      </span>
      {error ? (
        <span className='setting-error' role='alert'>
          {error}
        </span>
      ) : null}
    </SettingLabel>
    <SettingControl auto={autoControl}>{children}</SettingControl>
  </SettingRow>
);
