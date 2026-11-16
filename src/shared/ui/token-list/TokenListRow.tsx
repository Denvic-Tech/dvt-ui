import * as React from 'react';
import { Tooltip } from '@mui/material';

import { getTokenAvatarColors } from '@/shared/lib/token/tokenAvatar';
import {
  getTokenExpiry,
  type TokenExpiryTone,
} from '@/shared/lib/token/tokenExpiry';

import {
  RowAvatar,
  RowDetails,
  RowExpiry,
  RowExpiryDot,
  RowExpiryLabel,
  RowMain,
  RowName,
  RowRoot,
} from './styled';
import { type TokenListRowAction, TokenListRowMenu } from './TokenListRowMenu';

const EXPIRY_STYLES: Record<
  TokenExpiryTone,
  { color: string; dot: string | null }
> = {
  normal: { color: '#6B7385', dot: null },
  soon: { color: '#8A5A00', dot: '#F5A524' },
  expired: { color: '#B42318', dot: '#E5484D' },
};

type TokenListRowProps = {
  name: string;
  // Avatar content; the first letter of the name when omitted.
  icon?: React.ReactNode;
  details?: React.ReactNode;
  // Fixed name column, so details line up across rows.
  nameColumnWidth?: number;
  expiresAt: number | null | undefined;
  actionsLabel: string;
  actions: TokenListRowAction[];
};

export const TokenListRow = ({
  name,
  icon,
  details,
  nameColumnWidth,
  expiresAt,
  actionsLabel,
  actions,
}: TokenListRowProps) => {
  const [isNameTruncated, setIsNameTruncated] = React.useState(false);
  const expiry = getTokenExpiry(expiresAt);
  const expiryStyle = EXPIRY_STYLES[expiry.tone];
  const isExpired = expiry.tone === 'expired';
  const avatarColors = getTokenAvatarColors(name, isExpired);

  return (
    <RowRoot dimmed={isExpired}>
      <RowAvatar
        aria-hidden
        sx={{ bgcolor: avatarColors.background, color: avatarColors.color }}
      >
        {icon ?? name.charAt(0).toUpperCase()}
      </RowAvatar>

      <RowMain>
        <Tooltip title={isNameTruncated ? name : ''} placement='top'>
          <RowName
            noWrap
            columnWidth={nameColumnWidth}
            dimmed={isExpired}
            onMouseEnter={event =>
              setIsNameTruncated(
                event.currentTarget.scrollWidth >
                  event.currentTarget.clientWidth
              )
            }
          >
            {name}
          </RowName>
        </Tooltip>
        {details ? <RowDetails noWrap>{details}</RowDetails> : null}
      </RowMain>

      <RowExpiry>
        {expiryStyle.dot ? (
          <RowExpiryDot sx={{ bgcolor: expiryStyle.dot }} />
        ) : null}
        <RowExpiryLabel sx={{ color: expiryStyle.color }}>
          {expiry.label}
        </RowExpiryLabel>
      </RowExpiry>

      <TokenListRowMenu label={actionsLabel} actions={actions} />
    </RowRoot>
  );
};
