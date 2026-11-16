import { type ChangeEvent, type ReactNode, useState } from 'react';

import { InputBox, InputSuffix } from './SettingsPane.styles';

type DraftInputProps = {
  /** Сохранённое значение в строковом виде. */
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  ariaLabel: string;
  placeholder?: string | undefined;
  inputMode?: 'numeric' | 'decimal' | 'text';
  invalid?: boolean;
  suffix?: ReactNode;
};

/**
 * Поле ввода, которое показывает набранный текст, пока в нём фокус.
 * Значение нормализуется обработчиком, а после blur поле показывает
 * сохранённый результат.
 */
export const DraftInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  inputMode = 'numeric',
  invalid = false,
  suffix,
}: DraftInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <InputBox invalid={invalid}>
      <input
        value={draft ?? value}
        onChange={event => {
          setDraft(event.target.value);
          onChange(event);
        }}
        onBlur={() => setDraft(null)}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      />
      {suffix ? <InputSuffix>{suffix}</InputSuffix> : null}
    </InputBox>
  );
};
