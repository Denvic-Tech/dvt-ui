import * as React from 'react';
import Box from '@mui/material/Box';
import MuiRadio from '@mui/material/Radio';

interface RadioGroupContextValue {
  name: string;
  onValueChange: (value: string) => void;
  value: string | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

const useRadioGroupContext = () => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioGroupItem must be used within RadioGroup');
  }
  return context;
};

export const RadioGroup = ({
  children,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) => {
  const name = React.useId();

  return (
    <RadioGroupContext.Provider
      value={{ name, onValueChange: onValueChange ?? (() => undefined), value }}
    >
      <Box className={className} sx={{ display: 'grid', gap: 1.5 }}>
        {children}
      </Box>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentProps<typeof MuiRadio>, 'checked' | 'name' | 'onChange'> & {
    value: string;
  }
>(({ value, ...props }, ref) => {
  const context = useRadioGroupContext();

  return (
    <MuiRadio
      ref={ref}
      checked={context.value === value}
      name={context.name}
      onChange={() => context.onValueChange(value)}
      size='small'
      value={value}
      {...props}
    />
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
