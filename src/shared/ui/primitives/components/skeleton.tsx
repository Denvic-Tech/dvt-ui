import * as React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import MuiSkeleton from '@mui/material/Skeleton';

type MuiSkeletonProps = React.ComponentProps<typeof MuiSkeleton>;

type SkeletonProps = MuiSkeletonProps & {
  rows?: number;
  columns?: number;
  rowHeight?: number;
};

export const Skeleton = React.forwardRef<
  HTMLElement,
  SkeletonProps
>(
  (
    {
      animation = 'wave',
      columns,
      rowHeight = 40,
      rows,
      sx,
      variant,
      ...props
    },
    ref
  ) => {
    if (typeof rows === 'number' && rows > 0) {
      if (typeof columns === 'number' && columns > 0) {
        return (
          <Box
            ref={ref as React.Ref<HTMLDivElement>}
            sx={[
              { width: '100%' },
              ...(Array.isArray(sx) ? sx : [sx]).filter(Boolean),
            ]}
          >
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  display: 'grid',
                  gap: 0.5,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <MuiSkeleton
                    key={`${rowIndex}-${columnIndex}`}
                    {...props}
                    animation={animation}
                    height={rowHeight}
                    variant={variant ?? 'text'}
                    width='100%'
                  />
                ))}
              </Box>
            ))}
          </Box>
        );
      }

      return (
        <List
          ref={ref as React.Ref<HTMLUListElement>}
          sx={[
            { width: '100%' },
            ...(Array.isArray(sx) ? sx : [sx]).filter(Boolean),
          ]}
        >
          {Array.from({ length: rows }).map((_, index) => (
            <ListItem key={index}>
              <ListItemAvatar>
                <MuiSkeleton
                  {...props}
                  animation={animation}
                  height={40}
                  variant='circular'
                  width={40}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <MuiSkeleton
                    {...props}
                    animation={animation}
                    variant='text'
                    sx={{ width: '80%' }}
                  />
                }
                secondary={
                  <MuiSkeleton
                    {...props}
                    animation={animation}
                    variant='text'
                    sx={{ width: '60%' }}
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      );
    }

    return (
      <MuiSkeleton
        ref={ref as React.Ref<HTMLSpanElement>}
        {...props}
        {...(sx === undefined ? {} : { sx })}
        animation={animation}
        variant={variant ?? 'rounded'}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';
