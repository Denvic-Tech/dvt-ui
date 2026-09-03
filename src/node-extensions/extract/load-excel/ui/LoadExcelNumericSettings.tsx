import { styled } from '@mui/material/styles';

import {
  SettingsFieldGroup,
  SettingsFieldHint,
  SettingsFieldLabel,
  SettingsTwoColumns,
  SingleOptionDropdownSelect,
} from '@/shared/ui';

import {
  DECIMAL_SEPARATOR_OPTIONS,
  getThousandsPayloadValue,
  getThousandsSelectValue,
  THOUSANDS_SEPARATOR_OPTIONS,
} from './LoadExcelEditor.helpers';

type LoadExcelNumericSettingsProps = {
  decimal: string | null | undefined;
  decimalError?: string | undefined;
  onChange: (patch: { decimal?: string; thousands?: string | null }) => void;
  thousands: string | null | undefined;
  thousandsError?: string | undefined;
};

const Card = styled('section')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 14,
  background: theme.palette.background.paper,
  overflow: 'hidden',
}));

const Header = styled('div')(({ theme }) => ({
  padding: '12px 14px',
  background: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Title = styled('div')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  color: theme.palette.grey[900],
}));

const Description = styled('div')(({ theme }) => ({
  marginTop: 2,
  fontSize: 11.5,
  color: theme.palette.grey[500],
}));

const Body = styled('div')({
  padding: '14px',
});

export const LoadExcelNumericSettings = ({
  decimal,
  decimalError,
  onChange,
  thousands,
  thousandsError,
}: LoadExcelNumericSettingsProps) => (
  <Card>
    <Header>
      <Title>Числа, сохранённые как текст</Title>
      <Description>
        Разделители, по которым такие значения будут распознаны как числа.
      </Description>
    </Header>

    <Body>
      <SettingsTwoColumns>
        <SettingsFieldGroup>
          <SettingsFieldLabel>Разделитель тысяч (thousands)</SettingsFieldLabel>
          <SingleOptionDropdownSelect
            ariaLabel='Разделитель тысяч'
            error={Boolean(thousandsError)}
            value={getThousandsSelectValue(thousands)}
            onChange={value =>
              onChange({ thousands: getThousandsPayloadValue(value) })
            }
            options={THOUSANDS_SEPARATOR_OPTIONS}
            popperMinWidth={0}
          />
          {thousandsError && (
            <SettingsFieldHint tone='error'>{thousandsError}</SettingsFieldHint>
          )}
        </SettingsFieldGroup>

        <SettingsFieldGroup>
          <SettingsFieldLabel>
            Десятичный разделитель (decimal)
          </SettingsFieldLabel>
          <SingleOptionDropdownSelect
            ariaLabel='Десятичный разделитель'
            error={Boolean(decimalError)}
            value={decimal ?? '.'}
            onChange={value => onChange({ decimal: value })}
            options={DECIMAL_SEPARATOR_OPTIONS}
            popperMinWidth={0}
          />
          {decimalError && (
            <SettingsFieldHint tone='error'>{decimalError}</SettingsFieldHint>
          )}
        </SettingsFieldGroup>
      </SettingsTwoColumns>
    </Body>
  </Card>
);
