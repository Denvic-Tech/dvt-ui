import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { keyframes, styled } from '@mui/material/styles';

import type { AIAnalysisStatus } from '@/entities/ai-analysis';

import { Badge } from '@/shared/ui';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.86); }
`;

const Dot = styled('span')({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: 'currentColor',
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

const Spinner = styled('span')({
  width: 8,
  height: 8,
  border: '1.5px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
});

export const AIAnalysisStatusBadge = ({
  status,
}: {
  status: AIAnalysisStatus;
}) => {
  if (status === 'queued') {
    return (
      <Badge variant='default'>
        <Dot />В очереди
      </Badge>
    );
  }

  if (status === 'running') {
    return (
      <Badge variant='primary'>
        <Spinner />
        Анализ
      </Badge>
    );
  }

  if (status === 'success') {
    return (
      <Badge variant='success'>
        <TaskAltIcon sx={{ fontSize: 12 }} />
        Готов
      </Badge>
    );
  }

  return (
    <Badge variant='destructive'>
      <ErrorOutlineIcon sx={{ fontSize: 12 }} />
      Ошибка
    </Badge>
  );
};
