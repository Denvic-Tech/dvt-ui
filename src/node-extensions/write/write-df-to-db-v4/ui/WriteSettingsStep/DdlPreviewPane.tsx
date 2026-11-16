import {
  IconButtonBase,
  SkeletonBar,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import {
  CheckIcon,
  CopyIcon,
  RefreshIcon,
} from '@/shared/ui/clean-minimal/icons';
import {
  SqlPreview,
  SqlPreviewFrame,
} from '@/shared/ui/clean-minimal/SqlPreview';

import { MessageBox } from '../schema-step/SchemaStep.styles';

import {
  DdlActions,
  DdlCodeWrap,
  DdlEmpty,
  DdlPane,
  DdlSkeleton,
} from './settings.styles';

const SKELETON_WIDTHS = [75, 60, 85, 70, 55, 65];

type DdlPreviewPaneProps = {
  isTableNew: boolean;
  sql: string;
  error: string | null;
  isLoading: boolean;
  /** SQL получен до последних изменений параметров. */
  isStale: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
  copied: boolean;
  onCopy: () => void;
};

/** DDL создаваемой таблицы (макет: `.q4d`). */
export const DdlPreviewPane = ({
  isTableNew,
  sql,
  error,
  isLoading,
  isStale,
  canRefresh,
  onRefresh,
  copied,
  onCopy,
}: DdlPreviewPaneProps) => {
  if (!isTableNew) {
    return (
      <DdlPane aria-label='DDL'>
        <SqlPreviewFrame>
          <DdlEmpty>DDL формируется только для новой таблицы</DdlEmpty>
        </SqlPreviewFrame>
      </DdlPane>
    );
  }

  const refreshTitle = isStale ? 'DDL устарел — обновить' : 'Обновить DDL';

  return (
    <DdlPane aria-label='DDL'>
      {error ? (
        <MessageBox tone='error' role='alert'>
          {error}
        </MessageBox>
      ) : null}
      <DdlCodeWrap stale={isStale && Boolean(sql)}>
        <DdlActions>
          <IconButtonBase
            type='button'
            aria-label='Обновить DDL'
            title={refreshTitle}
            disabled={!canRefresh || isLoading}
            onClick={onRefresh}
            style={isStale && canRefresh ? { color: '#4343D6' } : undefined}
          >
            {isLoading ? <Spinner size={13} /> : <RefreshIcon />}
          </IconButtonBase>
          {sql ? (
            <IconButtonBase
              type='button'
              aria-label={copied ? 'Скопировано' : 'Копировать'}
              title={copied ? 'Скопировано' : 'Копировать'}
              onClick={onCopy}
            >
              {copied ? (
                <CheckIcon size={13} strokeWidth={1.8} />
              ) : (
                <CopyIcon />
              )}
            </IconButtonBase>
          ) : null}
        </DdlActions>
        <SqlPreviewFrame>
          {sql ? (
            <SqlPreview sql={sql} ariaLabel='DDL создаваемой таблицы' />
          ) : isLoading ? (
            <DdlSkeleton aria-label='Генерация DDL'>
              {SKELETON_WIDTHS.map((width, index) => (
                <SkeletonBar key={index} style={{ width: `${width}%` }} />
              ))}
            </DdlSkeleton>
          ) : (
            <DdlEmpty>
              {canRefresh
                ? 'Нажмите «Обновить DDL», чтобы получить SQL.'
                : 'Заполните обязательные поля, чтобы получить DDL'}
            </DdlEmpty>
          )}
        </SqlPreviewFrame>
      </DdlCodeWrap>
    </DdlPane>
  );
};
