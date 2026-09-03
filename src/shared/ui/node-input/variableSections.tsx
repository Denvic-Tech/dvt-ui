import { ListSubheader, type Theme } from '@mui/material';

import type { VariableOutput, VariableType } from '@/shared/lib/variables';

export const groupVariablesByScope = (
  variables: VariableOutput[]
): Array<{
  key: 'user' | 'system';
  label: string;
  items: VariableOutput[];
}> => {
  const user = variables.filter(variable => variable.scope === 'user');
  const system = variables.filter(variable => variable.scope === 'system');

  return [
    { key: 'user' as const, label: 'User variables', items: user },
    { key: 'system' as const, label: 'System variables', items: system },
  ].filter(section => section.items.length > 0);
};

export const getScopeSectionSubheaderSx = (theme: Theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  lineHeight: 1.2,
  textTransform: 'uppercase',
});

export const buildScopeSectionHeader = (label: string) => (
  <ListSubheader disableSticky sx={theme => getScopeSectionSubheaderSx(theme)}>
    {label}
  </ListSubheader>
);

export const filterVariablesByTypes = (
  variables: VariableOutput[],
  compatibleTypes?: VariableType[]
): VariableOutput[] => {
  if (!compatibleTypes?.length) {
    return variables;
  }

  return variables.filter(variable => compatibleTypes.includes(variable.type));
};
