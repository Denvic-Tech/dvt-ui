import { Avatar } from '@mui/material';

import { getConnectionTypeLogo, getConnectionTypeLogoScale } from './helpers';

type ConnectionLogoProps = {
  type: string;
  label?: string;
};

export const ConnectionLogo = ({ type, label }: ConnectionLogoProps) => {
  const logo = getConnectionTypeLogo(type);
  const alt = label ?? type;

  if (!logo) {
    return (
      <Avatar
        sx={{
          bgcolor: 'grey.100',
          color: 'text.primary',
          fontSize: 14,
          fontWeight: 700,
          height: 36,
          width: 36,
        }}
      >
        {alt.slice(0, 1).toUpperCase()}
      </Avatar>
    );
  }

  return (
    <Avatar
      variant='rounded'
      sx={{
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
        height: 36,
        width: 36,
      }}
    >
      <img
        src={logo}
        alt={alt}
        style={{
          maxHeight: '70%',
          maxWidth: '70%',
          transform: `scale(${getConnectionTypeLogoScale(type)})`,
          transformOrigin: 'center',
        }}
      />
    </Avatar>
  );
};
