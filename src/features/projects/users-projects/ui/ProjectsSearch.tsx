import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  GlobalModeBadge,
  SearchClearBtn,
  SearchContainer,
  SearchCtaIconBox,
  SearchCtaKbHint,
  SearchCtaText,
  SearchDropdown,
  SearchGlobalCta,
  SearchIconWrap,
  SearchInputField,
  SearchInputWrap,
} from './ProjectsSearch.styles';

type SearchScope = 'local' | 'global';

type ProjectsSearchProps = {
  value: string;
  scope: SearchScope;
  onChange: (value: string) => void;
  onGlobalSearch: () => void;
  onClear: () => void;
};

const SearchSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.35-4.35' />
  </svg>
);

const GlobeSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='10' />
    <path d='M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
  </svg>
);

const CloseSvg = () => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M18 6 6 18M6 6l12 12' />
  </svg>
);

const EnterSvg = () => (
  <svg
    width='11'
    height='11'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 10l-5 5 5 5M20 4v7a4 4 0 0 1-4 4H4' />
  </svg>
);

export const ProjectsSearch: React.FC<ProjectsSearchProps> = ({
  value,
  scope,
  onChange,
  onGlobalSearch,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownId = useId();
  const [focused, setFocused] = useState(false);
  const [isDropdownDismissed, setIsDropdownDismissed] = useState(false);

  const trimmedValue = value.trim();
  const isGlobal = scope === 'global';
  const showDropdown =
    focused &&
    scope === 'local' &&
    trimmedValue.length > 0 &&
    !isDropdownDismissed;
  const isActive = focused || isGlobal;

  const placeholder = isGlobal
    ? 'Поиск во всех проектах...'
    : 'Поиск по названию...';

  useEffect(() => {
    if (!focused) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setFocused(false);
        setIsDropdownDismissed(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [focused]);

  useEffect(() => {
    if (!trimmedValue || isGlobal) {
      setIsDropdownDismissed(false);
    }
  }, [isGlobal, trimmedValue]);

  const handleGlobalSearch = useCallback(() => {
    if (!trimmedValue) {
      return;
    }

    setIsDropdownDismissed(true);
    onGlobalSearch();
  }, [onGlobalSearch, trimmedValue]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsDropdownDismissed(false);
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setIsDropdownDismissed(false);
    onClear();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [onClear]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && showDropdown) {
        event.preventDefault();
        handleGlobalSearch();
        return;
      }

      if (event.key !== 'Escape') {
        return;
      }

      if (showDropdown) {
        event.preventDefault();
        setIsDropdownDismissed(true);
        return;
      }

      if (value.length > 0) {
        event.preventDefault();
        handleClear();
      }
    },
    [handleClear, handleGlobalSearch, showDropdown, value.length]
  );

  const searchCtaLabel = useMemo(
    () => `Искать «${trimmedValue}» во всех проектах`,
    [trimmedValue]
  );

  return (
    <SearchContainer ref={containerRef}>
      <SearchInputWrap
        isFocused={focused}
        isGlobal={isGlobal}
        isDropdownOpen={showDropdown}
      >
        <SearchIconWrap isActive={isActive}>
          <SearchSvg />
        </SearchIconWrap>
        <SearchInputField
          ref={inputRef}
          role='searchbox'
          aria-label='Поиск проектов'
          aria-controls={showDropdown ? dropdownId : undefined}
          aria-expanded={showDropdown}
          placeholder={placeholder}
          data-testid='features/projects/users-projects/projects-search'
          value={value}
          onFocus={() => {
            setFocused(true);
            setIsDropdownDismissed(false);
          }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {isGlobal ? (
          <GlobalModeBadge aria-live='polite'>
            <GlobeSvg />
            везде
          </GlobalModeBadge>
        ) : null}
        {value ? (
          <SearchClearBtn
            type='button'
            aria-label='Очистить'
            onMouseDown={event => event.preventDefault()}
            onClick={handleClear}
          >
            <CloseSvg />
          </SearchClearBtn>
        ) : null}
      </SearchInputWrap>

      {showDropdown ? (
        <SearchDropdown id={dropdownId} role='listbox'>
          <SearchGlobalCta
            type='button'
            aria-label='Искать во всех проектах'
            onMouseDown={event => event.preventDefault()}
            onClick={handleGlobalSearch}
          >
            <SearchCtaIconBox>
              <GlobeSvg />
            </SearchCtaIconBox>
            <SearchCtaText title={searchCtaLabel}>
              Искать <span className='query'>«{trimmedValue}»</span> во всех
              проектах
            </SearchCtaText>
            <SearchCtaKbHint>
              <EnterSvg />
              Enter
            </SearchCtaKbHint>
          </SearchGlobalCta>
        </SearchDropdown>
      ) : null}
    </SearchContainer>
  );
};
