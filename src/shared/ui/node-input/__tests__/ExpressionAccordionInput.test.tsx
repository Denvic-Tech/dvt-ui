import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import { ExpressionAccordionInput } from '../ExpressionAccordionInput';

vi.mock('../HighlightedSingleLineFieldV2', () => ({
  HighlightedSingleLineFieldV2: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (nextValue: string) => void;
  }) => (
    <input
      data-testid='highlighted-single-line-field-v2'
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));

const stringInputDefinition = {
  attr_name: 'database_name',
  display_name: 'Database',
  type: 'STRING',
  display_type: 'STRING',
  is_list_type: false,
  is_literal_type: false,
  options: null,
  optional: true,
  is_hidden: false,
  description: 'Database selector',
  default: '',
  multiline: false,
  metadata_source_field: null,
  min_value: null,
  max_value: null,
  step: null,
  round_val: null,
  schema: null,
  allow_multiple_connections: false,
  allow_new: false,
  allow_expressions: true,
  expression_policy: 'default',
  force_handle_visible: false,
} as const;

const Harness = ({
  allowExpressions = true,
  appearance = 'accordion',
  disabled = false,
  disabledReason,
  initialValue,
  isOpen = true,
  loading = false,
  loadingVariant,
  onToggle = () => undefined,
  stepNumber,
}: {
  allowExpressions?: boolean;
  appearance?: 'accordion' | 'workspace';
  disabled?: boolean;
  disabledReason?: string;
  initialValue: unknown;
  isOpen?: boolean;
  loading?: boolean;
  loadingVariant?: 'spinner' | 'title-wave';
  onToggle?: () => void;
  stepNumber?: number;
}) => {
  const [value, setValue] = useState<unknown>(initialValue);

  return (
    <>
      <ExpressionAccordionInput
        appearance={appearance}
        inputDefinition={allowExpressions ? stringInputDefinition : undefined}
        value={value}
        onChange={setValue}
        isOpen={isOpen}
        onToggle={onToggle}
        icon={<span>DB</span>}
        title='Database'
        stepNumber={stepNumber}
        disabled={disabled}
        disabledReason={disabledReason}
        loading={loading}
        loadingVariant={loadingVariant}
      >
        <div data-testid='specialized-child'>specialized</div>
      </ExpressionAccordionInput>
      <div data-testid='serialized-value'>{JSON.stringify(value)}</div>
    </>
  );
};

describe('ExpressionAccordionInput', () => {
  it('renders workspace appearance without accordion controls', () => {
    render(
      <Harness
        appearance='workspace'
        initialValue='analytics'
        isOpen={false}
        stepNumber={2}
      />
    );

    expect(screen.getByTestId('specialized-child')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Свернуть секцию' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('shared/ui/node-input/workspace-section-header')
    ).toHaveStyle({ minHeight: '52px', paddingBottom: '0px' });
  });

  it('allows expression autocomplete to overflow the accordion boundary', () => {
    const { container } = render(
      <Harness
        initialValue={makeExpressionValue('source_database', 'single')}
      />
    );

    expect(container.firstElementChild).toHaveStyle({ overflow: 'visible' });
  });

  it('preserves rounded section backgrounds while overflow stays visible', () => {
    const { rerender } = render(
      <Harness initialValue='analytics' isOpen={false} stepNumber={1} />
    );

    const getHeader = () =>
      screen.getByRole('button', { name: /Database/ }).parentElement;

    expect(getHeader()).toHaveStyle({ borderRadius: '11px' });

    rerender(<Harness initialValue='analytics' isOpen stepNumber={1} />);

    expect(getHeader()).toHaveStyle({ borderRadius: '11px 11px 0 0' });
    expect(screen.getByTestId('specialized-child').parentElement).toHaveStyle({
      borderRadius: '0 0 11px 11px',
    });
  });

  it('replaces loading text and spinner with a wave on the section title', () => {
    const { container } = render(
      <Harness
        initialValue='analytics'
        allowExpressions={false}
        disabled
        disabledReason='Loading table metadata...'
        loading
        loadingVariant='title-wave'
        stepNumber={3}
      />
    );

    expect(
      screen.queryByText('Loading table metadata...')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute(
      'data-loading-wave',
      'true'
    );
    expect(screen.getByText('Database')).toHaveStyle({
      color: 'rgba(0, 0, 0, 0)',
    });
  });

  it('renders specialized children in literal mode', () => {
    render(<Harness initialValue='analytics' />);

    expect(screen.getByTestId('specialized-child')).toBeInTheDocument();
  });

  it('opens directly in expression mode for expr(single) values', () => {
    render(
      <Harness
        initialValue={makeExpressionValue('source_database', 'single')}
      />
    );

    expect(screen.queryByTestId('specialized-child')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('=source_database')).toBeInTheDocument();
  });

  it('enters expression mode with a seeded expr(single) value', async () => {
    render(<Harness initialValue='analytics' />);

    fireEvent.click(screen.getByLabelText('Переключить expression mode'));

    expect(screen.getByTestId('serialized-value')).toHaveTextContent(
      '"__dvt_type":"expr"'
    );
    expect(screen.getByDisplayValue('="analytics"')).toBeInTheDocument();
  });

  it('restores the previous literal snapshot when expression mode is disabled', async () => {
    render(<Harness initialValue='analytics' />);

    fireEvent.click(screen.getByLabelText('Переключить expression mode'));
    fireEvent.click(screen.getByLabelText('Переключить expression mode'));

    expect(screen.getByTestId('serialized-value')).toHaveTextContent(
      '"analytics"'
    );
    expect(screen.getByTestId('specialized-child')).toBeInTheDocument();
  });

  it('clears the field when exiting expression mode without a literal snapshot', async () => {
    render(
      <Harness
        initialValue={makeExpressionValue('source_database', 'single')}
      />
    );

    fireEvent.click(screen.getByLabelText('Переключить expression mode'));

    expect(screen.getByTestId('serialized-value')).toHaveTextContent('""');
    expect(screen.getByTestId('specialized-child')).toBeInTheDocument();
  });

  it('does not toggle accordion state when the code button is clicked', async () => {
    const handleToggle = vi.fn();

    render(<Harness initialValue='analytics' onToggle={handleToggle} />);

    fireEvent.click(screen.getByLabelText('Переключить expression mode'));

    expect(handleToggle).not.toHaveBeenCalled();
  });
});
