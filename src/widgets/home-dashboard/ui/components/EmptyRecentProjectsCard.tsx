import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import { alpha, Box, Stack, Typography } from '@mui/material';

import { Button, Card, CardContent, Tooltip } from '@/shared/ui/primitives';

type EmptyRecentProjectsCardProps = {
  canCreateProject: boolean;
  onCreateProject: () => void;
};

export const EmptyRecentProjectsCard = ({
  canCreateProject,
  onCreateProject,
}: EmptyRecentProjectsCardProps) => (
  <Card
    sx={{
      borderRadius: '18px',
      border: theme => `1px dashed ${alpha(theme.palette.primary.main, 0.18)}`,
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.36) 100%)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
    }}
  >
    <CardContent
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack
        direction='row'
        spacing={1.75}
        alignItems='center'
        sx={{ minWidth: 0 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#5b4bff', 0.08),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <GridViewRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.1 }}>
            Пока нет недавних проектов
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: 'text.secondary',
              mt: 0.25,
              lineHeight: 1.2,
            }}
          >
            Создайте свой первый проект для начала работы.
          </Typography>
        </Box>
      </Stack>
      <Tooltip title='' disableHoverListener>
        <span>
          <Button
            variant='outline'
            startIcon={<AddRoundedIcon />}
            disabled={!canCreateProject}
            onClick={onCreateProject}
            sx={{
              alignSelf: { xs: 'stretch', sm: 'center' },
              borderRadius: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            Создать проект
          </Button>
        </span>
      </Tooltip>
    </CardContent>
  </Card>
);
