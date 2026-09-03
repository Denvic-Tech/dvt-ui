import React, { useCallback, useMemo } from 'react';
import { Alert, Grid2 as Grid, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  type NodeModalExtensionProps,
  useNodeInputDefinitionExtensions,
} from '@/app/providers/node-extensions';

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';
import { useNodeValidation } from '@/features/node/validate-node';

import { isWidgetType } from '@/entities/node/node-io';

import {
  isInputValue,
  makeConst,
  unwrapInputValue,
} from '@/shared/lib/node-input-values';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

export const NodeDefaultEditor: React.FC<NodeModalExtensionProps> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
  inputVariables,
  projectVariables,
}) => {
  const { validationErrors, clearFieldError } = useNodeValidation(
    nodeDefinition,
    localInputData,
    setValidationCallback
  );

  const inputDefinitionsForDraw = useMemo(
    () =>
      Object.values(nodeDefinition.input_definitions ?? {}).filter(inputDef =>
        isWidgetType(inputDef.type)
      ),
    [nodeDefinition.input_definitions]
  );

  const inputExtensionsMap = useNodeInputDefinitionExtensions(
    nodeDefinition,
    'modal'
  );

  const handleInputDataChange = useCallback(
    (inputName: string, value: unknown) => {
      setLocalInputData(prev => ({
        ...prev,
        [inputName]: value,
      }));

      clearFieldError(inputName);
    },
    [setLocalInputData, clearFieldError]
  );

  return (
    <Paper
      variant='outlined'
      sx={theme => ({
        p: 2.5,
        borderRadius: getRadius(theme),
        borderColor: theme.palette.divider,
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        boxShadow: 'none',
      })}
    >
      {validationErrors['_general'] && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {validationErrors['_general'].join(', ')}
        </Alert>
      )}

      {inputDefinitionsForDraw.map(inputDefinition => {
        const fieldErrors = validationErrors[inputDefinition.attr_name];
        const currentValue = localInputData[inputDefinition.attr_name];
        const inputExtension = inputExtensionsMap.get(
          inputDefinition.attr_name
        );

        return (
          <Grid
            key={inputDefinition.attr_name}
            container
            spacing={1}
            sx={{ mb: 1 }}
          >
            {inputExtension ? (
              <inputExtension.component
                nodeId={nodeID}
                nodeName={nodeDefinition.name}
                inputDefinition={inputDefinition}
                value={
                  isInputValue(currentValue)
                    ? currentValue
                    : makeConst(currentValue)
                }
                onChange={newValue =>
                  handleInputDataChange(
                    inputDefinition.attr_name,
                    unwrapInputValue(newValue)
                  )
                }
                context='modal'
                errors={fieldErrors}
                variables={variables}
                inputVariables={inputVariables}
                projectVariables={projectVariables}
              />
            ) : (
              <>
                <Grid size={3}>
                  <Typography
                    sx={{
                      pt: 1.25,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'text.secondary',
                    }}
                  >
                    {inputDefinition.display_name || inputDefinition.attr_name}
                  </Typography>
                </Grid>
                <Grid size={9}>
                  <NodeDataInput
                    nodeID={nodeID}
                    inputDefinition={inputDefinition}
                    currentValue={currentValue}
                    variables={variables}
                    onValueChange={newValue =>
                      handleInputDataChange(inputDefinition.attr_name, newValue)
                    }
                  />
                  {fieldErrors && fieldErrors.length > 0 && (
                    <Alert severity='error' sx={{ mt: 1 }}>
                      {fieldErrors.join(', ')}
                    </Alert>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        );
      })}
    </Paper>
  );
};

export default NodeDefaultEditor;
