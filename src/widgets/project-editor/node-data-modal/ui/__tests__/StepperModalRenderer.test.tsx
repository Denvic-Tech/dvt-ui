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
