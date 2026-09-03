import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { ConfirmDialogProvider } from '../ConfirmDialogProvider';

const ConfirmConsumer = () => {
  const { confirm } = useConfirmDialog();
  const [result, setResult] = useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={async () => {
          const confirmed = await confirm({
            title: 'Delete item?',
            message: 'Delete the selected item?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            confirmColor: 'error',
          });
          setResult(String(confirmed));
        }}
      >
        open confirm
      </button>
      <div data-testid='result'>{result}</div>
    </>
  );
};

const QueueConsumer = () => {
  const { confirm } = useConfirmDialog();
  const [result, setResult] = useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={async () => {
          const first = confirm({
            title: 'First dialog',
            message: 'First message',
            confirmLabel: 'Next',
            cancelLabel: 'Cancel',
          });
          const second = confirm({
            title: 'Second dialog',
            message: 'Second message',
            confirmLabel: 'Approve',
            cancelLabel: 'Stop',
          });

          setResult(`${await first}|${await second}`);
        }}
      >
        open queue
      </button>
      <div data-testid='queue-result'>{result}</div>
    </>
  );
};

const AsyncActionConsumer = ({
  handler,
}: {
  handler: () => Promise<void>;
}) => {
  const { openDialog } = useConfirmDialog();
  const [result, setResult] = useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={async () => {
          const actionId = await openDialog({
            title: 'Async dialog',
            message: 'Run async action?',
            actions: [
              { id: 'cancel', label: 'Cancel' },
              {
                id: 'confirm',
                label: 'Run',
                emphasize: true,
                handler,
              },
            ],
          });
          setResult(actionId);
        }}
      >
        open async
      </button>
      <div data-testid='async-result'>{result}</div>
    </>
  );
};

describe('ConfirmDialogProvider', () => {
  it('resolves confirm requests to boolean values', async () => {
    render(
      <ConfirmDialogProvider>
        <ConfirmConsumer />
      </ConfirmDialogProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'open confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('processes queued dialogs in FIFO order', async () => {
    render(
      <ConfirmDialogProvider>
        <QueueConsumer />
      </ConfirmDialogProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'open queue' }));

    expect(screen.getByText('First dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByText('Second dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() => {
      expect(screen.getByTestId('queue-result')).toHaveTextContent('true|false');
    });
  });

  it('does not execute async action handlers twice on repeated clicks', async () => {
    let resolveHandler: (() => void) | null = null;
    const handler = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveHandler = resolve;
        })
    );

    render(
      <ConfirmDialogProvider>
        <AsyncActionConsumer handler={handler} />
      </ConfirmDialogProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'open async' }));

    const runButton = screen.getByRole('button', { name: 'Run' });
    fireEvent.click(runButton);
    fireEvent.click(runButton);

    expect(handler).toHaveBeenCalledTimes(1);

    if (resolveHandler) {
      (resolveHandler as () => void)();
    }

    await waitFor(() => {
      expect(screen.getByTestId('async-result')).toHaveTextContent('confirm');
    });
  });

  it('rejects pending requests when provider unmounts', async () => {
    let pendingPromise: Promise<boolean> | null = null;

    const PendingConsumer = () => {
      const { confirm } = useConfirmDialog();

      return (
        <button
          type='button'
          onClick={() => {
            pendingPromise = confirm({
              title: 'Pending dialog',
              message: 'Wait for resolution',
            });
          }}
        >
          open pending
        </button>
      );
    };

    const rendered = render(
      <ConfirmDialogProvider>
        <PendingConsumer />
      </ConfirmDialogProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'open pending' }));
    rendered.unmount();

    await expect(pendingPromise).rejects.toThrow(
      'Confirm dialog provider was unmounted before the request resolved.'
    );
  });
});
