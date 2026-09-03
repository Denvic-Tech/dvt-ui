import React from 'react';

import {
  MenuActionButton,
  MenuContainer,
  MenuDivider,
  MenuIconContainer,
  MenuItemContent,
  MenuItemDescription,
  MenuItemTitle,
  StyledPopover,
} from './ProjectContextMenu.styles.ts';

interface ProjectContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onCopy?: () => void;
  onDelete: () => void;
  renameDescription?: string;
  copyDescription?: string;
  deleteDescription?: string;
}

export const ProjectContextMenu: React.FC<ProjectContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onRename,
  onCopy,
  onDelete,
  renameDescription = 'Изменить название проекта',
  copyDescription = 'Создать копию проекта',
  deleteDescription = 'Удалить проект навсегда',
}) => {
  return (
    <StyledPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuContainer data-testid='features/projects/users-projects/project-context-menu'>
        <MenuActionButton
          type='button'
          data-testid='features/projects/users-projects/project-rename-menu-item'
          onClick={onRename}
        >
          <MenuIconContainer className='menu-icon-container'>
            <svg
              className='menu-icon'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </MenuIconContainer>
          <MenuItemContent>
            <MenuItemTitle>Переименовать</MenuItemTitle>
            <MenuItemDescription>{renameDescription}</MenuItemDescription>
          </MenuItemContent>
        </MenuActionButton>

        {onCopy ? (
          <>
            <MenuActionButton
              type='button'
              data-testid='features/projects/users-projects/project-copy-menu-item'
              onClick={onCopy}
            >
              <MenuIconContainer className='menu-icon-container'>
                <svg
                  className='menu-icon'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
              </MenuIconContainer>
              <MenuItemContent>
                <MenuItemTitle>Копировать</MenuItemTitle>
                <MenuItemDescription>{copyDescription}</MenuItemDescription>
              </MenuItemContent>
            </MenuActionButton>
          </>
        ) : null}

        <MenuDivider />

        <MenuActionButton
          type='button'
          data-testid='features/projects/users-projects/project-delete-menu-item'
          tone='danger'
          onClick={onDelete}
        >
          <MenuIconContainer className='menu-icon-container' tone='danger'>
            <svg
              className='menu-icon'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </MenuIconContainer>
          <MenuItemContent>
            <MenuItemTitle tone='danger'>Удалить</MenuItemTitle>
            <MenuItemDescription tone='danger'>
              {deleteDescription}
            </MenuItemDescription>
          </MenuItemContent>
        </MenuActionButton>
      </MenuContainer>
    </StyledPopover>
  );
};
