import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  GraphNodeFocusProvider,
  useGraphNodeFocusRequest,
  useRequestGraphNodeFocus,
} from '../index';

const FocusRequestProbe = () => {
  const request = useGraphNodeFocusRequest();
  const requestGraphNodeFocus = useRequestGraphNodeFocus();

  return (
    <>
      <button onClick={() => requestGraphNodeFocus('node-1')}>Focus</button>
      <output>
        {request ? `${request.nodeID}:${request.requestID}` : 'empty'}
      </output>
    </>
  );
};

describe('GraphNodeFocusProvider', () => {
  it('creates a new request for repeated focus on the same node', () => {
    render(
      <GraphNodeFocusProvider>
        <FocusRequestProbe />
      </GraphNodeFocusProvider>
    );

    const focusButton = screen.getByRole('button', { name: 'Focus' });
    fireEvent.click(focusButton);
    expect(screen.getByText('node-1:1')).toBeInTheDocument();

    fireEvent.click(focusButton);
    expect(screen.getByText('node-1:2')).toBeInTheDocument();
  });
});
