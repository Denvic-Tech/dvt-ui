import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NodeModalStepperRenderer } from '../StepperModalRenderer';

vi.mock('@/features/node/get-node-metadata', () => ({
  useNodeMetadata: () => ({ nodeMetadataActuality: true }),
}));

const StepOne = () => <div>step one</div>;
const StepTwo = () => <div>step two</div>;

const baseProps = {
  isOpen: true,
  projectID: 'project-1',
  id: 'node-1',
  data: {} as any,
  nodeDefinition: {
    name: 'WriteDataFrameToDBV4',
    input_definitions: {},
  } as any,
  localInputData: {},
  setLocalInputData: vi.fn(),
  setValidationCallback: vi.fn(),
  setValidationErrors: vi.fn(),
  variables: [],
};

describe('NodeModalStepperRenderer', () => {
  it('passes the current project ID to the loading condition', async () => {
    const loadingCondition = vi.fn(() => true);

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              component: StepOne,
              loadingCondition,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    await waitFor(() => expect(loadingCondition).toHaveBeenCalled());
    expect(loadingCondition).toHaveBeenCalledWith(
      expect.objectContaining({ projectID: 'project-1' })
    );
  });

  it('stays on the current step when onContinue returns false', async () => {
    const onContinue = vi.fn(async () => false);

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              component: StepOne,
              condition: () => true,
              onContinue,
            },
            {
              id: 'step-2',
              component: StepTwo,
              condition: () => true,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    const continueButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/continue-button'
    );
    await waitFor(() => expect(continueButton).not.toBeDisabled());

    fireEvent.click(continueButton);

    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(screen.getByText('step one')).toBeInTheDocument();
    expect(screen.queryByText('step two')).not.toBeInTheDocument();
  });

  it('passes onBeforeFinish only from the last step', async () => {
    const onBeforeFinish = vi.fn(async () => true);
    const onFinish = vi.fn(async beforeFinish => {
      if (beforeFinish) {
        await beforeFinish({ table_name: 'orders' } as any);
      }
    });

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              label: 'Step 1',
              component: StepOne,
              condition: () => true,
            },
            {
              id: 'step-2',
              label: 'Step 2',
              component: StepTwo,
              condition: () => true,
              onBeforeFinish,
            },
          ],
        }}
        onFinish={onFinish}
      />
    );

    const continueButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/continue-button'
    );

    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });

    fireEvent.click(continueButton);

    expect(onFinish).not.toHaveBeenCalled();
    expect(onBeforeFinish).not.toHaveBeenCalled();

    const saveButton = await screen.findByTestId(
      'widgets/project-editor/node-data-modal/save-button'
    );

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onBeforeFinish).toHaveBeenCalledTimes(1);
    });
  });

  it('disables repeated save while finalization is running', async () => {
    let resolveFinish: (() => void) | undefined;
    const onBeforeFinish = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveFinish = () => resolve();
        })
    );
    const onFinish = vi.fn(async beforeFinish => {
      if (beforeFinish) {
        await beforeFinish({ table_name: 'orders' } as any);
      }
    });

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              label: 'Step 1',
              component: StepOne,
              condition: () => true,
              onBeforeFinish,
            },
          ],
        }}
        onFinish={onFinish}
      />
    );

    const saveButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/save-button'
    );

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(saveButton).toBeDisabled();
    });

    fireEvent.click(saveButton);
    expect(onFinish).toHaveBeenCalledTimes(1);

    if (resolveFinish) {
      resolveFinish();
    }

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
  it('renders a separate finish overlay while onBeforeFinish is pending', async () => {
    let resolveBeforeFinish: (() => void) | undefined;
    const onBeforeFinish = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveBeforeFinish = resolve;
        })
    );
    const onFinish = vi.fn(async beforeFinish => {
      if (beforeFinish) {
        await beforeFinish({ table_name: 'orders' } as any);
      }
    });
    const FinishOverlay = () => (
      <div data-testid='finish-overlay'>Создание таблицы выполняется...</div>
    );

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'write-settings',
              component: StepTwo,
              condition: () => true,
              onBeforeFinish,
              finishOverlay: FinishOverlay,
            },
          ],
        }}
        onFinish={onFinish}
      />
    );

    const saveButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/save-button'
    );
    await waitFor(() => expect(saveButton).not.toBeDisabled());

    fireEvent.click(saveButton);

    expect(await screen.findByTestId('finish-overlay')).toBeInTheDocument();
    expect(screen.queryByText('step two')).not.toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    resolveBeforeFinish?.();

    await waitFor(() => {
      expect(screen.queryByTestId('finish-overlay')).not.toBeInTheDocument();
    });
  });

  it('uses a custom label for the final step action', async () => {
    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'write-settings',
              component: StepTwo,
              condition: () => true,
              getContinueLabel: () => 'Применить и сохранить',
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    expect(
      screen.getByTestId('widgets/project-editor/node-data-modal/save-button')
    ).toHaveTextContent('Применить и сохранить');
  });

  it('enables footer back on a finish overlay that allows it and runs its action', async () => {
    const onBackFromOverlay = vi.fn();
    const FinishOverlay = () => <div>create table failed</div>;

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'write-settings',
              component: StepTwo,
              condition: () => true,
              finishOverlay: FinishOverlay,
              shouldShowFinishOverlay: () => true,
              canGoBackFromOverlay: () => true,
              onBackFromOverlay,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    expect(screen.getByText('create table failed')).toBeInTheDocument();
    const backButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/back-button'
    );
    expect(backButton).not.toBeDisabled();

    fireEvent.click(backButton);
    expect(onBackFromOverlay).toHaveBeenCalledTimes(1);
  });

  it('keeps footer back disabled on an overlay that does not allow it', async () => {
    const FinishOverlay = () => <div>creating table</div>;

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              component: StepOne,
              condition: () => true,
            },
            {
              id: 'write-settings',
              component: StepTwo,
              condition: () => true,
              finishOverlay: FinishOverlay,
              shouldShowFinishOverlay: () => true,
              canGoBackFromOverlay: () => false,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    const continueButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/continue-button'
    );
    await waitFor(() => expect(continueButton).not.toBeDisabled());
    fireEvent.click(continueButton);

    // Второй шаг открыт, но виден его оверлей без разрешения «Назад».
    expect(await screen.findByText('creating table')).toBeInTheDocument();
    expect(
      screen.getByTestId('widgets/project-editor/node-data-modal/back-button')
    ).toBeDisabled();
  });

  it('goes to the previous step from a loading overlay error by default', async () => {
    const LoadingOverlay = () => <div>schema changes failed</div>;

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              component: StepOne,
              condition: () => true,
            },
            {
              id: 'step-2',
              component: StepTwo,
              condition: () => true,
              loadingCondition: async () => false,
              loadingOverlay: LoadingOverlay,
              canGoBackFromOverlay: () => true,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    const continueButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/continue-button'
    );
    await waitFor(() => expect(continueButton).not.toBeDisabled());
    fireEvent.click(continueButton);

    expect(
      await screen.findByText('schema changes failed')
    ).toBeInTheDocument();
    const backButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/back-button'
    );
    await waitFor(() => expect(backButton).not.toBeDisabled());

    fireEvent.click(backButton);
    expect(await screen.findByText('step one')).toBeInTheDocument();
  });

  it('skips a guarded loading overlay when no async operation is pending', async () => {
    const loadingCondition = vi.fn(async () => false);
    const LoadingOverlay = () => <div>schema changes loading</div>;

    render(
      <NodeModalStepperRenderer
        {...baseProps}
        extension={{
          id: 'write-stepper',
          name: 'Write Stepper',
          type: 'modal_stepper',
          condition: () => true,
          steps: [
            {
              id: 'step-1',
              component: StepOne,
              condition: () => true,
            },
            {
              id: 'step-2',
              component: StepTwo,
              condition: () => true,
              loadingCondition,
              shouldShowLoadingOverlay: () => false,
              loadingOverlay: LoadingOverlay,
            },
          ],
        }}
        onFinish={vi.fn()}
      />
    );

    const continueButton = screen.getByTestId(
      'widgets/project-editor/node-data-modal/continue-button'
    );
    await waitFor(() => expect(continueButton).not.toBeDisabled());

    fireEvent.click(continueButton);

    expect(await screen.findByText('step two')).toBeInTheDocument();
    expect(
      screen.queryByText('schema changes loading')
    ).not.toBeInTheDocument();
    expect(loadingCondition).not.toHaveBeenCalled();
  });
});
