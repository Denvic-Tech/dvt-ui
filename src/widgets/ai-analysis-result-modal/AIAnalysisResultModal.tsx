import { useEffect } from 'react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useAlert } from '@/app/notifications';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { useSelectNode } from '@/features/project-editor/select-node';

import {
  closeAIAnalysisResultModal,
  fetchAIAnalysisById,
  selectAIAnalysisById,
  selectAIAnalysisResultModalRequestId,
  selectHasActiveAIAnalysis,
  selectLatestErrorAIAnalysis,
  startAIAnalysis,
} from '@/entities/ai-analysis';
import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';

import { Button, Dialog } from '@/shared/ui';

const HeaderBlock = styled('div')({
  padding: '18px 24px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
});

const HeaderLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
});

const HeaderIcon = styled('div')({
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  flexShrink: 0,
});

const HeaderTitleRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});

const HeaderTitle = styled('h2')({
  fontSize: 17,
  fontWeight: 600,
  color: '#111827',
  margin: 0,
});

const StatusPill = styled('span')<{ variant: 'success' | 'error' }>(
  ({ variant }) => ({
    padding: '2px 8px',
    backgroundColor: variant === 'success' ? '#d1fae5' : '#fee2e2',
    color: variant === 'success' ? '#047857' : '#991b1b',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 5,
    textTransform: 'uppercase',
  })
);

const HeaderSubtitle = styled('div')({
  fontSize: 12,
  color: '#6b7280',
  marginTop: 2,
  overflowWrap: 'anywhere',
});

const ScrollableContent = styled('div')({
  overflowY: 'auto',
  padding: 24,
  maxHeight: 'calc(90vh - 150px)',
});

const SummaryCard = styled('div')({
  padding: 18,
  background: 'linear-gradient(135deg, #eef2ff 0%, #f3e8ff 100%)',
  borderRadius: 14,
  marginBottom: 22,
  border: '1px solid #c7d2fe',
});

const SummaryLabel = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
  fontSize: 11,
  fontWeight: 700,
  color: '#4f46e5',
  textTransform: 'uppercase',
});

const SummaryText = styled('div')({
  fontSize: 14,
  color: '#1f2937',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
});

const SectionHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
});

const SectionTitle = styled('h3')({
  fontSize: 15,
  fontWeight: 600,
  color: '#111827',
  margin: 0,
});

const SectionBadge = styled('span')({
  padding: '2px 8px',
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
});

const FindingCard = styled('div')({
  padding: 16,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  marginBottom: 10,
});

const FindingHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
});

const FindingTitle = styled('div')({
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
});

const SeverityBadge = styled('span')<{ level: string }>(({ level }) => {
  const map = {
    critical: { bg: '#fee2e2', color: '#7f1d1d' },
    high: { bg: '#fee2e2', color: '#991b1b' },
    medium: { bg: '#fef3c7', color: '#92400e' },
    low: { bg: '#f3f4f6', color: '#4b5563' },
    info: { bg: '#dbeafe', color: '#1d4ed8' },
  };
  const colors = map[level.toLowerCase() as keyof typeof map] ?? map.info;

  return {
    padding: '2px 8px',
    borderRadius: 6,
    backgroundColor: colors.bg,
    color: colors.color,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
  };
});

const FindingDetails = styled('div')({
  fontSize: 13,
  color: '#4b5563',
  lineHeight: 1.55,
  marginBottom: 10,
  whiteSpace: 'pre-wrap',
});

const EvidenceBlock = styled('div')({
  padding: '10px 12px',
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  fontSize: 12,
  color: '#4b5563',
  lineHeight: 1.5,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  borderLeft: '2px solid #d1d5db',
  marginBottom: 10,
  whiteSpace: 'pre-wrap',
});

const RelatedNodesRow = styled('div')({
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
});

const RecommendationItem = styled('div')({
  display: 'flex',
  gap: 12,
  padding: '14px 16px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  marginBottom: 8,
});

const RecNumber = styled('div')({
  width: 24,
  height: 24,
  backgroundColor: '#d1fae5',
  color: '#10b981',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
});

const RecText = styled('div')({
  fontSize: 13,
  color: '#374151',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
});

const RisksBlock = styled('div')({
  padding: 16,
  backgroundColor: '#fef3c7',
  borderRadius: 14,
});

const RiskItem = styled('div')({
  display: 'flex',
  gap: 8,
  fontSize: 12,
  color: '#374151',
  lineHeight: 1.55,
  marginBottom: 6,

  '&:last-child': {
    marginBottom: 0,
  },
});

const FooterBlock = styled('div')({
  padding: '14px 24px',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  backgroundColor: '#f9fafb',
});

const MetaText = styled('div')({
  fontSize: 11,
  color: '#6b7280',
  overflowWrap: 'anywhere',
});

const FooterActions = styled('div')({
  display: 'flex',
  gap: 8,
  flexShrink: 0,
});

