import React, { useEffect, useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BoltIcon from '@mui/icons-material/Bolt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAlert } from '@/app/notifications/hooks/useAlert';

import { useCurrentProject } from '@/entities/project/projects';

import {
  DisabledOverlay,
  EmptyState,
  FieldError,
  FieldHint,
  FieldLabel,
  HeaderTitle,
  SaveButton,
  SaveSpinner,
  Section,
  SectionHeader,
  SectionIcon,
  SectionTitle,
  SettingsContainer,
  SettingsContent,
  SettingsFooter,
  SettingsHeader,
  StyledInput,
  ToggleLabel,
  ToggleRow,
  ToggleSwitch,
  ValidationBanner,
} from './styles';

export const ProjectSettings: React.FC = () => {
  const { currentProject, updateProjectSettings } = useCurrentProject();
  const { showNotification } = useAlert();

  const [formState, setFormState] = useState({
    name: '',
    store_enabled: false,
    ttl_time: 0,
    workers_count: 0,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ttlInput, setTtlInput] = useState('0');
  const [workersInput, setWorkersInput] = useState('0');
  const [errors, setErrors] = useState<{
    name?: string;
    ttl_time?: string;
    workers_count?: string;
  }>({});

  useEffect(() => {
    if (currentProject) {
      setFormState({
        name: currentProject.name ?? '',
        store_enabled: currentProject.store_enabled ?? false,
        ttl_time: currentProject.ttl_time ?? 0,
        workers_count: currentProject.workers_count ?? 0,
      });
      setHasChanges(false);
      setTtlInput(String(currentProject.ttl_time ?? 0));
      setWorkersInput(String(currentProject.workers_count ?? 0));
      setErrors({});
    }
  }, [currentProject]);

  const clearError = (field: 'name' | 'ttl_time' | 'workers_count') => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateName = (value: string): boolean => {
    const isEmpty = value.trim().length === 0;
    if (isEmpty) {
      setErrors(prev => ({ ...prev, name: 'Название обязательно' }));
      return false;
    }
    clearError('name');
    return true;
  };

  const validateField = (
    field: string,
    value: number,
    rawValue?: string
  ): boolean => {
    const inputValue = rawValue?.trim() ?? '';
    if (field === 'ttl_time') {
      if (!formState.store_enabled) {
        clearError('ttl_time');
        return true;
      }
      const ttlValue = inputValue.length > 0 ? inputValue : ttlInput.trim();
      if (ttlValue.length === 0) {
        setErrors(prev => ({ ...prev, ttl_time: 'Pole obyazatelno' }));
        return false;
      }
      if (value < 0) {
        setErrors(prev => ({
          ...prev,
          ttl_time: 'Значение должно быть 0 или больше',
        }));
        return false;
      }
      clearError('ttl_time');
      return true;
    }

    if (field === 'workers_count') {
      const workersValue =
        inputValue.length > 0 ? inputValue : workersInput.trim();
      if (workersValue.length === 0) {
        setErrors(prev => ({
          ...prev,
          workers_count: 'Значение должно быть 1 или больше',
        }));
        return false;
      }
      if (value < 1) {
        setErrors(prev => ({
          ...prev,
          workers_count: 'Значение должно быть 1 или больше',
        }));
        return false;
      }
      clearError('workers_count');
      return true;
    }

    return true;
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'ttl_time' || field === 'workers_count') {
      if (field === 'ttl_time') {
        if (value === '') {
          setTtlInput('');
          setErrors(prev => ({
            ...prev,
            ttl_time: 'Поле обязательно',
          }));
          setHasChanges(true);
          return;
        }
      }

      if (field === 'workers_count') {
        if (value === '') {
          setWorkersInput('');
          setErrors(prev => ({
            ...prev,
            workers_count: 'Поле обязательно',
          }));
          setHasChanges(true);
          return;
        }
      }

      const numValue = parseInt(value) || 0;

      // Esli znachenie otricatelnoe, ustanavlivaem 0
      const normalizedValue = numValue < 0 ? 0 : numValue;

      setFormState(prev => ({
        ...prev,
        [field]: normalizedValue,
      }));

      if (field === 'ttl_time') {
        setTtlInput(String(normalizedValue));
      }

      if (field === 'workers_count') {
        setWorkersInput(String(normalizedValue));
      }

      // Validatsiya
      validateField(field, normalizedValue, value);
    } else if (field === 'name') {
      setFormState(prev => ({
        ...prev,
        [field]: value,
      }));
      validateName(value);
    } else {
      setFormState(prev => ({
        ...prev,
        [field]: value,
      }));

      if (field === 'store_enabled' && !value) {
        clearError('ttl_time');
      }
    }

    setHasChanges(true);
  };

  const handleInputBlur = (
    field: 'ttl_time' | 'workers_count',
    value: string
  ) => {
    if (field === 'ttl_time' && formState.store_enabled && value === '') {
      setErrors(prev => ({
        ...prev,
        ttl_time: 'Поле обязательно',
      }));
      return;
    }

    if (field === 'workers_count' && value === '') {
      setErrors(prev => ({
        ...prev,
        workers_count: 'Поле обязательно',
      }));
      return;
    }

    const numValue = parseInt(value) || 0;
    const normalizedValue = numValue < 0 ? 0 : numValue;

    if (numValue !== normalizedValue) {
      setFormState(prev => ({
        ...prev,
        [field]: normalizedValue,
      }));
    }

    validateField(field, normalizedValue, value);
  };

  const handleSave = async () => {
    if (!currentProject || !updateProjectSettings || isSaving) return;

    // Proverka validnosti pered sohraneniem
    const isNameValid = validateName(formState.name);
    const isTtlValid = validateField('ttl_time', formState.ttl_time);
    const isWorkersValid = validateField(
      'workers_count',
      formState.workers_count
    );

    if (!isNameValid || !isTtlValid || !isWorkersValid) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateProjectSettings(
        currentProject.id,
        formState.name,
        formState.store_enabled,
        formState.store_enabled ? formState.ttl_time : 0,
        formState.workers_count
      );

      if (result.meta.requestStatus === 'fulfilled') {
        setHasChanges(false);
        showNotification({ type: 'success', title: 'Изменения сохранены' });
        return;
      }

      const payloadMessage =
        result.payload &&
        typeof result.payload === 'object' &&
        'message' in result.payload &&
        typeof result.payload.message === 'string'
          ? result.payload.message
          : '';

      showNotification({
        type: 'error',
        title: 'Не удалось сохранить изменения',
        ...(payloadMessage && { description: payloadMessage }),
      });
      console.error('Ошибка при сохранение настроек:', result);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Не удалось сохранить изменения',
        description: error instanceof Error ? error.message : String(error),
      });
      console.error('Ошибка при сохранение настроек:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isUnchanged =
    !!currentProject &&
    formState.name === (currentProject.name ?? '') &&
    formState.store_enabled === (currentProject.store_enabled ?? false) &&
    (formState.store_enabled ? formState.ttl_time : 0) ===
      ((currentProject.store_enabled ?? false)
        ? (currentProject.ttl_time ?? 0)
        : 0) &&
    formState.workers_count === (currentProject.workers_count ?? 0);

  const isSaveDisabled =
    !hasChanges ||
    isUnchanged ||
    errors.name !== undefined ||
    errors.ttl_time !== undefined ||
    errors.workers_count !== undefined;

  if (!currentProject) {
    return (
      <SettingsContainer>
        <SettingsHeader>
          <HeaderTitle>Параметры проекта</HeaderTitle>
        </SettingsHeader>
        <EmptyState>Выберите проект для настройки</EmptyState>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <SettingsHeader>
        <HeaderTitle>Параметры проекта</HeaderTitle>
      </SettingsHeader>

      <SettingsContent>
        <Section>
          <SectionHeader>
            <SectionIcon variant='info'>
              <InfoOutlinedIcon />
            </SectionIcon>
            <SectionTitle>Основная информация</SectionTitle>
          </SectionHeader>

          <div>
            <FieldLabel>Название проекта</FieldLabel>
            <StyledInput
              type='text'
              variant='info'
              value={formState.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={e => validateName(e.target.value)}
              hasError={!!errors.name}
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </div>
        </Section>

        <Section>
          <SectionHeader>
            <SectionIcon variant='cache'>
              <AccessTimeIcon />
            </SectionIcon>
            <SectionTitle>Кэширование данных (TTL)</SectionTitle>
          </SectionHeader>

          <ToggleRow>
            <ToggleLabel>Включить TTL кэш</ToggleLabel>
            <ToggleSwitch
              type='button'
              checked={formState.store_enabled}
              onClick={() =>
                handleChange('store_enabled', !formState.store_enabled)
              }
              role='switch'
              aria-checked={formState.store_enabled}
              aria-label='Включить TTL cache'
            />
          </ToggleRow>

          <DisabledOverlay disabled={!formState.store_enabled}>
            <FieldLabel>Время жизни (сек)</FieldLabel>
            <StyledInput
              type='number'
              variant='cache'
              value={ttlInput}
              onChange={e => handleChange('ttl_time', e.target.value)}
              onBlur={e => handleInputBlur('ttl_time', e.target.value)}
              disabled={!formState.store_enabled}
              min={0}
              step={1}
              pattern='\\d*'
              hasError={!!errors.ttl_time}
            />
            {errors.ttl_time ? (
              <FieldError>{errors.ttl_time}</FieldError>
            ) : (
              <FieldHint>
                {!formState.store_enabled
                  ? 'Включите TTL cache для настройки времени'
                  : '0 или больше секунд'}
              </FieldHint>
            )}
          </DisabledOverlay>
        </Section>

        <Section>
          <SectionHeader>
            <SectionIcon variant='performance'>
              <BoltIcon />
            </SectionIcon>
            <SectionTitle>Производительность</SectionTitle>
          </SectionHeader>

          <div>
            <FieldLabel>Количество потоков</FieldLabel>
            <StyledInput
              type='number'
              variant='performance'
              value={workersInput}
              onChange={e => handleChange('workers_count', e.target.value)}
              onBlur={e => handleInputBlur('workers_count', e.target.value)}
              min={1}
              step={1}
              pattern='\\d*'
              hasError={!!errors.workers_count}
            />
            {errors.workers_count ? (
              <FieldError>{errors.workers_count}</FieldError>
            ) : (
              <FieldHint>1 или больше потоков</FieldHint>
            )}
          </div>
        </Section>

        {(errors.ttl_time || errors.workers_count) && (
          <ValidationBanner>
            Исправьте ошибки перед сохранением
          </ValidationBanner>
        )}
      </SettingsContent>

      <SettingsFooter>
        <SaveButton
          type='button'
          onClick={handleSave}
          disabled={isSaveDisabled || isSaving}
          isLoading={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          {isSaving && <SaveSpinner aria-hidden='true' />}
        </SaveButton>
      </SettingsFooter>
    </SettingsContainer>
  );
};
