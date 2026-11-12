import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SearchField, SearchLead } from '@/shared/ui/clean-minimal/controls';
import { ChevronDownIcon, SearchIcon } from '@/shared/ui/clean-minimal/icons';

import {
  ColumnsEmpty as SelectEmpty,
  GhostSelectButton,
  SelectChevron,
  SelectList,
  SelectOption,
  SelectPlaceholder,
  SelectPopover,
  SelectSizer,
  SelectType,
  SelectValue,
} from './SettingsPane.styles';

export type GhostSelectOption = {
  value: string;
  label: string;
  type?: string | undefined;
  title?: string | undefined;
};

type GhostSelectProps = {
  ariaLabel: string;
  options: readonly GhostSelectOption[];
  value: string | null | undefined;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Поиск по опциям над списком. */
  searchPlaceholder?: string;
  testId?: string;
};

const OPTION_SELECTOR = '[role="option"]';

const focusOption = (list: HTMLElement | null, index: number) => {
  const options = list?.querySelectorAll<HTMLElement>(OPTION_SELECTOR);
  if (!options || options.length === 0) return;
  const bounded = Math.max(0, Math.min(index, options.length - 1));
  options[bounded]?.focus({ preventScroll: false });
};

type SelectMenuProps = Pick<
  GhostSelectProps,
  'ariaLabel' | 'options' | 'value' | 'searchPlaceholder' | 'placeholder'
> & {
  onPick: (value: string) => void;
};

const SelectMenu = ({
  ariaLabel,
  options,
  value,
  searchPlaceholder,
  placeholder,
  onPick,
}: SelectMenuProps) => {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    if (searchPlaceholder) {
      searchRef.current?.focus({ preventScroll: true });
      return;
    }
    const selected = listRef.current?.querySelector<HTMLElement>(
      `${OPTION_SELECTOR}[aria-selected="true"]`
    );
    (
      selected ?? listRef.current?.querySelector<HTMLElement>(OPTION_SELECTOR)
    )?.focus({ preventScroll: true });
  }, [searchPlaceholder]);

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowUp' && current <= 0 && searchPlaceholder) {
      searchRef.current?.focus();
      return;
    }
    focusOption(
      listRef.current,
      current + (event.key === 'ArrowDown' ? 1 : -1)
    );
  };

  return (
    <>
      {searchPlaceholder ? (
        <SearchField>
          <SearchLead>
            <SearchIcon />
          </SearchLead>
          <input
            ref={searchRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusOption(listRef.current, 0);
              }
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </SearchField>
      ) : (
        <SelectSizer aria-hidden='true'>{placeholder}</SelectSizer>
      )}
      <SelectList
        ref={listRef}
        role='listbox'
        aria-label={ariaLabel}
        onKeyDown={handleListKeyDown}
      >
        {visibleOptions.map(option => (
          <SelectOption
            key={option.value}
            type='button'
            role='option'
            aria-selected={option.value === value}
            title={option.title}
            onClick={() => onPick(option.value)}
          >
            <SelectValue>{option.label}</SelectValue>
            {option.type ? <SelectType>{option.type}</SelectType> : null}
          </SelectOption>
        ))}
        {visibleOptions.length === 0 ? (
          <SelectEmpty>Ничего не найдено</SelectEmpty>
        ) : null}
      </SelectList>
    </>
  );
};

/**
 * Селект без рамки для строк серого бокса: значение справа, меню
 * выравнивается по правому краю кнопки.
 */
export const GhostSelect = ({
  ariaLabel,
  options,
  value,
  onSelect,
  placeholder,
  disabled = false,
  invalid = false,
  searchPlaceholder,
  testId,
}: GhostSelectProps) => {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const selected = options.find(option => option.value === value);
  const open = Boolean(anchor);

  let content: ReactNode;
  if (selected) {
    content = (
      <>
        <SelectValue>{selected.label}</SelectValue>
        {selected.type ? <SelectType>{selected.type}</SelectType> : null}
      </>
    );
  } else if (value) {
    content = <SelectValue>{value}</SelectValue>;
  } else {
    content = (
      <SelectPlaceholder className='select-placeholder'>
        {placeholder}
      </SelectPlaceholder>
    );
  }

  return (
    <>
      <GhostSelectButton
        type='button'
        open={open}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        data-testid={testId}
        onClick={event => setAnchor(event.currentTarget)}
      >
        {content}
        <SelectChevron className='select-chevron'>
          <ChevronDownIcon />
        </SelectChevron>
      </GhostSelectButton>
      <SelectPopover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { style: { minWidth: searchPlaceholder ? 260 : 0 } },
        }}
      >
        <SelectMenu
          ariaLabel={ariaLabel}
          options={options}
          value={value}
          placeholder={placeholder}
          {...(searchPlaceholder ? { searchPlaceholder } : {})}
          onPick={nextValue => {
            setAnchor(null);
            onSelect(nextValue);
          }}
        />
      </SelectPopover>
    </>
  );
};
