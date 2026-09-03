import { useEffect, useMemo, useRef, useState } from 'react';

import {
  FieldLabel,
  SelectButton,
  SelectButtonText,
  SelectButtonValue,
  SelectDropdown,
  SelectEmptyState,
  SelectFieldShell,
  SelectOption,
  SelectOptionList,
  SelectOptionMeta,
} from '../styles';

import { ChevronDownIcon } from './icons';

type OptionSelectFieldProps = {
  label: string;
  onChange: (nextValue: string) => void;
  options: string[];
  placeholder?: string | undefined;
  value: string;
};

export const OptionSelectField = ({
  label,
  onChange,
  options,
  placeholder,
  value,
}: OptionSelectFieldProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return placeholder ?? 'Выберите вариант';
    }

    return value;
  }, [placeholder, value]);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <SelectFieldShell ref={rootRef}>
        <SelectButton
          type='button'
          isOpen={isOpen}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(current => !current)}
        >
          <SelectButtonValue>
            <SelectButtonText>{selectedLabel}</SelectButtonText>
          </SelectButtonValue>
          <ChevronDownIcon
            style={{
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </SelectButton>

        {isOpen ? (
          <SelectDropdown>
            <SelectOptionList>
              {options.length === 0 ? (
                <SelectEmptyState>Нет доступных вариантов.</SelectEmptyState>
              ) : (
                options.map(option => (
                  <SelectOption
                    key={option}
                    type='button'
                    isSelected={option === value}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                  >
                    <span>{option}</span>
                    {option === value ? (
                      <SelectOptionMeta>selected</SelectOptionMeta>
                    ) : null}
                  </SelectOption>
                ))
              )}
            </SelectOptionList>
          </SelectDropdown>
        ) : null}
      </SelectFieldShell>
    </div>
  );
};
