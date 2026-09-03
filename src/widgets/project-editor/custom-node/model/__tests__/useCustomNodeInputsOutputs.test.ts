import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  sortIoDefinitionsBySpecialTypesLast,
  useCustomNodeInputsOutputs,
} from '@/widgets/project-editor/custom-node/model/useCustomNodeInputsOutputs';

describe('widgets/custom-node/useCustomNodeInputsOutputs', () => {
  it('hides SIGNAL input definitions when showSignalIO is false', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'signal', type: 'SIGNAL', is_hidden: false },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        showSignalIO: false,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main']);
  });

  it('shows SIGNAL input definitions when showSignalIO is true', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'signal', type: 'SIGNAL', is_hidden: false },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        showSignalIO: true,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main', 'signal']);
  });

  it('shows connected SIGNAL input definitions when showSignalIO is false', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'signal_in', type: 'SIGNAL', is_hidden: false },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        showSignalIO: false,
        connectedInputNamesSet: new Set(['signal_in']),
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main', 'signal_in']);
  });

  it('reveals only SIGNAL input definitions for temporary input-side visibility', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'signal_in', type: 'SIGNAL', is_hidden: false },
    ] as any;
    const outputDefinitions = [
      { attr_name: 'main_out', type: 'DATAFRAME' },
      { attr_name: 'signal_out', type: 'SIGNAL' },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        outputDefinitions,
        showSignalIO: false,
        showSignalInputDefinitions: true,
        showSignalOutputDefinitions: false,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main', 'signal_in']);
    expect(
      result.current.visibleOutputDefinitions.map(
        outputDefinition => outputDefinition.attr_name
      )
    ).toEqual(['main_out']);
  });

  it('reveals only VARIABLE output definitions for temporary output-side visibility', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'variable_in', type: 'VARIABLE', is_hidden: false },
      { attr_name: 'input_variables', type: 'VARIABLE', is_hidden: false },
    ] as any;
    const outputDefinitions = [
      { attr_name: 'main_out', type: 'DATAFRAME' },
      { attr_name: 'variable_out', type: 'VARIABLE' },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        outputDefinitions,
        showVariablesIO: false,
        showVariableInputDefinitions: false,
        showVariableOutputDefinitions: true,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main']);
    expect(result.current.variablesInputDefinition).toBeNull();
    expect(
      result.current.visibleOutputDefinitions.map(
        outputDefinition => outputDefinition.attr_name
      )
    ).toEqual(['main_out', 'variable_out']);
  });

  it('hides disconnected VARIABLE IO when showVariablesIO is false', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'variable_in', type: 'VARIABLE', is_hidden: false },
      { attr_name: 'input_variables', type: 'VARIABLE', is_hidden: false },
    ] as any;
    const outputDefinitions = [
      { attr_name: 'main_out', type: 'DATAFRAME' },
      { attr_name: 'variable_out', type: 'VARIABLE' },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        outputDefinitions,
        showVariablesIO: false,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main']);
    expect(result.current.variablesInputDefinition).toBeNull();
    expect(
      result.current.visibleOutputDefinitions.map(
        outputDefinition => outputDefinition.attr_name
      )
    ).toEqual(['main_out']);
  });

  it('keeps connected VARIABLE IO visible when showVariablesIO is false', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'variable_in', type: 'VARIABLE', is_hidden: false },
      { attr_name: 'input_variables', type: 'VARIABLE', is_hidden: false },
    ] as any;
    const outputDefinitions = [
      { attr_name: 'main_out', type: 'DATAFRAME' },
      { attr_name: 'variable_out', type: 'VARIABLE' },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        outputDefinitions,
        showVariablesIO: false,
        connectedInputNamesSet: new Set(['variable_in', 'input_variables']),
        connectedOutputNamesSet: new Set(['variable_out']),
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main', 'variable_in']);
    expect(result.current.variablesInputDefinition?.attr_name).toBe(
      'input_variables'
    );
    expect(
      result.current.visibleOutputDefinitions.map(
        outputDefinition => outputDefinition.attr_name
      )
    ).toEqual(['main_out', 'variable_out']);
  });

  it('shows VARIABLE IO when showVariablesIO is true', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'variable_in', type: 'VARIABLE', is_hidden: false },
      { attr_name: 'input_variables', type: 'VARIABLE', is_hidden: false },
    ] as any;
    const outputDefinitions = [
      { attr_name: 'main_out', type: 'DATAFRAME' },
      { attr_name: 'variable_out', type: 'VARIABLE' },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        outputDefinitions,
        showVariablesIO: true,
      })
    );

    expect(
      result.current.visibleInputDefinitions.map(
        inputDefinition => inputDefinition.attr_name
      )
    ).toEqual(['main', 'variable_in']);
    expect(result.current.variablesInputDefinition?.attr_name).toBe(
      'input_variables'
    );
    expect(
      result.current.visibleOutputDefinitions.map(
        outputDefinition => outputDefinition.attr_name
      )
    ).toEqual(['main_out', 'variable_out']);
  });

  it('sorts VARIABLE and SIGNAL definitions to the end', () => {
    const sorted = sortIoDefinitionsBySpecialTypesLast<{
      attr_name: string;
      type: any;
    }>([
      { attr_name: 'int', type: 'INT' },
      { attr_name: 'signal', type: 'SIGNAL' },
      { attr_name: 'df', type: 'DATAFRAME' },
      { attr_name: 'output_variables', type: 'VARIABLE' },
    ]);

    expect(sorted.map(definition => definition.attr_name)).toEqual([
      'int',
      'df',
      'output_variables',
      'signal',
    ]);
  });

  it('keeps legacy variables alias supported for input peek definition', () => {
    const inputDefinitions = [
      { attr_name: 'main', type: 'DATAFRAME', is_hidden: false },
      { attr_name: 'variables', type: 'VARIABLE', is_hidden: false },
    ] as any;

    const { result } = renderHook(() =>
      useCustomNodeInputsOutputs({
        inputDefinitions,
        showVariablesIO: false,
        connectedInputNamesSet: new Set(['variables']),
      })
    );

    expect(result.current.variablesInputDefinition?.attr_name).toBe(
      'variables'
    );
  });
});
