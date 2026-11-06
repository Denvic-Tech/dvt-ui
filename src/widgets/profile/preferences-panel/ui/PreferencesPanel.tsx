import * as React from 'react';
import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';
import { IconAdjustmentsHorizontal, IconInfoCircle } from '@tabler/icons-react';

import { useLanguageContext } from '@/app/i18n';

import {
  type ThemeMode,
  useThemeModePreference,
} from '@/entities/ui-preferences';

import { PageLayout } from '@/shared/ui/page-layout';
import { SingleOptionDropdownSelect } from '@/shared/ui/select';

const ACCENT = '#5B5BEF';
const FOCUS_RING = '0 0 0 3px #EEF0FF';
const CONTROL_WIDTH = 200;
const THEME_CARDS_GAP = 12;
// The divider under the theme block spans the two theme cards only.
const THEME_ROW_WIDTH = CONTROL_WIDTH * 2 + THEME_CARDS_GAP;

type ThemePreviewPalette = {
  ground: string;
  sideAccent: string;
  sideLine: string;
  card: string;
  cardTitle: string;
  cardBorder: string;
};

type ThemeOption = {
  value: ThemeMode;
  label: string;
  disabled?: boolean;
  palette: ThemePreviewPalette;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Светлая тема',
    palette: {
      ground: '#EEF1F7',
      sideAccent: '#C9CBFA',
      sideLine: '#DCE1EA',
      card: '#FFFFFF',
      cardTitle: '#C3CAD6',
      cardBorder: '#E6E9F0',
    },
  },
  {
    value: 'dark',
    label: 'Тёмная тема',
    disabled: true,
    palette: {
      ground: '#12151D',
      sideAccent: '#3D3F8F',
      sideLine: '#343B4B',
      card: '#1F2430',
      cardTitle: '#4A5263',
      cardBorder: '#2E3442',
    },
  },
];

// Options repeat the text of the select field itself.
const languageOptionTextSx: SxProps<Theme> = theme => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: 13,
  fontWeight: 400,
  color: 'text.primary',
});

const sectionLabelSx = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '20px',
  color: '#3A4152',
};

const TRANSLATION_NOTE =
  'Локализация интерфейса находится в разработке: большая часть разделов пока доступна только на языке по умолчанию.';

const sectionDescriptionSx = {
  mt: '2px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: 12,
  lineHeight: '16px',
  color: '#9AA0AD',
};

const ThemePreview = ({ palette }: { palette: ThemePreviewPalette }) => {
  const bar = (background: string, width: number | string = '100%') => (
    <Box
      component='span'
      sx={{ height: 6, width, borderRadius: '3px', background }}
    />
  );
  const row = (
    <Box
      component='span'
      sx={{
        height: 14,
        borderRadius: '4px',
        border: `1px solid ${palette.cardBorder}`,
      }}
    />
  );

  return (
    <Box
      aria-hidden
      className='theme-preview'
      sx={{
        height: 92,
        boxSizing: 'border-box',
        p: 1,
        display: 'flex',
        gap: '6px',
        borderRadius: '8px',
        background: palette.ground,
      }}
    >
      <Box
        sx={{
          width: 34,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          pt: '2px',
        }}
      >
        {bar(palette.sideAccent)}
        {bar(palette.sideLine)}
        {bar(palette.sideLine)}
        {bar(palette.sideLine, '70%')}
      </Box>
      <Box
        sx={{
          flex: 1,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          borderRadius: '6px',
          background: palette.card,
        }}
      >
        {bar(palette.cardTitle, '45%')}
        {row}
        {row}
      </Box>
    </Box>
  );
};

const RadioMark = ({ checked }: { checked: boolean }) => (
  <Box
    component='span'
    sx={{
      width: 14,
      height: 14,
      flex: 'none',
      boxSizing: 'border-box',
      borderRadius: '50%',
      border: checked ? `4px solid ${ACCENT}` : '1.5px solid #C3C9D4',
      transition: 'border 120ms ease',
    }}
  />
);

