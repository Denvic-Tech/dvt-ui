import * as React from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Box, ButtonBase } from '@mui/material';

import { groupHomeSections, type HomeSection } from '../config/sections';
import { useDismiss } from '../lib/useDismiss';
import { homeAppearSx, homePopAppearSx } from '../styles/motion';
import {
  hc,
  homeCaptionSx,
  homeCardSx,
  homePopoverSx,
  homeSectionTitleSx,
} from '../styles/tokens';

import { SectionLink } from './SectionLink';

export const SECTIONS_HEADER_OFFSET = 26;
const DEFAULT_VISIBLE_SECTIONS = 6;

type HomeSectionsPanelProps = {
  /** Fixed height synced with the projects column; `null` lets it size itself. */
  height: number | null;
  onPick: (section: HomeSection) => void;
  rankedSections: HomeSection[];
  sections: HomeSection[];
};

export const HomeSectionsPanel = ({
  height,
  onPick,
  rankedSections,
  sections,
}: HomeSectionsPanelProps) => {
  const visibleSections = rankedSections
    .filter(section => !section.soon)
    .slice(0, DEFAULT_VISIBLE_SECTIONS);

  return (
    <Box
      component='nav'
      aria-label='Разделы'
      sx={{
        ...homeAppearSx(120),
        position: 'relative',
        // The appear animation makes this a stacking context; lift it above
        // later page blocks (widgets) so the «Все разделы» menu overlays them.
        zIndex: 30,
        alignSelf: 'start',
        height: { xs: 'auto', md: height ?? 'auto' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 16,
          mb: 1.25,
          position: 'relative',
          zIndex: 36,
        }}
      >
        <Box component='h2' sx={{ ...homeSectionTitleSx, flex: 1 }}>
          Разделы
        </Box>
        <AllSectionsButton onPick={onPick} sections={sections} />
      </Box>
      <Box
        sx={{
          position: { xs: 'static', md: height ? 'absolute' : 'static' },
          top: SECTIONS_HEADER_OFFSET,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            ...homeCardSx,
            p: 0.75,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}
        >
          {visibleSections.map(section => (
            <SectionLink
              key={section.id}
              onPick={onPick}
              section={section}
              variant='card'
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

type AllSectionsButtonProps = {
  onPick: (section: HomeSection) => void;
  sections: HomeSection[];
};

const AllSectionsButton = ({ onPick, sections }: AllSectionsButtonProps) => {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const groups = React.useMemo(() => groupHomeSections(sections), [sections]);

  useDismiss(open, [wrapperRef], () => setOpen(false));

  return (
    <Box
      component='span'
      ref={wrapperRef}
      sx={{ position: 'relative', display: 'inline-flex', mr: -0.75 }}
    >
      <ButtonBase
        disableRipple
        aria-expanded={open}
        aria-haspopup='menu'
        onClick={() => setOpen(current => !current)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.5,
          borderRadius: '7px',
          fontFamily: 'inherit',
          fontSize: 12.5,
          fontWeight: 500,
          color: open ? hc.brand : hc.ink2,
          whiteSpace: 'nowrap',
          '&:hover': { color: hc.brand },
          '&:focus-visible': { boxShadow: `0 0 0 2px ${hc.brandFocus}` },
        }}
      >
        Все разделы
        <KeyboardArrowDownRoundedIcon
          sx={{
            fontSize: 15,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        />
      </ButtonBase>
      {open ? (
        <Box
          role='menu'
          sx={{
            ...homePopoverSx,
            ...homePopAppearSx,
            position: 'absolute',
            top: 30,
            right: 0,
            zIndex: 50,
            width: { xs: 'calc(100vw - 32px)', sm: 520 },
            maxWidth: 520,
            p: 1.75,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            columnGap: 2.25,
            rowGap: 0.75,
          }}
        >
          {groups.map(({ group, sections: items }) => (
            <Box key={group}>
              <Box sx={{ ...homeCaptionSx, px: 1, pt: 0.75 }}>{group}</Box>
              {items.map(section => (
                <SectionLink
                  key={section.id}
                  onPick={picked => {
                    setOpen(false);
                    onPick(picked);
                  }}
                  section={section}
                  variant='menu'
                />
              ))}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};
