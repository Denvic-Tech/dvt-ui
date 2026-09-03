import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExecuteProjectValues } from '../types';

import { ExecuteProjectEditor } from './ExecuteProjectEditor';

const mocks = vi.hoisted(() => ({
  connectedInputs: null as Record<string, unknown> | null,
}));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({ connectedInputs: mocks.connectedInputs }),
}));

vi.mock('@/entities/project/projects', () => ({
  useCurrentProject: () => ({ currentProject: null }),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    projects: {
      get: vi.fn().mockResolvedValue({ data: [] }),
    },
  },
}));

const EditorHarness = ({
  initialValues,
}: {
  initialValues: ExecuteProjectValues;
}) => {
  const [localInputData, setLocalInputData] =
    useState<ExecuteProjectValues>(initialValues);

  return (
    <>
      <ExecuteProjectEditor
        projectID='project-1'
        id='execute-project-1'
        data={{} as never}
        isOpen
        nodeDefinition={{ name: 'ExecuteProject' } as never}
        localInputData={localInputData}
        setLocalInputData={setLocalInputData}
        variables={[]}
      />
      <output data-testid='input-values'>
        {JSON.stringify(localInputData)}
      </output>
    </>
  );
};

describe('ExecuteProjectEditor', () => {
  beforeEach(() => {
    mocks.connectedInputs = null;
  });

  it('does not render a redundant editor header', () => {
    render(<EditorHarness initialValues={{}} />);

    expect(screen.queryByText('Параметры запуска')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Настройка выполнения вложенного проекта')
    ).not.toBeInTheDocument();
  });

  it('requires waiting while variables_df is connected', async () => {
    mocks.connectedInputs = {
      variables_df: { nodeID: 'variables-node', outputName: 'df' },
    };

    render(<EditorHarness initialValues={{ wait_for_completion: false }} />);

    const waitToggle = screen.getByRole('button', {
      name: 'Ожидать выполнение',
    });

    expect(waitToggle).toBeDisabled();
    expect(waitToggle).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText(/При подключённом входе с переменными нельзя отключить/)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('input-values')).toHaveTextContent(
        '"wait_for_completion":true'
      );
    });
  });

  it('allows changing the waiting option without variables_df', () => {
    render(<EditorHarness initialValues={{ wait_for_completion: true }} />);

    const waitToggle = screen.getByRole('button', {
      name: 'Ожидать выполнение',
    });

    expect(waitToggle).toBeEnabled();
    fireEvent.click(waitToggle);
    expect(waitToggle).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.queryByText(
        /При подключённом входе с переменными нельзя отключить/
      )
    ).not.toBeInTheDocument();
  });

  it('changes variable policies through the shared dropdown control', () => {
    render(<EditorHarness initialValues={{}} />);

    fireEvent.mouseDown(
      screen.getByRole('button', { name: 'Неразрешённые переменные' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Пропустить переменную' })
    );

    expect(screen.getByTestId('input-values')).toHaveTextContent(
      '"unresolved_variables_policy":"skip"'
    );
  });
});
