import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NodeIcon } from './NodeIcon';

describe('NodeIcon', () => {
  it('renders a decorative 16px icon from the shared external sprite', () => {
    const { container } = render(<NodeIcon iconKey='table-from-db' />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg.querySelector('use')?.getAttribute('href')).toMatch(
      /\/assets\/node-icons-[a-f0-9]+\.svg#node-table-from-db$/
    );
    expect(container.querySelector('path')).toBeNull();
  });

  it.each([undefined, null, '', 'unknown-extension-icon'])(
    'keeps the existing 8px marker for %s',
    iconKey => {
      const { container } = render(<NodeIcon iconKey={iconKey} />);
      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('[data-node-icon="default"]')).toHaveStyle(
        {
          width: '8px',
          height: '8px',
        }
      );
      expect(
        (
          container.firstElementChild as HTMLElement
        ).style.backgroundColor.toLowerCase()
      ).toBe('currentcolor');
    }
  );

  it('accepts explicit sizing and presentation without changing the resource', () => {
    const { container } = render(
      <NodeIcon
        iconKey='load-csv'
        size={24}
        className='example'
        style={{ color: 'red' }}
      />
    );
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
    expect(container.querySelector('svg')).toHaveClass('example');
    expect(container.querySelector('svg')?.style.color).toBe('red');
  });
});
