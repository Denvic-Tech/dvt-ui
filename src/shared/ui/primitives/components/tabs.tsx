import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabsMui from '@mui/material/Tabs';
import * as React from 'react';

import { mergeSx } from './control-styles.ts';

type TabsProps = {
  children: React.ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

type TabsListProps = {
  children?: React.ReactNode;
  sx?: React.ComponentProps<typeof TabsMui>['sx'];
};

type TabsTriggerProps = {
  children?: React.ReactNode;
  sx?: React.ComponentProps<typeof Tab>['sx'];
  value: string;
};

type TabsContentProps = {
  children?: React.ReactNode;
  sx?: React.ComponentProps<typeof Box>['sx'];
  value: string;
};

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const value = React.useContext(TabsContext);

  if (!value) {
    throw new Error('Tabs components must be used inside Tabs.');
  }

  return value;
};

const Tabs = ({
  children,
  defaultValue = '',
  onValueChange,
  value: valueProp,
}: TabsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const value = valueProp ?? uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue);
    },
    [onValueChange, valueProp]
  );

  return (
    <TabsContext.Provider value={{ setValue, value }}>
      <Box>{children}</Box>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, sx }: TabsListProps) => {
  const { value, setValue } = useTabsContext();

  return (
    <TabsMui
      {...(sx ? { sx } : {})}
      value={value}
      variant='scrollable'
      onChange={(_event, nextValue: string) => setValue(nextValue)}
    >
      {children}
    </TabsMui>
  );
};

const TabsTrigger = ({ children, sx, value }: TabsTriggerProps) => (
  <Tab {...(sx ? { sx } : {})} label={children} value={value} />
);

const TabsContent = ({ children, sx, value }: TabsContentProps) => {
  const context = useTabsContext();

  if (context.value !== value) {
    return null;
  }

  return (
    <Box sx={mergeSx({ mt: 2 }, sx)}>
      {children}
    </Box>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
