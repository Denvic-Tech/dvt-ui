import type { PaletteMode } from '@mui/material';

type HomeTokenName =
  | 'bg'
  | 'card'
  | 'ink'
  | 'ink2'
  | 'ink3'
  | 'ink4'
  | 'line'
  | 'line2'
  | 'rowLine'
  | 'brand'
  | 'brandStrong'
  | 'brandSoft'
  | 'brandSoftHover'
  | 'brandHover'
  | 'brandBorder'
  | 'brandFocus'
  | 'brandIcon'
  | 'brandIconBg'
  | 'ok'
  | 'okSoft'
  | 'okTick'
  | 'warn'
  | 'err'
  | 'errSoft'
  | 'idle'
  | 'avatar'
  | 'codeBg'
  | 'codeLine';

const lightTokens: Record<HomeTokenName, string> = {
  bg: '#f4f4f8',
  card: '#ffffff',
  ink: '#17181c',
  ink2: '#565a64',
  ink3: '#8a8e98',
  ink4: '#b9bcc4',
  line: '#e9e9e6',
  line2: '#deded9',
  rowLine: '#f1f1f4',
  brand: '#6366f1',
  brandStrong: '#4f46e5',
  brandSoft: '#eef2ff',
  brandSoftHover: '#e0e7ff',
  brandHover: '#f5f7ff',
  brandBorder: '#c7d2fe',
  brandFocus: '#a5b4fc',
  brandIcon: '#818cf8',
  brandIconBg: '#eef2ff',
  ok: '#1f9d55',
  okSoft: '#bfe3cc',
  okTick: '#4cb87b',
  warn: '#d08a10',
  err: '#e0524a',
  errSoft: '#fdf0ee',
  idle: '#c3c6cd',
  avatar: '#e7e5df',
  codeBg: '#f7f7fa',
  codeLine: '#ececf2',
};

const darkTokens: Record<HomeTokenName, string> = {
  bg: '#0f1117',
  card: '#171a22',
  ink: '#eef0f5',
  ink2: '#b4b9c4',
  ink3: '#8a909c',
  ink4: '#5f6573',
  line: '#262a35',
  line2: '#323745',
  rowLine: '#20242e',
  brand: '#818cf8',
  brandStrong: '#a5b4fc',
  brandSoft: '#23264d',
  brandSoftHover: '#2c3060',
  brandHover: '#1c1f3b',
  brandBorder: '#3b3f86',
  brandFocus: '#4f46e5',
  brandIcon: '#a5b4fc',
  brandIconBg: '#22254a',
  ok: '#3fbf75',
  okSoft: '#2b5a40',
  okTick: '#3fbf75',
  warn: '#e0a238',
  err: '#f06a62',
  errSoft: '#3a1f20',
  idle: '#4b505c',
  avatar: '#2a2e39',
  codeBg: '#12141b',
  codeLine: '#262a35',
};

const tokenVarName = (name: HomeTokenName) => `--home-${name}`;

/** CSS variable references for use inside `sx` of the home dashboard tree. */
export const hc = Object.fromEntries(
  (Object.keys(lightTokens) as HomeTokenName[]).map(name => [
    name,
    `var(${tokenVarName(name)})`,
  ])
) as Record<HomeTokenName, string>;

/** Declares home dashboard tokens for the current palette mode. */
export const getHomeCssVars = (mode: PaletteMode): Record<string, string> => {
  const tokens = mode === 'dark' ? darkTokens : lightTokens;

  return Object.fromEntries(
    (Object.keys(tokens) as HomeTokenName[]).map(name => [
      tokenVarName(name),
      tokens[name],
    ])
  );
};

export const homeMonoFont =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const homeCardSx = {
  backgroundColor: hc.card,
  border: `1px solid ${hc.line}`,
  borderRadius: '14px',
  boxShadow: '0 1px 0 rgba(23, 24, 28, 0.03)',
} as const;

export const homePopoverSx = {
  backgroundColor: hc.card,
  border: `1px solid ${hc.line}`,
  borderRadius: '12px',
  boxShadow: '0 24px 50px -24px rgba(23, 24, 28, 0.35)',
  color: hc.ink,
} as const;

export const homeEllipsisSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const homeSectionTitleSx = {
  m: 0,
  fontSize: 13,
  fontWeight: 600,
  color: hc.ink2,
  letterSpacing: '-0.05px',
  lineHeight: '16px',
} as const;

export const homeCaptionSx = {
  fontSize: 10.5,
  fontWeight: 600,
  color: hc.ink4,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  px: 1.25,
  pt: 1,
  pb: 0.5,
} as const;
