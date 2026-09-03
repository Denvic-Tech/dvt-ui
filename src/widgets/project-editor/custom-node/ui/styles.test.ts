import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import { getNodeStyles } from './styles';

describe('widgets/project-editor/custom-node/getNodeStyles', () => {
  const theme = createTheme();

  it('uses a subtle success-tinted background when node caching is enabled', () => {
    expect(getNodeStyles(theme, 'idle', false, true)).toMatchObject({
      backgroundColor: '#f2f8f3',
    });
  });

  it('keeps the regular paper background when node caching is disabled', () => {
    expect(getNodeStyles(theme, 'idle', false, false)).toMatchObject({
      backgroundColor: 'background.paper',
    });
  });
});
