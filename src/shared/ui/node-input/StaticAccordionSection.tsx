import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  alpha,
  Box,
  Collapse,
  IconButton,
  styled,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

type StaticAccordionSectionProps = {
  badge?: ReactNode;
  children: ReactNode;
  collapsedValue?: ReactNode;
  description?: string | null;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  testId?: string;
  title: string;
  toggleTestId?: string;
};

const SectionCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderMain = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  flex: 1,
});

const SectionIcon = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  flexShrink: 0,
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
}));

const HeaderText = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: 1,
});

const HeaderTitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});

const HeaderActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
});

const CollapsedValueBox = styled(Typography)(({ theme }) => ({
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '2px 10px',
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  fontSize: '0.75rem',
  fontWeight: 500,
}));

const Content = styled(Box)({
  padding: 16,
});

export const StaticAccordionSection = ({
  badge,
  children,
  collapsedValue,
  description,
  icon,
  isOpen,
  onToggle,
  testId,
  title,
  toggleTestId,
}: StaticAccordionSectionProps) => {
  return (
    <SectionCard data-testid={testId}>
      <SectionHeader>
        <HeaderMain>
          <SectionIcon>{icon}</SectionIcon>
          <HeaderText>
            <HeaderTitleRow>
              <Typography
                sx={{
                  minWidth: 0,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.primary',
                }}
              >
                {title}
              </Typography>
              {badge}
            </HeaderTitleRow>

            {description ? (
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                {description}
              </Typography>
            ) : null}
          </HeaderText>
        </HeaderMain>

        <HeaderActions>
          {!isOpen && collapsedValue ? (
            <CollapsedValueBox title={String(collapsedValue)}>
              {collapsedValue}
            </CollapsedValueBox>
          ) : null}

          <IconButton
            size='small'
            onClick={onToggle}
            data-testid={toggleTestId}
            aria-label={isOpen ? 'Свернуть секцию' : 'Развернуть секцию'}
          >
            <ExpandMoreIcon
              sx={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </IconButton>
        </HeaderActions>
      </SectionHeader>

      <Collapse in={isOpen}>
        <Content>{children}</Content>
      </Collapse>
    </SectionCard>
  );
};
