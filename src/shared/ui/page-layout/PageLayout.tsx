import * as React from 'react';
import { Box } from '@mui/material';

import { PageHeader, type PageHeaderIcon } from './PageHeader';

export type PageLayoutWidth = 'narrow' | 'default' | 'wide' | 'fluid';

type PageLayoutProps = {
  width?: PageLayoutWidth;
  title?: string;
  icon?: PageHeaderIcon;
  // Controls of the tab in the header, right-aligned to the content's max width.
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  component?: React.ElementType;
  onSubmit?: React.FormEventHandler<HTMLElement>;
  // Second column next to the content, below the header, with its own height.
  aside?: React.ReactNode;
  // The content hugs its children up to the container height and scrolls inside
  // them instead of scrolling as a whole.
  fitContent?: boolean;
};

const CONTAINER_PADDING = '16px';
const HEADER_VERTICAL_PADDING = '6px';
const HEADER_LEFT_PADDING = '14px';
const HEADER_DIVIDER_COLOR = '#E6E9F0';
const HEADER_CONTENT_GAP = CONTAINER_PADDING;
const ASIDE_WIDTH = '440px';
const ASIDE_MARGIN_BOTTOM = CONTAINER_PADDING;
// The scrollbar gutter (10px when thin) sits between the content and the aside
// and counts towards the visual gap of 40px.
const SCROLLBAR_GUTTER = '10px';
const ASIDE_COLUMN_GAP = '30px';

const MAX_WIDTH_BY_TOKEN: Record<PageLayoutWidth, string> = {
  narrow: 'var(--content-narrow)',
  default: 'var(--content-default)',
  wide: 'var(--content-wide)',
  fluid: 'none',
};

const scrollGutterSx = {
  scrollbarGutter: 'stable',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
  width = 'default',
  title,
  icon,
  headerActions,
  children,
  component = 'div',
  onSubmit,
  aside,
  fitContent = false,
}) => {
  const hasHeader = title !== undefined;
  const hasAside = aside !== undefined && aside !== null;
  const widthSx = { width: '100%', maxWidth: MAX_WIDTH_BY_TOKEN[width] };
  // The scrollbar gutter counts towards the right padding, otherwise the right
  // side of the content sits further from the edge than the left one.
  const rightPadding = hasAside
    ? 0
    : `calc(${CONTAINER_PADDING} - ${SCROLLBAR_GUTTER})`;

  return (
    <Box
      component={component}
      onSubmit={onSubmit}
      sx={{
        boxSizing: 'border-box',
        ...(hasAside
          ? {
              display: 'grid',
              gridTemplateColumns: `minmax(0, calc(${CONTAINER_PADDING} + ${MAX_WIDTH_BY_TOKEN[width]} + ${SCROLLBAR_GUTTER})) ${ASIDE_WIDTH} minmax(0, 1fr)`,
              // The content row is as tall as the taller of the content and the
              // aside, but never taller than the container.
              gridTemplateRows: 'auto minmax(0, auto)',
              alignContent: 'start',
              columnGap: ASIDE_COLUMN_GAP,
            }
          : { display: 'flex', flexDirection: 'column' }),
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid #E6E9F0',
        borderRadius: '12px',
      }}
    >
      {hasHeader ? (
        <Box
          sx={{
            gridColumn: '1 / -1',
            gridRow: 1,
            flex: '0 0 auto',
            py: HEADER_VERTICAL_PADDING,
            pl: HEADER_LEFT_PADDING,
            pr: CONTAINER_PADDING,
            borderBottom: `1px solid ${HEADER_DIVIDER_COLOR}`,
          }}
        >
          <Box
            sx={{
              width: '100%',
              // The header starts further left than the content, by this difference.
              maxWidth:
                width === 'fluid'
                  ? 'none'
                  : `calc(${MAX_WIDTH_BY_TOKEN[width]} + ${CONTAINER_PADDING} - ${HEADER_LEFT_PADDING})`,
            }}
          >
            <PageHeader
              title={title}
              {...(icon ? { icon } : {})}
              actions={headerActions}
            />
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          ...scrollGutterSx,
          gridColumn: 1,
          gridRow: 2,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          pt: hasHeader ? HEADER_CONTENT_GAP : CONTAINER_PADDING,
          pl: CONTAINER_PADDING,
          pr: rightPadding,
          pb: CONTAINER_PADDING,
          ...(fitContent
            ? {
                flex: '0 1 auto',
                overflowY: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }
            : null),
        }}
      >
        <Box
          sx={{
            ...widthSx,
            ...(fitContent
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 auto',
                  minHeight: 0,
                }
              : null),
          }}
        >
          {children}
        </Box>
      </Box>

      {hasAside ? (
        <Box
          sx={{
            gridColumn: 2,
            gridRow: 2,
            alignSelf: 'start',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: `calc(100% - ${HEADER_CONTENT_GAP} - ${ASIDE_MARGIN_BOTTOM})`,
            mt: HEADER_CONTENT_GAP,
            mb: ASIDE_MARGIN_BOTTOM,
          }}
        >
          {aside}
        </Box>
      ) : null}
    </Box>
  );
};