const ThemeCard = ({
  option,
  checked,
  onSelect,
}: {
  option: ThemeOption;
  checked: boolean;
  onSelect: (value: ThemeMode) => void;
}) => (
  <Box
    component='button'
    type='button'
    role='radio'
    aria-checked={checked}
    disabled={option.disabled}
    onClick={() => onSelect(option.value)}
    sx={{
      width: CONTROL_WIDTH,
      boxSizing: 'border-box',
      p: '6px 6px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
      border: `1px solid ${checked ? ACCENT : '#E3E7EF'}`,
      borderRadius: '12px',
      boxShadow: checked ? FOCUS_RING : 'none',
      background: '#FFFFFF',
      color: '#1B1F2A',
      font: 'inherit',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'border-color 120ms ease, box-shadow 120ms ease',
      '&:hover:not(:disabled)': { borderColor: checked ? ACCENT : '#CDD3DE' },
      '&:focus-visible': {
        outline: 'none',
        borderColor: ACCENT,
        boxShadow: FOCUS_RING,
      },
      '&:disabled': { cursor: 'not-allowed' },
      '&:disabled .theme-preview': { opacity: 0.5 },
    }}
  >
    <ThemePreview palette={option.palette} />
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: '6px',
        fontSize: 13.5,
        fontWeight: 500,
        lineHeight: '20px',
        color: option.disabled ? '#A3A9B6' : 'inherit',
      }}
    >
      <RadioMark checked={checked} />
      {option.label}
      {option.disabled ? (
        <Box
          component='span'
          sx={{
            ml: 'auto',
            px: '6px',
            py: '1px',
            borderRadius: '5px',
            background: '#F1F3F8',
            color: '#6B7385',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '16px',
          }}
        >
          Скоро
        </Box>
      ) : null}
    </Box>
  </Box>
);

export const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, languageOptions } = useLanguageContext();
  const { themeMode, setThemeMode } = useThemeModePreference();

  const handleLanguageChange = (value: string) => {
    const selected = languageOptions.find(option => option.value === value);
    if (selected && selected.value !== language.value) {
      setLanguage(selected);
    }
  };

  return (
    <PageLayout
      width='narrow'
      title='Preferences'
      icon={IconAdjustmentsHorizontal}
    >
      {/* Same insets as the DCC, Runtime and Update forms. */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5,
          p: '6px 8px 8px',
        }}
      >
        {/* No section title: the cards name the themes themselves. */}
        <Box
          role='radiogroup'
          aria-label='Тема'
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${THEME_CARDS_GAP}px`,
          }}
        >
          {THEME_OPTIONS.map(option => (
            <ThemeCard
              key={option.value}
              option={option}
              checked={themeMode === option.value}
              onSelect={setThemeMode}
            />
          ))}
        </Box>

        <Divider sx={{ width: THEME_ROW_WIDTH, borderColor: '#EEF0F4' }} />

        {/* The label on the left, the select at the right edge of the
            divider above. */}
        <Box
          sx={{
            width: THEME_ROW_WIDTH,
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={sectionLabelSx}>Язык</Typography>
            <Typography sx={sectionDescriptionSx}>
              Язык интерфейса приложения
              {/* Quiet note: the translation does not cover everything yet. */}
              <Tooltip
                title={TRANSLATION_NOTE}
                placement='top'
                arrow
                disableInteractive
              >
                <Box
                  component='span'
                  tabIndex={0}
                  aria-label={TRANSLATION_NOTE}
                  sx={{
                    display: 'inline-flex',
                    color: '#B4BAC6',
                    cursor: 'help',
                    borderRadius: '50%',
                    outline: 'none',
                    '&:hover, &:focus-visible': { color: '#6B7385' },
                  }}
                >
                  <IconInfoCircle size={13} stroke={1.6} />
                </Box>
              </Tooltip>
            </Typography>
          </Box>
          <SingleOptionDropdownSelect
            ariaLabel='Язык'
            value={language.value}
            onChange={handleLanguageChange}
            options={languageOptions}
            popperMinWidth={CONTROL_WIDTH}
            sx={{ width: CONTROL_WIDTH, minWidth: 0 }}
            textFieldSx={{ minHeight: 38, borderRadius: '9px' }}
            optionTextSx={languageOptionTextSx}
          />
        </Box>
      </Box>
    </PageLayout>
  );
};
