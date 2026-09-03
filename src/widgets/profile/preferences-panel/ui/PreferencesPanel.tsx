import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  FormControl,
  FormLabel,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLanguageContext } from '@/app/i18n';
import { useThemeModePreference } from '@/entities/ui-preferences';

type Lang = { value: string; label: string };

export const PreferencesPanel: React.FC = () => {
  const { language, setLanguage, languageOptions } = useLanguageContext();
  const theme = useTheme();
  const { setThemeMode } = useThemeModePreference();

  const [pendingLang, setPendingLang] = React.useState(language.value);

  React.useEffect(() => {
    setPendingLang(language.value);
  }, [language.value]);

  const langs: Lang[] =
    Array.isArray(languageOptions) && languageOptions.length
      ? languageOptions
      : [
          { value: 'en', label: 'English' },
          { value: 'ru', label: 'Русский' },
          { value: 'fi', label: 'Suomi' },
        ];

  const save = () => {
    if (pendingLang !== language.value) {
      const selected = langs.find(o => o.value === pendingLang);
      if (selected) {
        setLanguage(selected);
        try {
          localStorage.setItem('ui.language', selected.value);
        } catch {
          /* empty */
        }
      }
    }
    window.location.reload();
  };

  return (
    <Box>
      {/* ================== THEME MODE BOX ================== */}
      <Paper variant='outlined' sx={{ p: 3, mb: 3 }}>
        <FormControl component='fieldset'>
          <FormLabel
            component='legend'
            sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}
          >
            Mode
          </FormLabel>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Choose a color mode.
          </Typography>
        </FormControl>

        <RadioGroup
          value={theme?.palette?.mode}
          onChange={e => {
            const next = e.target.value as 'light' | 'dark';
            setThemeMode(next);
          }}
        >
          <FormControlLabel
            value='light'
            control={<Radio size='small' />}
            label='Light'
          />
          <FormControlLabel
            value='dark'
            control={<Radio size='small' disabled />}
            label='Dark (скоро)'
          />
        </RadioGroup>
      </Paper>

      {/* ================== LANGUAGE BOX ================== */}
      <Paper variant='outlined' sx={{ p: 3 }}>
        <Stack spacing={4}>
          <FormControl component='fieldset'>
            <FormLabel
              component='legend'
              sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}
            >
              Language
            </FormLabel>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Choose an interface language.
            </Typography>
            <RadioGroup
              value={pendingLang}
              onChange={e => setPendingLang(e.target.value)}
            >
              {langs.map(opt => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size='small' />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider />

          <Box>
            <Button variant='contained' onClick={save}>
              Сохранить
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};
