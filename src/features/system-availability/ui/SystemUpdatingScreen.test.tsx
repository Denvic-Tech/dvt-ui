import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SystemUpdatingScreen } from './SystemUpdatingScreen';

describe('SystemUpdatingScreen', () => {
  it('shows the blocking update state without a close action', () => {
    render(<SystemUpdatingScreen reconnecting={false} />);

    expect(screen.getByText('Обновляем DVT')).toBeInTheDocument();
    expect(screen.getByText('Плановое обновление')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /закрыть/i })
    ).not.toBeInTheDocument();
  });

  it('shows reconnecting while gateway is unavailable', () => {
    render(<SystemUpdatingScreen reconnecting />);

    expect(screen.getByText('Восстанавливаем соединение')).toBeInTheDocument();
    expect(
      screen.getByText(/Сервисы перезапускаются\. Восстанавливаем соединение…/)
    ).toBeInTheDocument();
  });
});
