import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/primitives';
import { mergeSx } from '@/shared/ui/primitives/components/control-styles';

interface SectionCardProps {
  children: ReactNode;
  contentSx?: SxProps<Theme>;
  description?: ReactNode;
  sx?: SxProps<Theme>;
  title?: ReactNode;
}

export const SectionCard = ({
  children,
  contentSx,
  description,
  sx,
  title,
}: SectionCardProps) => {
  const hasHeader = Boolean(title) || Boolean(description);

  return (
    <Card sx={mergeSx({ height: '100%' }, sx)}>
      {hasHeader ? (
        <>
          <CardHeader sx={{ gap: 0.75 }}>
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </CardHeader>
          <Divider />
        </>
      ) : null}
      <CardContent
        sx={mergeSx(
          {
            display: 'grid',
            gap: 2,
            ...(!hasHeader ? { p: 2 } : {}),
          },
          contentSx
        )}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>{children}</Box>
      </CardContent>
    </Card>
  );
};
