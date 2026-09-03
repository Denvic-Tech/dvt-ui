import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Tooltip } from '@mui/material';

import { useFileStorageManagerViewer } from '@/entities/node/file-storage-manager-viewer';

import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import { getClearedValueByType, parseConstValue } from '@/shared/lib/node-io';
import {
  filterVariablesByTypes,
  HighlightedSingleLineFieldV2,
} from '@/shared/ui/node-input';
import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
} from '@/shared/ui/node-input/HighlightedSingleLineField.shared';
import { buildSingleExpressionValue } from '@/shared/ui/node-input/primitiveExpression';
import { useExpressionsConfigContext } from '@/shared/ui/node-input/useExpressionsConfigContext';

import {
  EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES,
  FileStorageTargetPathSectionProps,
  getLiteralPathPlaceholder,
  resolveTone,
} from './FileStorageTargetPathSection.helpers';
import {
  ExpressionIcon,
  FolderIcon,
  InfoIcon,
} from './FileStorageTargetPathSection.icons';
import {
  BrowseButton,
  ExpressionInputShell,
  ExpressionToggleButton,
  FieldHint,
  FooterText,
  HeaderSpacer,
  IconBox,
  ModeToggleButton,
  ModeToggleGroup,
  PathFieldRow,
  PathInput,
  SectionDescription,
  SectionHeader,
  SectionRoot,
  SectionTitle,
  TitleGroup,
} from './FileStorageTargetPathSection.styles';

