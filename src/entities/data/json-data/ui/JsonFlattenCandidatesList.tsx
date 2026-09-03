import { alpha, Box, Button, Paper, Stack, Typography } from '@mui/material';

import type {
  JsonFlattenCandidate,
  JsonFlattenCandidateKind,
} from '@/shared/gatewayClient';

import {
  groupJsonFlattenCandidates,
  JSON_CANDIDATE_KIND_TITLES,
} from '../model/metadata';

const kindDescriptions: Record<JsonFlattenCandidateKind, string> = {
  RECORD_PATH: 'Подходящие корневые массивы/ветки для нормализации в строки.',
  META_PATH: 'Пути, которые полезно вынести в meta-поля.',
  EXPLODE_PATH: 'Пути, которые можно безопасно explode-ить по структуре.',
};

export interface JsonFlattenCandidatesListProps {
  candidates: Array<JsonFlattenCandidate> | null | undefined;
  getActionLabel?: (candidate: JsonFlattenCandidate) => string;
  onCandidateSelect?: (candidate: JsonFlattenCandidate) => void;
}

export const JsonFlattenCandidatesList = ({
  candidates,
  getActionLabel,
  onCandidateSelect,
}: JsonFlattenCandidatesListProps) => {
  const groupedCandidates = groupJsonFlattenCandidates(candidates);
  const hasCandidates = Object.values(groupedCandidates).some(
    group => group.length > 0
  );

  if (!hasCandidates) {
    return (
      <Paper
        elevation={0}
        sx={theme => ({
          p: 2,
          borderRadius: '18px',
          border: `1px dashed ${alpha(theme.palette.common.black, 0.14)}`,
          backgroundColor: alpha(theme.palette.common.white, 0.6),
        })}
      >
        <Typography color='text.secondary' sx={{ fontSize: 13 }}>
          Backend не прислал flatten candidates.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      {(Object.keys(groupedCandidates) as JsonFlattenCandidateKind[]).map(
        kind => {
          const items = groupedCandidates[kind];

          if (items.length === 0) {
            return null;
          }

          return (
            <Paper
              key={kind}
              elevation={0}
              sx={theme => ({
                p: 1.5,
                borderRadius: '18px',
                border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                backgroundColor: alpha(theme.palette.common.white, 0.72),
              })}
            >
              <Stack spacing={1}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {JSON_CANDIDATE_KIND_TITLES[kind]}
                  </Typography>
                  <Typography
                    color='text.secondary'
                    sx={{ mt: 0.25, fontSize: 12 }}
                  >
                    {kindDescriptions[kind]}
                  </Typography>
                </Box>

                <Stack spacing={0.75}>
                  {items.map(candidate => (
                    <Paper
                      key={`${candidate.kind}:${candidate.path}`}
                      elevation={0}
                      sx={theme => ({
                        px: 1.25,
                        py: 1,
                        borderRadius: '14px',
                        border: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.82
                        ),
                      })}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent='space-between'
                        gap={1}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                            {candidate.display_path}
                          </Typography>
                          <Typography
                            color='text.secondary'
                            sx={{
                              mt: 0.25,
                              fontSize: 11.5,
                              wordBreak: 'break-word',
                            }}
                          >
                            {candidate.path} · {candidate.node_kind}
                            {typeof candidate.confidence === 'number'
                              ? ` · confidence ${candidate.confidence.toFixed(2)}`
                              : ''}
                          </Typography>
                          {candidate.reason ? (
                            <Typography
                              color='text.secondary'
                              sx={{
                                mt: 0.35,
                                fontSize: 11.5,
                                wordBreak: 'break-word',
                              }}
                            >
                              {candidate.reason}
                            </Typography>
                          ) : null}
                        </Box>

                        {onCandidateSelect ? (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => onCandidateSelect(candidate)}
                          >
                            {getActionLabel?.(candidate) ?? 'Использовать'}
                          </Button>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          );
        }
      )}
    </Stack>
  );
};
