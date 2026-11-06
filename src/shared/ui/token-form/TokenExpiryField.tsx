import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import {
  formatTokenExpiry,
  type TokenExpiryValue,
} from '@/shared/lib/token/tokenExpiryForm';

import { TokenExpiryCalendar } from './TokenExpiryCalendar';
import { TokenPickerField } from './TokenPickerField';

const EXPIRY_POPOVER_HEIGHT = 400;

const calendarIcon = (
  <CalendarTodayOutlinedIcon
    sx={{ flexShrink: 0, color: '#6B7385', fontSize: 15 }}
  />
);

type TokenExpiryFieldProps<T extends TokenExpiryValue> = {
  form: T;
  onChange: (form: T) => void;
};

export const TokenExpiryField = <T extends TokenExpiryValue>({
  form,
  onChange,
}: TokenExpiryFieldProps<T>) => (
  <TokenPickerField
    label='Срок'
    value={formatTokenExpiry(form)}
    icon={calendarIcon}
    estimatedHeight={EXPIRY_POPOVER_HEIGHT}
  >
    {close => (
      <TokenExpiryCalendar form={form} onChange={onChange} onClose={close} />
    )}
  </TokenPickerField>
);