export const AIAnalysisResultModal = () => {
  const dispatch = useAppDispatch();
  const { showNotification } = useAlert();
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);
  const requestId = useAppSelector(selectAIAnalysisResultModalRequestId);
  const item = useAppSelector(state => selectAIAnalysisById(state, requestId));
  const hasActive = useAppSelector(state =>
    selectHasActiveAIAnalysis(state, item?.project_id)
  );
  const latestErrorRequestId = useAppSelector(
    state =>
      selectLatestErrorAIAnalysis(state, item?.project_id)?.request_id ?? null
  );
  const { selectNode } = useSelectNode();

  const result = item?.result;
  const isSuccess = item?.status === 'success' && Boolean(result);
  const canRerunError =
    item?.status !== 'error' || item.request_id === latestErrorRequestId;

  useEffect(() => {
    if (!item || !requestId || item.result || item.status !== 'success') {
      return;
    }

    void dispatch(
      fetchAIAnalysisById({
        projectId: item.project_id,
        requestId,
      })
    );
  }, [dispatch, item, requestId]);

  const handleClose = () => {
    dispatch(closeAIAnalysisResultModal());
  };

  if (!isAIAnalysisEnabled || !item || !requestId) {
    return null;
  }

  const handleRerun = async () => {
    if (!item.task_id || hasActive || !canRerunError) {
      return;
    }

    try {
      await dispatch(
        startAIAnalysis({
          projectId: item.project_id,
          task_id: item.task_id,
        })
      ).unwrap();
      handleClose();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'AI-анализ не запущен',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить повторный анализ',
      });
    }
  };

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
    handleClose();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth='md'
      PaperProps={{
        sx: {
          width: 720,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <HeaderBlock>
        <HeaderLeft>
          <HeaderIcon>
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </HeaderIcon>
          <div>
            <HeaderTitleRow>
              <HeaderTitle>AI-анализ ошибки</HeaderTitle>
              {item.status === 'success' ? (
                <StatusPill variant='success'>success</StatusPill>
              ) : null}
              {item.status === 'error' ? (
                <StatusPill variant='error'>error</StatusPill>
              ) : null}
            </HeaderTitleRow>
            <HeaderSubtitle>
              задача {item.task_id ?? 'не указана'} ·{' '}
              {new Date(item.finished_at ?? item.created_at).toLocaleString(
                'ru-RU'
              )}
            </HeaderSubtitle>
          </div>
        </HeaderLeft>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={handleClose}
          aria-label='Закрыть'
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </Button>
      </HeaderBlock>

      <ScrollableContent>
        {item.status === 'error' ? (
          <SummaryCard
            style={{ background: '#fee2e2', borderColor: '#fecaca' }}
          >
            <SummaryLabel style={{ color: '#991b1b' }}>
              <ErrorOutlineIcon sx={{ fontSize: 14 }} />
              Ошибка выполнения
            </SummaryLabel>
            <SummaryText>{item.error ?? 'Неизвестная ошибка'}</SummaryText>
          </SummaryCard>
        ) : null}

        {isSuccess && result ? (
          <>
            <SummaryCard>
              <SummaryLabel>
                <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                Что произошло
              </SummaryLabel>
              <SummaryText>{result.content.summary}</SummaryText>
            </SummaryCard>

            {result.content.findings.length > 0 ? (
              <Box sx={{ mb: 2.75 }}>
                <SectionHeader>
                  <SectionTitle>Находки</SectionTitle>
                  <SectionBadge>{result.content.findings.length}</SectionBadge>
                </SectionHeader>
                {result.content.findings.map((finding, index) => (
                  <FindingCard key={`${finding.title}-${index}`}>
                    <FindingHeader>
                      <SeverityBadge level={finding.severity}>
                        {finding.severity}
                      </SeverityBadge>
                      <FindingTitle>{finding.title}</FindingTitle>
                    </FindingHeader>
                    <FindingDetails>{finding.details}</FindingDetails>
                    {finding.evidence ? (
                      <EvidenceBlock>
                        <strong>Откуда: </strong>
                        {finding.evidence}
                      </EvidenceBlock>
                    ) : null}
                    {finding.related_node_ids?.length ? (
                      <RelatedNodesRow>
                        {finding.related_node_ids.map(nodeId => (
                          <Button
                            key={nodeId}
                            size='xs'
                            variant='subtle'
                            onClick={() => handleNodeClick(nodeId)}
                          >
                            <AccountTreeIcon sx={{ fontSize: 13 }} />
                            {nodeId}
                          </Button>
                        ))}
                      </RelatedNodesRow>
                    ) : null}
                  </FindingCard>
                ))}
              </Box>
            ) : null}

            {result.content.recommendations.length > 0 ? (
              <Box sx={{ mb: 2.75 }}>
                <SectionHeader>
                  <LightbulbIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <SectionTitle>Что сделать</SectionTitle>
                </SectionHeader>
                {result.content.recommendations.map((recommendation, index) => (
                  <RecommendationItem key={`${recommendation}-${index}`}>
                    <RecNumber>{index + 1}</RecNumber>
                    <RecText>{recommendation}</RecText>
                  </RecommendationItem>
                ))}
              </Box>
            ) : null}

            {result.content.risks.length > 0 ? (
              <RisksBlock>
                <SectionHeader>
                  <ShieldOutlinedIcon sx={{ fontSize: 16, color: '#92400e' }} />
                  <SectionTitle style={{ color: '#92400e' }}>
                    На что обратить внимание
                  </SectionTitle>
                </SectionHeader>
                {result.content.risks.map((risk, index) => (
                  <RiskItem key={`${risk}-${index}`}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>▲</span>
                    {risk}
                  </RiskItem>
                ))}
              </RisksBlock>
            ) : null}
          </>
        ) : null}
      </ScrollableContent>

      <FooterBlock>
        <MetaText>
          {result?.model ?? ''}
          {result?.context?.is_truncated ? ' · контекст обрезан' : ''}
        </MetaText>
        <FooterActions>
          {item.task_id && canRerunError ? (
            <Button
              variant='secondary'
              size='sm'
              onClick={handleRerun}
              disabled={hasActive}
            >
              <RefreshIcon sx={{ fontSize: 14 }} />
              Запустить ещё раз
            </Button>
          ) : null}
          <Button size='sm' onClick={handleClose}>
            Закрыть
          </Button>
        </FooterActions>
      </FooterBlock>
    </Dialog>
  );
};
