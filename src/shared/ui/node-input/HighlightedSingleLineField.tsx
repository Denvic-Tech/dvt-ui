import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  ClickAwayListener,
  FormControl,
  FormHelperText,
  InputAdornment,
  List,
  ListItemButton,
  OutlinedInput,
  Paper,
  Popper,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  INLINE_VALUE_TYPE_COLORS,
  type InlineExpressionToken,
  tokenizeInlineExpression,
  type VariableOutput,
} from '@/shared/lib/variables';

import {
  buildInlineAutocompleteCatalog,
  CODE_FONT_FAMILY,
  formatSingleLineExpression,
  type HighlightedAutocompleteItem,
  type InlineAutocompleteCatalog,
  type InlineExpressionDiagnostic,
  resolveInlineAutocomplete,
} from './HighlightedSingleLineField.shared';

type HighlightedSingleLineFieldProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onKeyDown?:
    | React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  placeholder?: string | undefined;
  helperText?: React.ReactNode | undefined;
  startActions?: React.ReactNode | undefined;
  endActions?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  variables?: VariableOutput[] | undefined;
  autocompleteItems?: HighlightedAutocompleteItem[] | undefined;
  autocompleteCatalog?: InlineAutocompleteCatalog | undefined;
  highlightingEnabled?: boolean | undefined;
  autoFormatOnBlur?: boolean | undefined;
  diagnostics?: InlineExpressionDiagnostic[] | undefined;
  errorText?: React.ReactNode | undefined;
  warningText?: React.ReactNode | undefined;
};

const assignRef = <T,>(ref: React.ForwardedRef<T>, value: T | null): void => {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
};

const VariableQuickInfo: React.FC<{ variable: VariableOutput }> = ({
  variable,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, py: 0.25 }}>
    <Typography
      component='span'
      sx={{
        fontSize: 12,
        fontWeight: 700,
        fontFamily: CODE_FONT_FAMILY,
        lineHeight: 1.3,
      }}
    >
      {variable.name}
    </Typography>
    <Typography component='span' sx={{ fontSize: 11.5, lineHeight: 1.3 }}>
      {`${variable.scope} / ${variable.type}${variable.isListType ? '[]' : ''}`}
    </Typography>
    {variable.sourceLabel && (
      <Typography
        component='span'
        sx={{ fontSize: 11, lineHeight: 1.3, color: 'rgba(255,255,255,0.74)' }}
      >
        {variable.sourceLabel}
      </Typography>
    )}
  </Box>
);

const renderTokenStyles = (token: InlineExpressionToken) => {
  if (!token.semanticType) {
    return {
      color: 'text.primary',
      fontWeight: 400,
    };
  }

  return {
    color: INLINE_VALUE_TYPE_COLORS[token.semanticType],
    fontWeight: 400,
  };
};

const renderHighlightedText = (
  value: string,
  variables: VariableOutput[]
): React.ReactNode => {
  const tokens = tokenizeInlineExpression(value, variables);
  if (!tokens.length) {
    return value;
  }

  return tokens.map(token => (
    <Box
      component='span'
      key={`${value}:${token.start}-${token.end}-${token.kind}`}
      sx={renderTokenStyles(token)}
    >
      {token.value}
    </Box>
  ));
};

const AUTOCOMPLETE_KIND_LABELS: Record<
  HighlightedAutocompleteItem['kind'],
  string
> = {
  variable: 'Variable',
  operator: 'Operator',
  value: 'Value',
  filter: 'Filter',
  test: 'Test',
  global: 'Global',
};

export const HighlightedSingleLineField = forwardRef<
  HTMLInputElement,
  HighlightedSingleLineFieldProps
