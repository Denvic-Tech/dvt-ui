import { hc } from '../styles/tokens';

/** How far list rows extend into the card padding (16px − 6px inset). */
const WIDGET_ROW_BLEED = '10px';

/**
 * Clickable list row inside a widget body: the hover fill spans the card with
 * a 6px inset while the text stays aligned with the widget title.
 */
export const widgetRowSx = {
  display: 'grid',
  gridTemplateColumns: '10px minmax(0, 1fr) auto',
  gap: 1.25,
  alignItems: 'center',
  px: WIDGET_ROW_BLEED,
  py: '7px',
  mx: `-${WIDGET_ROW_BLEED}`,
  borderRadius: '9px',
  color: hc.ink,
  textDecoration: 'none',
  transition: 'background-color .14s',
  '&:hover, &:focus-visible': {
    backgroundColor: hc.brandHover,
    outline: 'none',
  },
} as const;

export const widgetMetaSx = {
  fontSize: 12,
  color: hc.ink3,
} as const;

export const widgetBigNumberSx = {
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: '-0.8px',
  lineHeight: 1,
  color: hc.ink,
} as const;

export const widgetEmptySx = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  px: 2,
  fontSize: 12.5,
  color: hc.ink3,
  textWrap: 'pretty',
} as const;

export const widgetBadgeSx = (color: string, background: string) =>
  ({
    fontSize: 10.5,
    fontWeight: 600,
    color,
    backgroundColor: background,
    borderRadius: '5px',
    px: '5px',
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }) as const;
