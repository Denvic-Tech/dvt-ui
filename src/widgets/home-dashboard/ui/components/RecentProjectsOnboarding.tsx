import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, ButtonBase } from '@mui/material';

import { homeAppearSx, homeFadeInSx } from '../styles/motion';
import { hc, homeCardSx, homeEllipsisSx } from '../styles/tokens';

import { StatusDot } from './StatusDot';

type SampleRun = 'ok' | 'err';

type SampleProject = {
  name: string;
  runs: SampleRun[];
  when: string;
};

/** Decorative pipelines around the CTA; they only hint at what a list looks like. */
const SAMPLE_PROJECTS: readonly SampleProject[] = [
  {
    name: 'Сверка остатков',
    runs: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
    when: 'пн',
  },
  {
    name: 'Выгрузка заказов',
    runs: ['ok', 'ok', 'ok', 'err', 'ok', 'ok', 'ok'],
    when: '2 ч назад',
  },
  {
    name: 'Отчёт продаж',
    runs: ['ok', 'ok', 'ok', 'ok', 'ok', 'err', 'ok'],
    when: 'вчера',
  },
  {
    name: 'Синк CRM',
    runs: ['ok', 'err', 'ok', 'ok', 'ok', 'ok', 'ok'],
    when: '3 дня',
  },
];

/** Index in the stack where the «Создать проект» card is inserted. */
const CTA_POSITION = 2;

const stackCardSx = {
  position: 'relative',
  display: 'grid',
  alignItems: 'center',
  gap: 1.25,
  height: 44,
  px: 1.75,
  backgroundColor: hc.card,
  borderRadius: '10px',
} as const;

type RecentProjectsOnboardingProps = {
  minHeight: number;
  onCreateProject: () => void;
};

/** First-run state of «Продолжить работу» when the user has no projects yet. */
export const RecentProjectsOnboarding = ({
  minHeight,
  onCreateProject,
}: RecentProjectsOnboardingProps) => {
  const samples = SAMPLE_PROJECTS.map(project => (
    <Box
      key={project.name}
      aria-hidden
      sx={{
        ...stackCardSx,
        gridTemplateColumns: 'minmax(0, 1fr) auto 64px',
        boxShadow: '0 1px 2px rgba(23, 24, 40, 0.04)',
        opacity: 0.55,
        transform: 'scale(.96)',
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}
      >
        <StatusDot tone='ok' />
        <Box
          component='span'
          sx={{ ...homeEllipsisSx, fontSize: 13, color: hc.ink }}
        >
          {project.name}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: '2px' }}>
        {project.runs.map((run, index) => (
          <Box
            key={index}
            component='i'
            sx={{
              width: 4,
              height: 14,
              borderRadius: '2px',
              opacity: 0.85,
              backgroundColor: run === 'err' ? hc.err : hc.ok,
            }}
          />
        ))}
      </Box>
      <Box
        component='span'
        sx={{
          fontSize: 12,
          color: hc.ink3,
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
      >
        {project.when}
      </Box>
    </Box>
  ));

  const cta = (
    <ButtonBase
      key='cta'
      disableRipple
      onClick={onCreateProject}
      sx={{
        ...stackCardSx,
        width: '100%',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        fontFamily: 'inherit',
        color: hc.ink,
        textAlign: 'left',
        boxShadow:
          '0 1px 2px rgba(23, 24, 40, 0.05), 0 6px 16px -8px rgba(40, 30, 120, 0.18)',
        transition: 'color .15s',
        '& .home-onb-plus': {
          width: 26,
          height: 26,
          borderRadius: '8px',
          backgroundColor: hc.brandIconBg,
          color: hc.brandIcon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color .18s, color .18s',
        },
        '& .home-onb-arrow': {
          display: 'flex',
          color: hc.ink4,
          transition: 'color .14s, transform .18s',
        },
        '&:hover, &:focus-visible': { color: hc.brand, outline: 'none' },
        '&:hover .home-onb-plus, &:focus-visible .home-onb-plus': {
          backgroundColor: hc.brandSoftHover,
          color: hc.brand,
        },
        '&:hover .home-onb-arrow, &:focus-visible .home-onb-arrow': {
          color: hc.brand,
          transform: 'translateX(2px)',
        },
      }}
    >
      <Box
        component='span'
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}
      >
        <span className='home-onb-plus'>
          <AddRoundedIcon sx={{ fontSize: 16 }} />
        </span>
        <Box component='span' sx={{ fontSize: 13, fontWeight: 500 }}>
          Создать проект
        </Box>
      </Box>
      <span className='home-onb-arrow'>
        <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
      </span>
    </ButtonBase>
  );

  return (
    <Box
      component='section'
      aria-label='Проекты'
      sx={{
        ...homeCardSx,
        ...homeAppearSx(180),
        p: 0.75,
        containerType: 'inline-size',
      }}
    >
      <Box
        sx={{
          ...homeFadeInSx,
          minHeight,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
          gap: 1,
          '@container (max-width: 540px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
            '& .home-onb-text': { p: '20px 18px 4px' },
          },
        }}
      >
        <Box
          className='home-onb-text'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: '24px 12px 24px 26px',
          }}
        >
          <Box
            component='h3'
            sx={{
              m: 0,
              maxWidth: 300,
              fontSize: 24,
              lineHeight: 1.25,
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: hc.ink,
              textWrap: 'balance',
            }}
          >
            Добро пожаловать в{' '}
            <Box component='span' sx={{ color: hc.brand }}>
              Denvic Visual Transformer
            </Box>
          </Box>
          <Box
            sx={{
              mt: 1.75,
              maxWidth: 280,
              fontSize: 14,
              lineHeight: 1.55,
              color: hc.ink3,
              textWrap: 'pretty',
            }}
          >
            Создайте первый проект — соберите пайплайн из нод и запускайте его
            когда удобно
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            overflow: 'hidden',
            WebkitMaskImage:
              'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
            maskImage:
              'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {[
              ...samples.slice(0, CTA_POSITION),
              cta,
              ...samples.slice(CTA_POSITION),
            ]}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