export const FileStorageTargetPathSection = ({
  allowedFileExts,
  connectionMetadata,
  description,
  errorText = null,
  extension,
  inputDefinition,
  literalPlaceholder,
  footerText,
  mapPickerSelectionToValue,
  mode = null,
  modeOptions,
  onChange,
  onModeChange,
  pickerConfirmLabel,
  pickerKind = 'save_target',
  pickerSelectedPath,
  pickerSelectionMode = 'file_or_folder',
  pickerState,
  pickerDescription,
  pickerExtension,
  pickerTitle,
  browseTooltip,
  title,
  titleHint,
  value,
  variables,
}: FileStorageTargetPathSectionProps) => {
  const { expressionsConfig } = useExpressionsConfigContext();
  const { openPicker } = useFileStorageManagerViewer();

  const expressionValue = useMemo(() => {
    if (isExpressionValue(value) && value.expression_kind === 'single') {
      return value;
    }

    return null;
  }, [value]);
  const isExpressionMode = expressionValue !== null;
  const literalPath = typeof value === 'string' ? value : '';

  const lastLiteralValueRef = useRef<unknown>(undefined);
  const hasLiteralSnapshotRef = useRef(false);

  useEffect(() => {
    if (isExpressionMode) {
      return;
    }

    lastLiteralValueRef.current = value;
    hasLiteralSnapshotRef.current = true;
  }, [isExpressionMode, value]);

  const expressionAutocompleteVariables = useMemo(
    () =>
      filterVariablesByTypes(
        variables ?? [],
        EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES
      ),
    [variables]
  );

  const expressionAutocompleteCatalog = useMemo(() => {
    if (!inputDefinition?.allow_expressions) {
      return buildExpressionAutocompleteCatalog({
        variables: [],
        inputType: inputDefinition?.type,
      });
    }

    return buildExpressionAutocompleteCatalog({
      variables: expressionAutocompleteVariables,
      inputType: inputDefinition?.type,
      expressionsConfig,
      expressionPolicyName: inputDefinition.expression_policy,
    });
  }, [
    expressionAutocompleteVariables,
    expressionsConfig,
    inputDefinition?.allow_expressions,
    inputDefinition?.expression_policy,
    inputDefinition?.type,
  ]);

  const expressionDiagnostics = useMemo(() => {
    if (!expressionValue) {
      return [];
    }

    return getInlineExpressionDiagnostics(`=${expressionValue.value}`, {
      variables: variables ?? [],
      inputType: inputDefinition?.type,
      expressionsConfig,
      expressionPolicyName: inputDefinition?.expression_policy,
    });
  }, [
    expressionValue,
    expressionsConfig,
    inputDefinition?.expression_policy,
    inputDefinition?.type,
    variables,
  ]);

  const expressionErrorText =
    expressionDiagnostics.find(diagnostic => diagnostic.severity === 'error')
      ?.message ?? null;
  const expressionWarningText =
    expressionDiagnostics.find(diagnostic => diagnostic.severity === 'warning')
      ?.message ?? null;

  const handleExpressionModeToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!inputDefinition?.allow_expressions) {
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
    [inputDefinition, isExpressionMode, onChange, value]
  );

  const handleLiteralPathChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextText = event.target.value;

      if (inputDefinition?.allow_expressions && nextText.startsWith('=')) {
        onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
        return;
      }

      onChange(parseConstValue(nextText, inputDefinition));
    },
    [inputDefinition, onChange]
  );

  const handleExpressionPathChange = useCallback(
    (nextText: string) => {
      if (!nextText.startsWith('=')) {
        onChange(parseConstValue(nextText, inputDefinition));
        return;
      }

      onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
    },
    [inputDefinition, onChange]
  );

  const handleBrowseClick = useCallback(() => {
    if (!pickerState.canBrowse || !pickerState.connectionID) {
      return;
    }

    void (async () => {
      const pickerOptions = {
        connectionID: pickerState.connectionID,
        connectionContext: pickerState.connectionContext,
        kind: pickerKind,
        selectionMode: pickerSelectionMode,
        selectedPath:
          pickerSelectedPath === undefined
            ? pickerState.resolvedPathValue
            : pickerSelectedPath,
        allowedFileExts,
        description:
          pickerDescription ??
          'Выберите папку в дереве — имя файла наберите прямо в строке пути ниже.',
        confirmLabel: pickerConfirmLabel ?? 'Сохранить сюда',
      } as Parameters<typeof openPicker>[0];

      const resolvedTitle =
        pickerTitle ?? title ?? inputDefinition?.display_name;
      if (resolvedTitle !== undefined) {
        pickerOptions.title = resolvedTitle;
      }

      const resolvedPickerExtension =
        pickerExtension === undefined ? extension : pickerExtension;
      if (
        resolvedPickerExtension !== undefined &&
        resolvedPickerExtension !== null
      ) {
        pickerOptions.extension = resolvedPickerExtension;
      }

      const selection = await openPicker(pickerOptions);
      if (!selection) {
        return;
      }

      onChange(
        mapPickerSelectionToValue
          ? mapPickerSelectionToValue(selection)
          : selection.path
      );
    })();
  }, [
    allowedFileExts,
    mapPickerSelectionToValue,
    extension,
    inputDefinition?.display_name,
    onChange,
    openPicker,
    pickerConfirmLabel,
    pickerKind,
    pickerSelectedPath,
    pickerSelectionMode,
    pickerState.canBrowse,
    pickerState.connectionContext,
    pickerState.connectionID,
    pickerState.resolvedPathValue,
    pickerDescription,
    pickerExtension,
    pickerTitle,
    title,
  ]);

  const supportText =
    errorText ?? expressionErrorText ?? expressionWarningText ?? null;
  const tone = resolveTone(
    errorText ?? expressionErrorText,
    expressionWarningText
  );
  const resolvedBrowseTooltip = pickerState.canBrowse
    ? (browseTooltip ?? 'Открыть выбор полного пути сохранения')
    : pickerState.disabledReason;
  const resolvedLiteralPlaceholder =
    literalPlaceholder ??
    getLiteralPathPlaceholder(connectionMetadata?.type, extension);

  return (
    <SectionRoot>
      <SectionHeader>
        <TitleGroup>
          <SectionTitle>
            {title ?? inputDefinition?.display_name ?? 'Путь назначения'}
          </SectionTitle>
          {titleHint}
        </TitleGroup>
        <HeaderSpacer />
        {inputDefinition?.allow_expressions ? (
          <ExpressionToggleButton
            active={isExpressionMode}
            onClick={handleExpressionModeToggle}
            type='button'
          >
            <ExpressionIcon
              size={13}
              color={isExpressionMode ? '#4f46e5' : '#94a3b8'}
            />
            Режим выражения
          </ExpressionToggleButton>
        ) : null}
      </SectionHeader>

      {description ? (
        <SectionDescription>{description}</SectionDescription>
      ) : null}

      {modeOptions?.length && onModeChange ? (
        <ModeToggleGroup>
          {modeOptions.map(option => {
            const button = (
              <ModeToggleButton
                type='button'
                active={mode === option.value}
                disabled={option.disabled}
                onClick={() => onModeChange(option.value)}
              >
                {option.label}
              </ModeToggleButton>
            );

            return option.disabled && option.disabledReason ? (
              <Tooltip
                key={option.value}
                describeChild
                title={option.disabledReason}
              >
                <span style={{ display: 'inline-flex' }}>{button}</span>
              </Tooltip>
            ) : (
              React.cloneElement(button, { key: option.value })
            );
          })}
        </ModeToggleGroup>
      ) : null}

      <PathFieldRow expr={isExpressionMode} hasError={tone === 'error'}>
        <IconBox>
          {isExpressionMode ? (
            <ExpressionIcon size={15} color='#4f46e5' />
          ) : (
            <FolderIcon size={16} color='#6366f1' />
          )}
        </IconBox>

        {isExpressionMode ? (
          <ExpressionInputShell>
            <HighlightedSingleLineFieldV2
              value={expressionValue ? `=${expressionValue.value}` : '='}
              onChange={handleExpressionPathChange}
              placeholder='${expression}'
              variables={variables ?? []}
              autocompleteCatalog={expressionAutocompleteCatalog}
              autoFormatOnBlur
              diagnostics={expressionDiagnostics}
            />
          </ExpressionInputShell>
        ) : (
          <PathInput
            expr={false}
            value={literalPath}
            onChange={handleLiteralPathChange}
            placeholder={resolvedLiteralPlaceholder}
          />
        )}

        <Tooltip title={resolvedBrowseTooltip}>
          <span>
            <BrowseButton
              type='button'
              onClick={handleBrowseClick}
              disabled={!pickerState.canBrowse}
            >
              <FolderIcon size={14} color='#6366f1' />
              Обзор
            </BrowseButton>
          </span>
        </Tooltip>
      </PathFieldRow>

      {supportText ? (
        <FieldHint tone={tone}>
          <InfoIcon
            size={13}
            color={
              tone === 'error'
                ? '#ef4444'
                : tone === 'warning'
                  ? '#d97706'
                  : '#94a3b8'
            }
          />
          {supportText}
        </FieldHint>
      ) : null}
      {footerText ? <FooterText>{footerText}</FooterText> : null}
    </SectionRoot>
  );
};
