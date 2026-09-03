import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import UIKitPage from '..';

const renderUIKitPage = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path='/ui-kit/*' element={<UIKitPage />} />
      </Routes>
    </MemoryRouter>
  );

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  if (originalScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: originalScrollIntoView,
    });
  } else {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  }

  vi.restoreAllMocks();
});

describe('pages/UIKitPage', () => {
  it('redirects base route to the default UI kit page', async () => {
    renderUIKitPage('/ui-kit');

    expect(
      await screen.findByRole('heading', { name: 'Moodboard' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/ui-kit/moodboard#overview'
    );
  });

  it('shows section links only for the active page accordion', async () => {
    renderUIKitPage('/ui-kit/primitives#forms');

    expect(
      await screen.findByRole('heading', { name: 'Primitives' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forms' })).toHaveAttribute(
      'href',
      '/ui-kit/primitives#forms'
    );
    expect(
      screen.queryByRole('link', { name: 'Overview' })
    ).not.toBeInTheDocument();
  });

  it('scrolls to the section from the hash fragment', async () => {
    const scrollIntoView = vi.fn();

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });

    renderUIKitPage('/ui-kit/primitives#forms');

    expect(
      await screen.findByRole('heading', { name: 'Forms' })
    ).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
