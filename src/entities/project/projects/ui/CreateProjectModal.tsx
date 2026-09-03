import React, { useCallback, useState } from 'react';

import type { ProjectCreateSchema as ProjectCreate } from '@/shared/gatewayClient';

import {
  CancelButton,
  CreateButton,
  HeaderContent,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  InputField,
  ModalContent,
  ModalFooter,
  ModalHeader,
  StyledDialog,
} from './CreateProjectModal.styles.ts';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (projectData: ProjectCreate) => void;
  loading?: boolean;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onCreate,
  loading = false,
}) => {
  const [projectData, setProjectData] = useState<ProjectCreate>({
    name: '',
  } as ProjectCreate);

  React.useEffect(() => {
    setProjectData({
      name: '',
    } as ProjectCreate);
  }, [open]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setProjectData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (projectData.name.trim()) {
      onCreate({
        name: projectData.name.trim(),
      } as ProjectCreate);
      setProjectData({
        name: '',
      } as ProjectCreate);
    }
  }, [onCreate, projectData.name]);

  const handleClose = () => {
    setProjectData({
      name: '',
    } as ProjectCreate);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && projectData.name.trim() && !loading) {
      handleSubmit();
    }

    if (event.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <StyledDialog open={open} onClose={handleClose}>
      <ModalHeader>
        <HeaderIcon>
          <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M12 6v6m0 0v6m0-6h6m-6 0H6'
            />
          </svg>
        </HeaderIcon>
        <HeaderContent>
          <HeaderTitle>Новый проект</HeaderTitle>
          <HeaderDescription>
            Создайте проект для организации пайплайнов
          </HeaderDescription>
        </HeaderContent>
      </ModalHeader>

      <ModalContent>
        <InputField
          autoFocus
          id='create-project-name'
          name='name'
          data-testid='entities/project/projects/project-name-input'
          type='text'
          placeholder='Название проекта'
          value={projectData.name}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
      </ModalContent>

      <ModalFooter>
        <CancelButton
          type='button'
          data-testid='entities/project/projects/project-create-cancel-button'
          onClick={handleClose}
          disabled={loading}
        >
          Отмена
        </CancelButton>
        <CreateButton
          type='button'
          data-testid='entities/project/projects/project-create-confirm-button'
          onClick={handleSubmit}
          aria-label='Создать проект'
          disabled={!projectData.name.trim() || loading}
        >
          <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4v16m8-8H4'
            />
          </svg>
          Создать
        </CreateButton>
      </ModalFooter>
    </StyledDialog>
  );
};
