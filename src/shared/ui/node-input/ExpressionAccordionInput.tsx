import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  alpha,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  keyframes,
  Stack,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import { getClearedValueByType } from '@/shared/lib/node-io';
import type { VariableOutput } from '@/shared/lib/variables';

import { buildSingleExpressionValue } from './primitiveExpression';
import PrimitiveNodeInput, {
  type PrimitiveNodeInputInlineAction,
} from './PrimitiveNodeInput';

export type ExpressionAccordionAppearance = 'accordion' | 'workspace';

type ExpressionAccordionInputProps = {
  inputDefinition: InputDefinitionModel | null | undefined;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  variables?: VariableOutput[] | undefined;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  description?: string | null | undefined;
  required?: boolean | undefined;
  badge?: React.ReactNode | undefined;
  collapsedValue?: React.ReactNode | undefined;
  collapsedValueIcon?: React.ReactNode | undefined;
  collapsedValueFontSize?: number | string | undefined;
  hasError?: boolean | undefined;
  stepNumber?: number | undefined;
  completed?: boolean | undefined;
  disabled?: boolean | undefined;
  disabledReason?: React.ReactNode | undefined;
  loading?: boolean | undefined;
  loadingVariant?: 'spinner' | 'title-wave' | undefined;
  unmountOnExit?: boolean | undefined;
  expressionInputInlineActions?: PrimitiveNodeInputInlineAction[] | undefined;
  appearance?: ExpressionAccordionAppearance | undefined;
  children: React.ReactNode;
};

const loadingWave = keyframes`
  0% {
    background-position: 180% 50%;
  }
  100% {
    background-position: -80% 50%;
  }
`;

const AccordionItem = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'hasError' &&
    prop !== 'isStepped' &&
    prop !== 'isDisabled' &&
    prop !== 'isOpen' &&
    prop !== 'isLoadingWave',
})<{
  hasError?: boolean;
  isStepped?: boolean;
  isDisabled?: boolean;
  isOpen?: boolean;
  isLoadingWave?: boolean;
}>(({ theme, hasError, isStepped, isDisabled, isOpen, isLoadingWave }) => ({
  position: 'relative',
  border: `1px solid ${
    hasError
      ? theme.palette.error.main
      : isOpen
        ? theme.palette.primary.main
        : theme.palette.divider
  }`,
  borderRadius: isStepped ? 12 : 8,
  overflow: 'visible',
  backgroundColor: isDisabled
    ? alpha(theme.palette.grey[100], 0.5)
    : theme.palette.background.paper,
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  ...(isLoadingWave
    ? {
        borderColor: 'transparent',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -1,
          zIndex: 1,
          padding: '1px',
          borderRadius: 'inherit',
          backgroundImage: `linear-gradient(90deg, ${theme.palette.divider} 10%, ${theme.palette.primary.main} 50%, ${theme.palette.divider} 90%)`,
          backgroundSize: '220% 100%',
          filter: `drop-shadow(0 0 5px ${alpha(theme.palette.primary.main, 0.24)})`,
          animation: `${loadingWave} 1.45s ease-in-out infinite`,
          pointerEvents: 'none',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        },
        '@media (prefers-reduced-motion: reduce)': {
          borderColor: theme.palette.divider,
          '&::before': {
            display: 'none',
          },
        },
      }
    : {}),
}));

const AccordionHeader = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'isStepped' && prop !== 'isDisabled' && prop !== 'isOpen',
})<{ isStepped?: boolean; isDisabled?: boolean; isOpen?: boolean }>(
  ({ theme, isStepped, isDisabled, isOpen }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isStepped ? 10 : 12,
    width: '100%',
    minHeight: isStepped ? 50 : undefined,
    padding: isStepped ? '9px 14px' : '12px 16px',
    borderRadius: isOpen
      ? isStepped
        ? '11px 11px 0 0'
        : '7px 7px 0 0'
      : isStepped
        ? 11
        : 7,
    backgroundColor: isStepped
      ? isDisabled
        ? alpha(theme.palette.grey[100], 0.45)
        : theme.palette.background.paper
      : alpha(theme.palette.grey[50], 0.8),
  })
);

