import { describe, expect, it } from 'vitest';

import { isSecondaryMouseButtonEvent } from '../paneMenuInteraction';

describe('pane menu interaction helpers', () => {
  it('detects direct secondary-button mouse events', () => {
    expect(isSecondaryMouseButtonEvent({ button: 2 })).toBe(true);
    expect(isSecondaryMouseButtonEvent({ button: 0 })).toBe(false);
  });

  it('prefers native event button when available', () => {
    expect(
      isSecondaryMouseButtonEvent({
        button: 0,
        nativeEvent: { button: 2 },
      })
    ).toBe(true);
  });

  it('treats touch-like events as non-secondary interactions', () => {
    expect(isSecondaryMouseButtonEvent({})).toBe(false);
    expect(isSecondaryMouseButtonEvent(null)).toBe(false);
  });
});
