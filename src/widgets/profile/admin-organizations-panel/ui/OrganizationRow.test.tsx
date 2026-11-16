import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OrganizationReadSchema } from '@/shared/gatewayClient';

import { OrganizationRow, shortenInn } from './OrganizationRow';

const organization: OrganizationReadSchema = {
  id: 'org-1',
  name: 'Acme',
  description: 'Головной офис',
  inn: '123456789012',
  is_active: true,
  created_at: '2026-05-22T12:51:54Z',
  updated_at: '2026-05-26T12:10:50Z',
};

const renderRow = (
  value: OrganizationReadSchema,
  handlers: Partial<{
    onEdit: (organization: OrganizationReadSchema) => void;
    onToggleActive: (organization: OrganizationReadSchema) => void;
  }> = {}
) =>
  render(
    <OrganizationRow
      organization={value}
      isUpdating={false}
      onEdit={handlers.onEdit ?? vi.fn()}
      onToggleActive={handlers.onToggleActive ?? vi.fn()}
    />
  );

describe('OrganizationRow', () => {
  it('shortens long INNs in the middle', () => {
    expect(shortenInn('123456789012')).toBe('123…012');
    expect(shortenInn('123456')).toBe('123456');
  });

  it('shows the name, description, short INN and status', () => {
    renderRow(organization);

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Головной офис')).toBeInTheDocument();
    expect(screen.getByText('123…012')).toHaveAttribute(
      'title',
      '123456789012'
    );
    expect(screen.getByText('Активна')).toBeInTheDocument();
  });

  it('shows a dash without an INN and the inactive status', () => {
    renderRow({ ...organization, inn: null, is_active: false });

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Неактивна')).toBeInTheDocument();
  });

  it('offers activation for an inactive organization', () => {
    const onToggleActive = vi.fn();
    renderRow({ ...organization, is_active: false }, { onToggleActive });

    fireEvent.click(
      screen.getByRole('button', { name: 'Действия с организацией Acme' })
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Активировать' }));

    expect(onToggleActive).toHaveBeenCalledWith({
      ...organization,
      is_active: false,
    });
  });
});
