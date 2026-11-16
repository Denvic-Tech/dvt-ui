import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionState } from '../../lib/helpers';
import { ColumnActionsLoadingOverlay } from '../ColumnActionsLoadingOverlay';
import { WriteStepLoadingOverlay } from '../WriteSettingsStep/WriteStepLoadingOverlay';

import { ApplyResultError, ApplyResultSuccess } from './ApplyResultScreen';

const SERVER_ERROR =
  'Failed to create table: Code: 44. DB::Exception\n\nStack trace:\n0. DB::Exception';

const buildContext = (sharedState: ExtensionState) =>
  ({
    sharedState,
    setSharedState: vi.fn(),
  }) as any;

describe('ApplyResultError', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the server response as is with a settings link and no extra buttons', () => {
    const onCheckSettings = vi.fn();
    render(
      <ApplyResultError
        title='Таблица не создана'
        errorMessage={SERVER_ERROR}
        onCheckSettings={onCheckSettings}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Таблица не создана' })
    ).toBeInTheDocument();
    expect(screen.getByText(/и попробуйте снова/)).toBeInTheDocument();
    // Текст ответа сервера — целиком, с переносами строк.
    expect(document.querySelector('pre')?.textContent).toBe(SERVER_ERROR);
    // Только ссылка и копирование: без «Вернуться к шагу 1» и кнопок под боксом.
    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.click(
      screen.getByRole('button', { name: 'Проверьте настройки' })
    );
    expect(onCheckSettings).toHaveBeenCalledTimes(1);
  });

  it('copies the full text and shows the copied state for a moment', async () => {
    render(
      <ApplyResultError
        title='Таблица не создана'
        errorMessage={SERVER_ERROR}
        onCheckSettings={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Копировать' }));
    });
    expect(writeText).toHaveBeenCalledWith(SERVER_ERROR);
    expect(screen.getByRole('button', { name: 'Скопировано' })).toHaveAttribute(
      'title',
      'Скопировано'
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(
      screen.getByRole('button', { name: 'Копировать' })
    ).toBeInTheDocument();
  });
});

describe('ApplyResultSuccess', () => {
  it('shows the title and the progress line', () => {
    render(
      <ApplyResultSuccess
        title='Изменения схемы применены'
        progressText='Переходим к следующему шагу…'
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Изменения схемы применены' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Переходим к следующему шагу…')
    ).toBeInTheDocument();
  });
});

describe('result overlays: loading', () => {
  it('shows the column actions loading as a title with a hint', () => {
    render(
      <ColumnActionsLoadingOverlay
        context={buildContext({ isApplyingColumnActions: true })}
        goToPreviousStep={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Применяем изменения схемы' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Это может занять некоторое время')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the create table loading the same way', () => {
    render(
      <WriteStepLoadingOverlay
        context={buildContext({ isTableNew: true, isCreateTableLoading: true })}
        goToPreviousStep={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Создаём таблицу' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Это может занять некоторое время')
    ).toBeInTheDocument();
  });
});

describe('result overlays: «Проверьте настройки»', () => {
  it('returns from a create table error to the write settings form', () => {
    const context = buildContext({ createTableError: SERVER_ERROR });
    const goToPreviousStep = vi.fn();
    render(
      <WriteStepLoadingOverlay
        context={context}
        goToPreviousStep={goToPreviousStep}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Проверьте настройки' })
    );

    // Остаёмся на шаге «Параметры записи»: снимаем ошибку, шаг не меняем.
    expect(goToPreviousStep).not.toHaveBeenCalled();
    const updater = context.setSharedState.mock.calls[0][0];
    expect(
      updater({ createTableError: SERVER_ERROR, isTableNew: true })
    ).toEqual({ createTableError: null, isTableNew: true });
  });

  it('returns from a column actions error to the schema step', () => {
    const goToPreviousStep = vi.fn();
    render(
      <ColumnActionsLoadingOverlay
        context={buildContext({ applyColumnActionsError: SERVER_ERROR })}
        goToPreviousStep={goToPreviousStep}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Проверьте настройки' })
    );
    expect(goToPreviousStep).toHaveBeenCalledTimes(1);
  });
});
