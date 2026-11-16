import { useMemo } from 'react';
import { styled } from '@mui/material/styles';

import { highlightSql, type SqlTokenKind } from '@/shared/lib/sql/highlightSql';

import { MONO_FONT_FAMILY, scrollbarStyles, tokens } from './tokens';

const TOKEN_COLORS: Record<SqlTokenKind, string> = {
  keyword: tokens.accentStrong,
  type: '#8A5A00',
  string: '#1E7A43',
  number: '#8A5A00',
  comment: tokens.textSubtle,
  punctuation: tokens.textMuted,
  identifier: tokens.text,
  plain: tokens.text,
};

const Pre = styled('pre')({
  margin: 0,
  padding: '14px 16px',
  color: tokens.text,
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  lineHeight: '20px',
  whiteSpace: 'pre',
  '& .sql-line': { display: 'block', minHeight: 20 },
  ...Object.fromEntries(
    Object.entries(TOKEN_COLORS).map(([kind, color]) => [
      `& .sql-${kind}`,
      { color },
    ])
  ),
});

/** Прокручиваемая рамка для кода (макет: `.qcode`). */
export const SqlPreviewFrame = styled('div')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  backgroundColor: tokens.surface,
  ...scrollbarStyles(),
});

/** Только чтение: SQL с подсветкой ключевых слов, типов и пунктуации. */
export const SqlPreview = ({
  sql,
  ariaLabel,
}: {
  sql: string;
  ariaLabel?: string;
}) => {
  const lines = useMemo(() => highlightSql(sql), [sql]);
  return (
    <Pre aria-label={ariaLabel}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className='sql-line'>
          {line.map((token, tokenIndex) => (
            <span key={tokenIndex} className={`sql-${token.kind}`}>
              {token.text}
            </span>
          ))}
        </span>
      ))}
    </Pre>
  );
};