>(function HighlightedSingleLineField(
  {
    value,
    onChange,
    onKeyDown,
    placeholder,
    helperText,
    startActions,
    endActions,
    actions,
    variables = [],
    autocompleteItems = [],
    autocompleteCatalog,
    highlightingEnabled = true,
    autoFormatOnBlur = false,
    diagnostics = [],
    errorText,
    warningText,
  },
  forwardedRef
) {
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const startAdornmentRef = useRef<HTMLDivElement | null>(null);
  const endAdornmentRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [startActionsWidth, setStartActionsWidth] = useState(0);
  const [endActionsWidth, setEndActionsWidth] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedAutocompleteIndex, setHighlightedAutocompleteIndex] =
    useState(0);
  const [isAutocompleteDismissed, setIsAutocompleteDismissed] = useState(false);
  const resolvedEndActions = endActions ?? actions;

  const tokens = useMemo(
    () =>
      highlightingEnabled ? tokenizeInlineExpression(value, variables) : [],
    [highlightingEnabled, value, variables]
  );

  const resolvedAutocompleteCatalog = useMemo(
    () =>
      autocompleteCatalog ?? buildInlineAutocompleteCatalog(autocompleteItems),
    [autocompleteCatalog, autocompleteItems]
  );

  const autocompleteDecision = useMemo(
    () =>
      resolveInlineAutocomplete(
        value,
        cursorPosition,
        resolvedAutocompleteCatalog
      ),
    [cursorPosition, resolvedAutocompleteCatalog, value]
  );

  const filteredAutocompleteItems = autocompleteDecision.items;

  const isAutocompleteOpen =
    isFocused &&
    !isAutocompleteDismissed &&
    filteredAutocompleteItems.length > 0;
  const hasError =
    Boolean(errorText) ||
    diagnostics.some(diagnostic => diagnostic.severity === 'error');
  const resolvedHelperText = errorText ?? warningText ?? helperText;

  const handleInputRef = useCallback(
    (instance: HTMLInputElement | null) => {
      localInputRef.current = instance;
      assignRef(forwardedRef, instance);
    },
    [forwardedRef]
  );

  useEffect(() => {
    if (!isAutocompleteOpen) {
      return;
    }

    setHighlightedAutocompleteIndex(previousIndex =>
      Math.min(previousIndex, filteredAutocompleteItems.length - 1)
    );
  }, [filteredAutocompleteItems.length, isAutocompleteOpen]);

  const applyAutocompleteItem = useCallback(
    (item: HighlightedAutocompleteItem) => {
      const nextValue =
        value.slice(0, autocompleteDecision.replaceStart) +
        item.insertText +
        value.slice(autocompleteDecision.replaceEnd);
      const nextCursorPosition =
        autocompleteDecision.replaceStart + item.insertText.length;

      onChange(nextValue);
      setCursorPosition(nextCursorPosition);
      setIsAutocompleteDismissed(true);

      requestAnimationFrame(() => {
        localInputRef.current?.focus();
        localInputRef.current?.setSelectionRange(
          nextCursorPosition,
          nextCursorPosition
        );
      });
    },
    [
      autocompleteDecision.replaceEnd,
      autocompleteDecision.replaceStart,
      onChange,
      value,
    ]
  );

  const handleInternalKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isAutocompleteOpen && filteredAutocompleteItems.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedAutocompleteIndex(previousIndex =>
            previousIndex >= filteredAutocompleteItems.length - 1
              ? 0
              : previousIndex + 1
          );
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedAutocompleteIndex(previousIndex =>
            previousIndex <= 0
              ? filteredAutocompleteItems.length - 1
              : previousIndex - 1
          );
          return;
        }

        if (event.key === 'Tab' || event.key === 'Enter') {
          event.preventDefault();
          applyAutocompleteItem(
            filteredAutocompleteItems[highlightedAutocompleteIndex] ??
              filteredAutocompleteItems[0]
          );
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setIsAutocompleteDismissed(true);
          return;
        }
      }

      onKeyDown?.(event);
    },
    [
      applyAutocompleteItem,
      filteredAutocompleteItems,
      highlightedAutocompleteIndex,
      isAutocompleteOpen,
      onKeyDown,
    ]
  );

  const handleAutocompleteClickAway = useCallback(() => {
    setIsAutocompleteDismissed(true);
  }, []);

  useEffect(() => {
    if (!startAdornmentRef.current) {
      setStartActionsWidth(0);
      return;
    }

    const updateWidth = () => {
      setStartActionsWidth(
        startAdornmentRef.current?.getBoundingClientRect().width ?? 0
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(startAdornmentRef.current);

    return () => observer.disconnect();
  }, [startActions]);

  useEffect(() => {
    if (!endAdornmentRef.current) {
      setEndActionsWidth(0);
      return;
    }

    const updateWidth = () => {
      setEndActionsWidth(
        endAdornmentRef.current?.getBoundingClientRect().width ?? 0
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(endAdornmentRef.current);

    return () => observer.disconnect();
  }, [resolvedEndActions]);

  return (
    <FormControl fullWidth size='small' error={hasError}>
      <Box ref={rootRef} sx={{ position: 'relative' }}>
        <OutlinedInput
          fullWidth
          value={value}
          inputRef={handleInputRef}
          onChange={event => {
            setCursorPosition(
              event.target.selectionStart ?? event.target.value.length
            );
            setHighlightedAutocompleteIndex(0);
            setIsAutocompleteDismissed(false);
            onChange(event.target.value);
          }}
          onFocus={event => {
            setIsFocused(true);
            setCursorPosition(
              event.target.selectionStart ?? event.target.value.length
            );
            setIsAutocompleteDismissed(false);
          }}
          onBlur={() => {
            setIsFocused(false);
            if (autoFormatOnBlur && highlightingEnabled) {
              const formattedValue = formatSingleLineExpression(
                value,
                variables
              );
              if (formattedValue && formattedValue !== value) {
                onChange(formattedValue);
                setCursorPosition(formattedValue.length);
              }
            }
          }}
          onClick={event => {
            setCursorPosition(
              (event.currentTarget as HTMLInputElement).selectionStart ??
                value.length
            );
          }}
          onKeyUp={event => {
            setCursorPosition(
              (event.currentTarget as HTMLInputElement).selectionStart ??
                value.length
            );
          }}
          onSelect={event => {
            setCursorPosition(
              (event.currentTarget as HTMLInputElement).selectionStart ??
                value.length
            );
          }}
          onKeyDown={handleInternalKeyDown}
          {...(placeholder ? { placeholder } : {})}
          error={hasError}
          startAdornment={
            startActions ? (
              <InputAdornment position='start'>
                <Box
                  ref={startAdornmentRef}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                  }}
                >
                  {startActions}
                </Box>
              </InputAdornment>
            ) : undefined
          }
          endAdornment={
            resolvedEndActions ? (
              <InputAdornment position='end'>
                <Box
                  ref={endAdornmentRef}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                  }}
                >
                  {resolvedEndActions}
                </Box>
              </InputAdornment>
            ) : undefined
          }
          inputProps={{
            spellCheck: false,
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            onScroll: event =>
              setScrollLeft((event.target as HTMLInputElement).scrollLeft),
          }}
          sx={{
            minWidth: 150,
            fontFamily: CODE_FONT_FAMILY,
            '& input': {
              position: 'relative',
              zIndex: 1,
              color: highlightingEnabled ? 'transparent' : 'text.primary',
              caretColor: theme => theme.palette.text.primary,
              fontFamily: CODE_FONT_FAMILY,
              fontWeight: 400,
              letterSpacing: '0',
              fontSize: 13,
              fontKerning: 'none',
              fontVariantLigatures: 'none',
              fontFeatureSettings: '"liga" 0, "calt" 0',
            },
            '& input::placeholder': {
              color: 'text.disabled',
              WebkitTextFillColor: 'currentColor',
            },
          }}
        />
        <Popper
          open={isAutocompleteOpen}
          anchorEl={rootRef.current}
          placement='bottom-start'
          sx={theme => ({ zIndex: theme.zIndex.modal + 1 })}
        >
          <ClickAwayListener onClickAway={handleAutocompleteClickAway}>
            <Paper
              elevation={8}
              sx={{
                width: 360,
                mt: 0.5,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <List dense sx={{ py: 0.5 }}>
                {filteredAutocompleteItems.map((item, index) => (
                  <ListItemButton
                    key={item.id}
                    selected={index === highlightedAutocompleteIndex}
                    onMouseDown={event => {
                      event.preventDefault();
                      applyAutocompleteItem(item);
                    }}
                    sx={{
                      alignItems: 'flex-start',
                      gap: 1.25,
                      py: 0.85,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        component='div'
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          fontFamily: CODE_FONT_FAMILY,
                          lineHeight: 1.35,
                          color: 'text.primary',
                        }}
                      >
                        {renderHighlightedText(item.label, variables)}
                      </Typography>
                      {item.detail && (
                        <Typography
                          component='div'
                          sx={{
                            mt: 0.15,
                            fontSize: 11,
                            lineHeight: 1.35,
                            color: 'text.secondary',
                          }}
                        >
                          {item.detail}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      component='div'
                      sx={{
                        pt: 0.15,
                        fontSize: 10.5,
                        lineHeight: 1.2,
                        color: 'text.disabled',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {AUTOCOMPLETE_KIND_LABELS[item.kind]}
                    </Typography>
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
        {highlightingEnabled && value && (
          <Box
            aria-hidden='true'
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              pl: `calc(14px + ${startActionsWidth}px)`,
              py: '8.5px',
              pr: `calc(14px + ${endActionsWidth}px)`,
              fontFamily: CODE_FONT_FAMILY,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0',
              lineHeight: 1.4375,
              fontKerning: 'none',
              fontVariantLigatures: 'none',
              fontFeatureSettings: '"liga" 0, "calt" 0',
              whiteSpace: 'pre',
              color: 'text.primary',
              pointerEvents: 'none',
            }}
          >
            <Box
              component='span'
              sx={{
                transform: `translateX(-${scrollLeft}px)`,
                minWidth: 'max-content',
              }}
            >
              {tokens.map(token => {
                const key = `${token.start}-${token.end}-${token.kind}`;
                const tokenNode = (
                  <Box
                    component='span'
                    key={key}
                    onMouseDown={
                      token.kind === 'variable'
                        ? event => {
                            event.preventDefault();
                            localInputRef.current?.focus();
                            localInputRef.current?.setSelectionRange(
                              token.end,
                              token.end
                            );
                          }
                        : undefined
                    }
                    sx={{
                      pointerEvents:
                        token.kind === 'variable' && token.variable
                          ? 'auto'
                          : 'none',
                      ...renderTokenStyles(token),
                    }}
                  >
                    {token.value}
                  </Box>
                );

                if (token.kind === 'variable' && token.variable) {
                  return (
                    <Tooltip
                      key={key}
                      title={<VariableQuickInfo variable={token.variable} />}
                      placement='top'
                      arrow
                    >
                      {tokenNode}
                    </Tooltip>
                  );
                }

                return tokenNode;
              })}
            </Box>
          </Box>
        )}
      </Box>
      {resolvedHelperText ? (
        <FormHelperText error={hasError}>{resolvedHelperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
});
