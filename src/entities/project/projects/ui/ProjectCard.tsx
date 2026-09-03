import React, { useMemo, useState } from 'react';
import { Typography, IconButton, Box, Menu, MenuItem } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { ProjectReadSchema as Project } from '@/shared/gatewayClient';
import { useProjects } from '../model/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectID: string, projectName: string) => void | Promise<void>;
  onRename: (projectID: string, projectName: string) => void | Promise<void>;
}

const formatDateToSeconds = (value: string | null | undefined): string => {
  if (!value) return '';
  const str = value.toString();
  return str.length >= 19 ? str.slice(0, 19) : str;
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onRename,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  const { duplicateProject } = useProjects();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleRenameClick = () => {
    handleMenuClose();
    void onRename(project.id, project.name);
  };

  const handleProjectCopy = async () => {
    handleMenuClose();
    await duplicateProject(project.id);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    void onDelete(project.id, project.name);
  };

  const createdAtShort = useMemo(
    () => formatDateToSeconds(project.created_at as unknown as string),
    [project.created_at]
  );

  const updatedAtShort = useMemo(
    () =>
      project.updated_at
        ? formatDateToSeconds(project.updated_at as unknown as string)
        : createdAtShort,
    [project.updated_at, createdAtShort]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        px: 2.5,
        py: 2,
        gap: 2,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {/* Левая часть: название + мета-информация */}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 0.5,
          }}
        >
          <FolderOpenIcon fontSize='small' sx={{ color: 'text.secondary' }} />
          <Typography
            component='a'
            href={`/project-editor/${project.id}`}
            variant='subtitle1'
            sx={{
              fontWeight: 600,
              textDecoration: 'none',
              color: 'primary.main',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {project.name}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            fontSize: 12,
            color: 'text.secondary',
          }}
        >
          {project.user_email && (
            <Typography variant='caption'>
              Автор: {project.user_email}
            </Typography>
          )}
          <Typography variant='caption'>Создан: {createdAtShort}</Typography>
          <Typography variant='caption'>Обновлён: {updatedAtShort}</Typography>
        </Box>
      </Box>

      {/* Правая часть: три точки + меню */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={handleMenuOpen}
          disableRipple
          sx={{
            borderRadius: 1,
            p: 0.5,
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <MoreVertIcon sx={{ fontSize: 26 }} />
        </IconButton>

        <Menu
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          MenuListProps={{
            disablePadding: true,
          }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.4,
                borderRadius: 2,
                minWidth: 140,
                maxWidth: 240,
                width: 'fit-content',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                overflow: 'visible',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -6,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  borderTop: '1px solid',
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                  transform: 'rotate(45deg)',
                  zIndex: 0,
                },
              },
            },
          }}
        >
          <MenuItem
            onClick={handleRenameClick}
            sx={{
              fontSize: 14,
              px: 2,
              py: 0.75,
              mx: 0.5,
              mt: 0.5,
              mb: 0.25,
              borderRadius: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Переименовать
          </MenuItem>
          <MenuItem
            onClick={handleProjectCopy}
            sx={{
              fontSize: 14,
              px: 2,
              py: 0.75,
              mx: 0.5,
              mt: 0.5,
              mb: 0.25,
              borderRadius: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Копировать
          </MenuItem>
          <MenuItem
            onClick={handleDeleteClick}
            sx={{
              fontSize: 14,
              px: 2,
              py: 0.75,
              mx: 0.5,
              mt: 0.25,
              mb: 0.5,
              borderRadius: 1,
              whiteSpace: 'nowrap',
              color: 'error.main',
            }}
          >
            Удалить
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