const AccordionHeaderMain = styled('button', {
  shouldForwardProp: prop => prop !== 'isStepped',
})<{ isStepped?: boolean }>(({ theme, isStepped }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: isStepped ? 10 : 12,
  minWidth: 0,
  flex: 1,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  '&:focus-visible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
    outlineOffset: 2,
    borderRadius: 6,
  },
  '&:disabled': {
    cursor: 'not-allowed',
  },
}));

const InputIcon = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'isActive' &&
    prop !== 'hasError' &&
    prop !== 'isDisabled' &&
    prop !== 'isStepped',
})<{
  isActive?: boolean;
  hasError?: boolean;
  isDisabled?: boolean;
  isStepped?: boolean;
}>(({ theme, isActive, hasError, isDisabled, isStepped }) => ({
  width: isStepped ? 28 : 32,
  height: isStepped ? 28 : 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  flexShrink: 0,
  color: isDisabled
    ? theme.palette.text.disabled
    : hasError
      ? theme.palette.error.main
      : isActive
        ? theme.palette.primary.main
        : theme.palette.text.secondary,
  backgroundColor: isDisabled
    ? alpha(theme.palette.grey[300], 0.35)
    : hasError
      ? alpha(theme.palette.error.main, 0.1)
      : isActive
        ? alpha(theme.palette.primary.main, 0.1)
        : theme.palette.grey[100],
  '& svg': isStepped
    ? {
        width: 16,
        height: 16,
      }
    : undefined,
}));

const HeaderText = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: 1,
});

const HeaderTitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});

const HeaderTitle = styled(Typography, {
  shouldForwardProp: prop =>
    prop !== 'isStepped' && prop !== 'isDisabled' && prop !== 'isLoadingWave',
})<{
  isStepped?: boolean;
  isDisabled?: boolean;
  isLoadingWave?: boolean;
}>(({ theme, isStepped, isDisabled, isLoadingWave }) => ({
  minWidth: 0,
  fontSize: isStepped ? '0.8125rem' : '0.875rem',
  fontWeight: isStepped ? 600 : 500,
  color: isDisabled ? theme.palette.text.disabled : theme.palette.text.primary,
  fontFamily: 'inherit',
  ...(isLoadingWave
    ? {
        color: 'transparent',
        backgroundImage: `linear-gradient(90deg, ${theme.palette.text.disabled} 10%, ${theme.palette.primary.main} 50%, ${theme.palette.text.disabled} 90%)`,
        backgroundSize: '220% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        filter: `drop-shadow(0 0 4px ${alpha(theme.palette.primary.main, 0.22)})`,
        animation: `${loadingWave} 1.45s ease-in-out infinite`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          color: theme.palette.text.secondary,
          backgroundImage: 'none',
          filter: 'none',
        },
      }
    : {}),
}));

const HeaderActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
});

const HeaderActionButton = styled(IconButton, {
  shouldForwardProp: prop => prop !== 'isStepped',
})<{ isStepped?: boolean }>(({ isStepped }) => ({
  width: isStepped ? 28 : 32,
  height: isStepped ? 28 : 32,
  padding: 0,
  flexShrink: 0,
  '& > svg': isStepped
    ? {
        fontSize: 18,
      }
    : undefined,
}));

const StepIndicator = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'completed' && prop !== 'isDisabled' && prop !== 'isOpen',
})<{ completed?: boolean; isDisabled?: boolean; isOpen?: boolean }>(
  ({ theme, completed, isDisabled, isOpen }) => ({
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: isOpen
      ? theme.palette.primary.main
      : completed
        ? '#dcfce7'
        : isDisabled
          ? alpha(theme.palette.grey[200], 0.55)
          : theme.palette.grey[100],
    color: isOpen
      ? theme.palette.primary.contrastText
      : completed
        ? '#15803d'
        : isDisabled
          ? theme.palette.text.disabled
          : theme.palette.text.secondary,
    fontSize: '0.6875rem',
    fontWeight: 600,
  })
);

