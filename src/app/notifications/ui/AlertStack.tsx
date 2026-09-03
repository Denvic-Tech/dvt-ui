import React from 'react';

import { NotificationStack } from '@/app/notifications';

type AlertStackProps = {
  anchor?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  maxVisible?: number;
  width?: number;
  style?: React.CSSProperties;
};

export const AlertStack: React.FC<AlertStackProps> = () => {
  return <NotificationStack />;
};

export default AlertStack;
