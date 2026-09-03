import React, { memo, useMemo } from 'react';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { isPrimitiveIOType } from '@/entities/node/node-io';

import {
  type DataFrameMetadata,
  type InputDefinitionModel,
  type NodeMetadata,
} from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import { TemplateMonacoInput } from '@/shared/ui/node-input';
import PrimitiveNodeInput from '@/shared/ui/node-input/PrimitiveNodeInput';

import { ColumnNameNodeInput, ListNodeInput, LiteralNodeInput } from './inputs';

interface NodeDataInputProps {
  nodeID: string;
  inputDefinition: InputDefinitionModel;
  currentValue: unknown;
  onValueChange: (newValue: unknown) => void;
  variables?: VariableOutput[];
  renderMode?: 'editor' | 'canvas' | undefined;
}

type NodeOutputMetadata = Exclude<NodeMetadata[string], null>;

const isDataFrameMetadata = (
  metadata: NodeOutputMetadata | null | undefined
): metadata is DataFrameMetadata => {
  if (!metadata) return false;
  if (metadata.type === 'DATAFRAME') return true;
  return Array.isArray((metadata as { columns?: unknown }).columns);
};

const NodeDataInput_: React.FC<NodeDataInputProps> = ({
  nodeID,
  inputDefinition,
  currentValue,
  onValueChange,
  variables = [],
  renderMode = 'editor',
}) => {
  const { type, is_list_type, is_literal_type } = inputDefinition;
  const { getConnectedInputMetadata, connectedMetadataByInputName } =
    useNodeConnections(nodeID);

  const metadataSourceCandidates = useMemo(() => {
    const candidates = [
      inputDefinition.metadata_source_field,
      inputDefinition.attr_name,
      'df',
    ].filter((candidate): candidate is string => Boolean(candidate));

    return Array.from(new Set(candidates));
  }, [inputDefinition.metadata_source_field, inputDefinition.attr_name]);

  const connectedInputMetadata = useMemo(() => {
    for (const inputName of metadataSourceCandidates) {
      const metadata = getConnectedInputMetadata(
        inputName
      ) as NodeOutputMetadata | null;
      if (isDataFrameMetadata(metadata)) {
        return metadata;
      }
    }

    const fallbackMetadata = Object.values(
      connectedMetadataByInputName ?? {}
    ).find(metadata => isDataFrameMetadata(metadata));

    return fallbackMetadata ?? null;
  }, [
    connectedMetadataByInputName,
    getConnectedInputMetadata,
    metadataSourceCandidates,
  ]);

  if (type === 'COLUMN_NAME') {
    return (
      <ColumnNameNodeInput
        inputDefinition={inputDefinition}
        currentValue={currentValue as string | string[] | null | undefined}
        onChange={
          onValueChange as (value: string | string[] | null | undefined) => void
        }
        columns={connectedInputMetadata?.columns ?? []}
        hasMetadata={Boolean(connectedInputMetadata)}
      />
    );
  }

  if (is_literal_type) {
    return (
      <LiteralNodeInput
        nodeId={nodeID}
        inputDefinition={inputDefinition}
        currentValue={currentValue}
        onChange={onValueChange}
      />
    );
  }

  if (is_list_type) {
    const listValue = Array.isArray(currentValue)
      ? currentValue
      : Array.isArray(inputDefinition.default)
        ? inputDefinition.default
        : [];

    return (
      <ListNodeInput
        nodeId={nodeID}
        inputDefinition={inputDefinition}
        currentValue={listValue}
        onChange={onValueChange}
      />
    );
  }

  if (isPrimitiveIOType(type)) {
    if (
      inputDefinition.multiline &&
      (type === 'STRING' || type === 'PRIMITIVE')
    ) {
      const helperText = inputDefinition.allow_expressions
        ? 'Template suggestions появляются только внутри {{ ... }}.'
        : undefined;

      return (
        <TemplateMonacoInput
          value={currentValue}
          onChange={onValueChange}
          variables={variables}
          allowExpressions={Boolean(inputDefinition.allow_expressions)}
          expressionPolicyName={inputDefinition.expression_policy}
          renderMode={renderMode}
          language='plaintext'
          {...(helperText ? { helperText } : {})}
        />
      );
    }

    return (
      <PrimitiveNodeInput
        inputDefinition={inputDefinition}
        value={currentValue}
        onChange={onValueChange}
        variables={variables}
        renderMode={renderMode}
      />
    );
  }

  return null;
};

export const NodeDataInput = memo(NodeDataInput_);