const CollapsedValueBox = styled(Typography, {
  shouldForwardProp: prop => prop !== 'completed' && prop !== 'isDisabled',
})<{ completed?: boolean; isDisabled?: boolean }>(
  ({ theme, completed, isDisabled }) => ({
    maxWidth: 220,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '2px 10px',
    borderRadius: 999,
    border: completed
      ? 'none'
      : `1px solid ${alpha(theme.palette.grey[700], 0.22)}`,
    backgroundColor: completed
      ? alpha(theme.palette.primary.main, 0.08)
      : alpha(theme.palette.grey[500], 0.09),
    color: isDisabled
      ? theme.palette.text.disabled
      : completed
        ? theme.palette.primary.main
        : alpha(theme.palette.text.secondary, 0.72),
    fontSize: '0.75rem',
    fontWeight: 500,
  })
);

const Content = styled(Box, {
  shouldForwardProp: prop => prop !== 'isStepped',
})<{ isStepped?: boolean }>(({ theme, isStepped }) => ({
  padding: 16,
  borderTop: `1px solid ${theme.palette.divider}`,
  borderRadius: isStepped ? '0 0 11px 11px' : '0 0 7px 7px',
  backgroundColor: theme.palette.background.paper,
}));

const DisabledReason = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isLoading',
})<{ isLoading?: boolean }>(({ theme, isLoading }) => ({
  minWidth: 0,
  marginLeft: 2,
  paddingLeft: 10,
  borderLeft: `1px solid ${theme.palette.divider}`,
  color: isLoading ? theme.palette.text.secondary : theme.palette.text.disabled,
  fontSize: '0.75rem',
  fontWeight: 400,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const WorkspaceSection = styled(Box)({
  width: '100%',
  minWidth: 0,
  minHeight: 0,
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
});

const WorkspaceSectionHeader = styled(Box)(({ theme }) => ({
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingBottom: 0,
  marginBottom: 16,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxSizing: 'border-box',
  flexShrink: 0,
}));

export const ExpressionAccordionInput: React.FC<
  ExpressionAccordionInputProps
> = ({
  inputDefinition,
  value,
  onChange,
  variables = [],
  isOpen,
  onToggle,
  icon,
  title,
  description,
  required = false,
  badge,
  collapsedValue,
  collapsedValueIcon,
  collapsedValueFontSize,
  hasError = false,
  stepNumber,
  completed = false,
  disabled = false,
  disabledReason,
  loading = false,
  loadingVariant = 'spinner',
  unmountOnExit = false,
  expressionInputInlineActions = [],
  appearance = 'accordion',
  children,
}) => {
  const isStepped = stepNumber !== undefined;
  const isTitleWaveLoading = loading && loadingVariant === 'title-wave';
  const isExpressionMode = useMemo(() => {
    return isExpressionValue(value) && value.expression_kind === 'single';
  }, [value]);

  const lastLiteralValueRef = useRef<unknown>(undefined);
  const hasLiteralSnapshotRef = useRef(false);

  useEffect(() => {
    if (isExpressionMode) {
      return;
    }

    lastLiteralValueRef.current = value;
    hasLiteralSnapshotRef.current = true;
  }, [isExpressionMode, value]);

  const handleExpressionModeToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled || !inputDefinition?.allow_expressions) {
        return;
      }

      if (isExpressionMode) {
        onChange(
          hasLiteralSnapshotRef.current
            ? lastLiteralValueRef.current
            : getClearedValueByType(inputDefinition.type)
        );
        return;
      }

      lastLiteralValueRef.current = value;
      hasLiteralSnapshotRef.current = true;
      onChange(buildSingleExpressionValue(inputDefinition.type, value));
    },
    [disabled, inputDefinition, isExpressionMode, onChange, value]
  );

  const codeIconNode = (
    <Box
      component='svg'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      sx={{ width: 16, height: 16, display: 'block' }}
    >
      <path
        d='M11 16L13 8'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M17 15L19.6961 12.3039C19.8639 12.1361 19.8639 11.8639 19.6961 11.6961L17 9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7 9L4.32151 11.6785C4.14394 11.8561 4.14394 12.1439 4.32151 12.3215L7 15'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Box>
  );

  if (appearance === 'workspace') {
    return (
      <WorkspaceSection aria-busy={loading}>
        <WorkspaceSectionHeader data-testid='shared/ui/node-input/workspace-section-header'>
          <InputIcon
            isActive
            hasError={hasError}
            isDisabled={disabled && !loading}
          >
            {icon}
          </InputIcon>
          <HeaderText>
            <HeaderTitleRow>
              <HeaderTitle
                isDisabled={disabled && !loading}
                isLoadingWave={isTitleWaveLoading}
                sx={{ fontSize: '0.9375rem', fontWeight: 650 }}
              >
                {title}
              </HeaderTitle>
              {required ? (
                <Typography component='span' sx={{ color: 'error.main' }}>
                  *
                </Typography>
              ) : null}
              {badge}
            </HeaderTitleRow>
            {description ? (
              <Typography
                sx={{ mt: 0.2, fontSize: '0.75rem', color: 'text.secondary' }}
              >
                {description}
              </Typography>
            ) : null}
          </HeaderText>
          {loading ? <CircularProgress size={18} thickness={5} /> : null}
          {inputDefinition?.allow_expressions ? (
            <Tooltip
              title={
                isExpressionMode
                  ? 'Вернуться к специализированному режиму'
                  : 'Перейти в expression mode'
              }
            >
              <HeaderActionButton
                size='small'
                onClick={handleExpressionModeToggle}
                aria-label='Переключить expression mode'
                disabled={disabled}
                sx={{ borderRadius: '6px' }}
              >
                {codeIconNode}
              </HeaderActionButton>
            </Tooltip>
          ) : null}
        </WorkspaceSectionHeader>

        {loading ? (
          <Stack
            alignItems='center'
            justifyContent='center'
            sx={{ minHeight: 160 }}
          >
            <CircularProgress size={24} />
            <Typography color='text.secondary' sx={{ mt: 1.25, fontSize: 12 }}>
              Загружаем данные…
            </Typography>
          </Stack>
        ) : isExpressionMode ? (
          <PrimitiveNodeInput
            inputDefinition={inputDefinition}
            value={value}
            onChange={onChange}
            variables={variables}
            inlineActions={expressionInputInlineActions}
          />
        ) : (
          children
        )}
      </WorkspaceSection>
    );
  }

  return (
    <AccordionItem
      hasError={hasError}
      isStepped={isStepped}
      isDisabled={disabled && !loading}
      isOpen={isOpen && !disabled}
      isLoadingWave={isTitleWaveLoading}
      data-loading-wave={isTitleWaveLoading || undefined}
      aria-busy={loading}
    >
      <AccordionHeader
        isStepped={isStepped}
        isDisabled={disabled && !loading}
        isOpen={isOpen && !disabled}
      >
        <AccordionHeaderMain
          type='button'
          onClick={onToggle}
          aria-expanded={isOpen && !disabled}
          disabled={disabled}
          isStepped={isStepped}
        >
          {isStepped ? (
            <StepIndicator
              completed={completed}
              isDisabled={disabled && !loading}
              isOpen={isOpen && !disabled}
            >
              {completed ? (
                <CheckRoundedIcon
                  sx={{
                    fontSize: 14,
                    stroke: 'currentColor',
                    strokeWidth: 1,
                  }}
                />
              ) : (
                stepNumber
              )}
            </StepIndicator>
          ) : null}

          <InputIcon
            isActive={isOpen || isExpressionMode || completed}
            hasError={hasError}
            isDisabled={disabled && !loading}
            isStepped={isStepped}
          >
            {icon}
          </InputIcon>

          <HeaderText>
            <HeaderTitleRow>
              <HeaderTitle
                isStepped={isStepped}
                isDisabled={disabled && !loading}
                isLoadingWave={isTitleWaveLoading}
              >
                {title}
              </HeaderTitle>
              {required && (
                <Typography component='span' sx={{ color: 'error.main' }}>
                  *
                </Typography>
              )}
              {badge}
              {disabled && disabledReason && !isTitleWaveLoading ? (
                <DisabledReason
                  isLoading={loading}
                  title={
                    typeof disabledReason === 'string'
                      ? disabledReason
                      : undefined
                  }
                >
                  {disabledReason}
                </DisabledReason>
              ) : null}
            </HeaderTitleRow>

            {description ? (
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                {description}
              </Typography>
            ) : null}
          </HeaderText>
        </AccordionHeaderMain>

        <HeaderActions>
          {!disabled && !isOpen && collapsedValue ? (
            <CollapsedValueBox
              title={String(collapsedValue)}
              completed={completed}
              isDisabled={disabled}
              {...(collapsedValueFontSize
                ? { sx: { fontSize: collapsedValueFontSize } }
                : {})}
            >
              {collapsedValueIcon}
              <Box
                component='span'
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {collapsedValue}
              </Box>
            </CollapsedValueBox>
          ) : null}

          {inputDefinition?.allow_expressions ? (
            <Tooltip
              title={
                isExpressionMode
                  ? 'Вернуться к специализированному режиму'
                  : 'Перейти в expression mode'
              }
            >
              <HeaderActionButton
                size='small'
                onClick={handleExpressionModeToggle}
                aria-label='Переключить expression mode'
                disabled={disabled}
                isStepped={isStepped}
                sx={{
                  borderRadius: '6px',
                }}
              >
                {codeIconNode}
              </HeaderActionButton>
            </Tooltip>
          ) : null}

          {disabled ? (
            isTitleWaveLoading ? null : (
              <HeaderActionButton
                size='small'
                disabled
                aria-label={loading ? 'Загрузка данных' : 'Секция недоступна'}
                isStepped={isStepped}
                sx={{
                  color: loading ? 'primary.main' : 'text.disabled',
                  '&.Mui-disabled': {
                    color: loading ? 'primary.main' : 'text.disabled',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress color='inherit' size={16} thickness={5} />
                ) : (
                  <LockOutlinedIcon sx={{ fontSize: 16 }} />
                )}
              </HeaderActionButton>
            )
          ) : (
            <HeaderActionButton
              size='small'
              onClick={onToggle}
              aria-label={isOpen ? 'Свернуть секцию' : 'Развернуть секцию'}
              isStepped={isStepped}
              sx={{
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <ExpandMoreIcon
                sx={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: isStepped ? 'none' : 'transform 0.2s ease',
                }}
              />
            </HeaderActionButton>
          )}
        </HeaderActions>
      </AccordionHeader>

      <Collapse
        in={isOpen && !disabled}
        timeout={isStepped ? 0 : undefined}
        mountOnEnter={unmountOnExit}
        unmountOnExit={unmountOnExit}
      >
        <Content isStepped={isStepped}>
          {isExpressionMode ? (
            <PrimitiveNodeInput
              inputDefinition={inputDefinition}
              value={value}
              onChange={onChange}
              variables={variables}
              inlineActions={expressionInputInlineActions}
            />
          ) : (
            children
          )}
        </Content>
      </Collapse>
    </AccordionItem>
  );
};
