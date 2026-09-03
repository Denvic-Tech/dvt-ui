import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReadTableDataPreview } from './ReadTableDataPreview';
import { ReadTableDataPreviewSkeleton } from './ReadTableDataPreviewSkeleton';

describe('ReadTableDataPreview', () => {
  it('renders values and shows a column dtype in its tooltip', async () => {
    render(
      <ReadTableDataPreview
        preview={{
          columns: [
            { name: 'id', dtype: 'INT' },
            { name: 'active', dtype: 'BOOLEAN' },
            { name: 'comment', dtype: 'STRING' },
          ],
          rows: [[42, true, null]],
          truncated: true,
        }}
      />
    );

    expect(
      screen.getByRole('table', { name: 'Предпросмотр данных таблицы' })
    ).toBeInTheDocument();
    const activeColumn = screen.getByText('active');
    expect(activeColumn).toBeInTheDocument();
    expect(screen.queryByText('BOOLEAN')).not.toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByLabelText('NULL')).toHaveTextContent('∅');
    expect(screen.queryByText('Выборка ограничена')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1 rows')).not.toBeInTheDocument();
    expect(screen.queryByText('partitions')).not.toBeInTheDocument();
    expect(screen.queryByText('CSV')).not.toBeInTheDocument();

    fireEvent.mouseOver(activeColumn);

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('active')).toBeInTheDocument();
    expect(within(tooltip).getByText('BOOLEAN')).toBeInTheDocument();
  });

  it('sorts all preview rows without rendering a pagination header', () => {
    render(
      <ReadTableDataPreview
        preview={{
          columns: [{ name: 'id', dtype: 'INT' }],
          rows: [[3], [1], [2]],
          truncated: false,
        }}
      />
    );

    fireEvent.click(screen.getByText('id'));
    fireEvent.click(screen.getByText('По возрастанию'));
    const table = screen.getByRole('table', {
      name: 'Предпросмотр данных таблицы',
    });
    expect(
      within(table)
        .getAllByTitle(/^[123]$/)
        .map(cell => cell.textContent)
    ).toEqual(['1', '2', '3']);
    expect(
      screen.queryByRole('button', { name: 'Следующая страница' })
    ).not.toBeInTheDocument();
  });

  it('renders an animated table skeleton for loading states', () => {
    const { container } = render(
      <ReadTableDataPreviewSkeleton columnCount={3} />
    );

    expect(
      screen.getByRole('status', {
        name: 'Загрузка предпросмотра таблицы',
      })
    ).toHaveAttribute('aria-busy', 'true');
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length
    ).toBeGreaterThan(0);
    expect(container.querySelector('.MuiSkeleton-wave')).toBeInTheDocument();
  });
});
