import { styled } from '@mui/material/styles';

import { FONT_FAMILY, tokens } from '@/shared/ui/clean-minimal/tokens';

export const Root = styled('div')({
  height: '100%',
  minHeight: 0,
  display: 'flex',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontFamily: FONT_FAMILY,
  '& button, & input': { fontFamily: 'inherit' },
});
