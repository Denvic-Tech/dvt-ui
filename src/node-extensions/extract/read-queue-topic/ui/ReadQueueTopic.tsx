import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Collapse,
  FormHelperText,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';
import ViewListIcon from '@mui/icons-material/ViewList';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types.ts';
import {
  AccordionBadge,
  AccordionChevron,
  AccordionContainer,
  AccordionContent,
  AccordionHeader,
  AccordionHeaderLeft,
  AccordionIcon,
  AccordionItem,
  AccordionTitle,
  CollapsedValue,
  FieldGroup,
  FieldLabel,
  RequiredStar,
  StyledInput,
} from './styles';
import { useQueueTopics } from '@/entities/project/queue-topic/model/hooks.ts';

type ReadQueueTopicValues = {
  topic_id?: string | null;
  stream_key?: string | null;
  count_limit?: number | null;
  chunk_size?: number;
  index_col?: string | null;
  delete_after_read?: boolean;
};

export const ReadQueueTopic: React.FC<
  NodeModalExtensionProps<ReadQueueTopicValues>
> = ({ localInputData, setLocalInputData, setValidationCallback }) => {
  const { topics, isLoading, getTopicById } = useQueueTopics();

  const [errors, setErrors] = useState<
    Partial<Record<keyof ReadQueueTopicValues, string>>
  >({});
  const [openSections, setOpenSections] = useState<string[]>(() => {
    return !localInputData?.topic_id ? ['topic'] : ['settings'];
  });

  useEffect(() => {
    setLocalInputData(prev => {
      const current = prev || {};
      const updates: Partial<ReadQueueTopicValues> = {};
      if (!current.chunk_size) updates.chunk_size = 5000;

      if (Object.keys(updates).length > 0) return { ...current, ...updates };
      return current;
    });
  }, [setLocalInputData]);

  const selectedTopic = useMemo(
    () => getTopicById(localInputData?.topic_id),
    [topics, localInputData?.topic_id]
  );

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleInputChange = (field: keyof ReadQueueTopicValues, value: any) => {
    setLocalInputData(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!localInputData?.topic_id) newErrors.topic_id = 'Выберите топик';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [localInputData]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [validate, setValidationCallback]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <AccordionContainer>
        {/* Секция 1: Выбор топика */}
        <AccordionItem hasError={!!errors.topic_id}>
          <AccordionHeader
            isOpen={openSections.includes('topic')}
            onClick={() => toggleSection('topic')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon
                isOpen={openSections.includes('topic')}
                hasError={!!errors.topic_id}
              >
                <StorageIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={openSections.includes('topic')}>
                Топик очереди
              </AccordionTitle>
              <RequiredStar>*</RequiredStar>
            </AccordionHeaderLeft>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!openSections.includes('topic') && selectedTopic && (
                <CollapsedValue title={selectedTopic.name}>
                  {selectedTopic.name}
                </CollapsedValue>
              )}
              <AccordionChevron isOpen={openSections.includes('topic')} />
            </Box>
          </AccordionHeader>
          <Collapse in={openSections.includes('topic')}>
            <AccordionContent>
              <FieldGroup>
                <FieldLabel>Выберите топик из списка</FieldLabel>
                <Autocomplete
                  options={topics}
                  loading={isLoading}
                  getOptionLabel={o => o.name || o.id}
                  value={selectedTopic || null}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_, val) => {
                    setLocalInputData(prev => ({
                      ...prev,
                      topic_id: val?.id || null,
                    }));
                    setErrors(prev => {
                      const { topic_id, ...rest } = prev;
                      return rest;
                    });
                  }}
                  renderInput={params => {
                    const { size, ...rest } = params;

                    return (
                      <TextField
                        {...rest}
                        {...(rest as any)}
                        size='small'
                        error={Boolean(errors.topic_id)}
                        placeholder='Поиск топика...'
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isLoading && (
                                <CircularProgress color='inherit' size={20} />
                              )}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    );
                  }}
                />
                {errors.topic_id && (
                  <FormHelperText error>{errors.topic_id}</FormHelperText>
                )}
              </FieldGroup>
            </AccordionContent>
          </Collapse>
        </AccordionItem>

        {/* Секция 2: Параметры чтения */}
        <AccordionItem>
          <AccordionHeader
            isOpen={openSections.includes('settings')}
            onClick={() => toggleSection('settings')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon isOpen={openSections.includes('settings')}>
                <TuneIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={openSections.includes('settings')}>
                Параметры чтения
              </AccordionTitle>
            </AccordionHeaderLeft>
            <AccordionChevron isOpen={openSections.includes('settings')} />
          </AccordionHeader>
          <Collapse in={openSections.includes('settings')}>
            <AccordionContent>
              <FieldGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={!!localInputData?.delete_after_read}
                      onChange={e =>
                        handleInputChange('delete_after_read', e.target.checked)
                      }
                    />
                  }
                  label={
                    <Typography variant='body2'>
                      Удалять сообщения из Redis после прочтения
                    </Typography>
                  }
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Limit (сообщений)</FieldLabel>
                <StyledInput
                  type='number'
                  value={localInputData?.count_limit ?? ''}
                  onChange={e =>
                    handleInputChange(
                      'count_limit',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Stream Key (Optional)</FieldLabel>
                <StyledInput
                  value={localInputData?.stream_key ?? ''}
                  placeholder={
                    selectedTopic
                      ? `queue_topic:${selectedTopic.id}:stream`
                      : 'Оставьте пустым'
                  }
                  onChange={e =>
                    handleInputChange('stream_key', e.target.value)
                  }
                />
              </FieldGroup>
            </AccordionContent>
          </Collapse>
        </AccordionItem>

        {/* Секция 3: Схема */}
        <AccordionItem>
          <AccordionHeader
            isOpen={openSections.includes('schema')}
            onClick={() => toggleSection('schema')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon isOpen={openSections.includes('schema')}>
                <ViewListIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={openSections.includes('schema')}>
                Схема данных
              </AccordionTitle>
              {selectedTopic && (
                <AccordionBadge>
                  {selectedTopic.columns_schema.length + 1}
                </AccordionBadge>
              )}
            </AccordionHeaderLeft>
            <AccordionChevron isOpen={openSections.includes('schema')} />
          </AccordionHeader>
          <Collapse in={openSections.includes('schema')}>
            <AccordionContent>
              {selectedTopic ? (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f0f0f0',
                      pb: 0.5,
                    }}
                  >
                    <Typography
                      variant='caption'
                      sx={{
                        fontFamily: 'monospace',
                        color: 'primary.main',
                        fontWeight: 'bold',
                      }}
                    >
                      _stream_id
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      STRING
                    </Typography>
                  </Box>
                  {selectedTopic.columns_schema.map((col, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f0f0f0',
                        py: 0.5,
                      }}
                    >
                      <Typography
                        variant='caption'
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {col.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {col.dtype}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant='caption' color='text.secondary'>
                  Выберите топик для просмотра схемы
                </Typography>
              )}
            </AccordionContent>
          </Collapse>
        </AccordionItem>
      </AccordionContainer>
    </Box>
  );
};
