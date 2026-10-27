import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { styled } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import {
  ColumnDescriptionDialog,
  type NodeField,
  useSetNodeColumnDescriptionsMutation,
} from '@/entities/data/lineage';
import { selectNodeDataMap } from '@/entities/project-editor/graph';

import { LineNote, LineText, viewerTokens } from './NodeFieldsViewer.styles';
import { TruncatedLineText } from './TruncatedLineText';

/** Описание вместе с карандашом — одна кнопка; при наведении оба синие. */
const DescriptionButton = styled('button')(({ theme }) => {
  const t = viewerTokens(theme);
  return {
    alignItems: 'center',
    background: 'none',
    border: 0,
    color: t.text3,
    cursor: 'pointer',
    display: 'inline-flex',
    font: 'inherit',
    fontSize: 12.5,
    gap: 4,
    lineHeight: '17px',
    maxWidth: '100%',
    minWidth: 0,
    padding: 0,
    textAlign: 'left',
    transition: 'color .12s',
    '& > :first-of-type': { minWidth: 0 },
    '& svg': { flexShrink: 0, opacity: 0.7 },
    '&:hover, &:hover *, &:focus-visible, &:focus-visible *': {
      color: t.accent,
    },
    '&:hover svg, &:focus-visible svg': { opacity: 1 },
    '&:focus-visible': {
      borderRadius: 3,
      outline: `2px solid ${t.accent}`,
      outlineOffset: 2,
    },
  };
});

/** Текст описания; откуда оно взялось — `DescriptionProvenance` рядом с типом. */
const ColumnDescription = ({ field }: { field: NodeField }) => {
  const description = field.description?.trim();

  if (!description) {
    return <LineText style={{ color: 'inherit' }}>Без описания</LineText>;
  }

  return <TruncatedLineText>{description}</TruncatedLineText>;
};

interface ColumnDescriptionEditorProps {
  projectId: string;
  nodeId: string;
  port: string | null;
  field: NodeField;
  columnType: string | null;
}

/**
 * Описание колонки с редактированием в общем окне `ColumnDescriptionDialog`.
 * Сохраняется описание этой ноды (`declared`); пустое значение удаляет его,
 * и колонка снова наследует описание из источника или предыдущих нод.
 */
export const ColumnDescriptionEditor = ({
  projectId,
  nodeId,
  port,
  field,
  columnType,
}: ColumnDescriptionEditorProps) => {
  const isDeclared = field.description_provenance === 'declared';
  const [isEditing, setIsEditing] = useState(false);
  const [saveDescriptions, { isLoading, error, reset }] =
    useSetNodeColumnDescriptionsMutation();
  const nodeData = useAppSelector(state => selectNodeDataMap(state)[nodeId]);
  const nodeName = nodeData?.displayName || nodeData?.name || 'эту ноду';

  const startEditing = () => {
    reset();
    setIsEditing(true);
  };

  const closeEditor = () => {
    reset();
    setIsEditing(false);
  };

  const save = async (description: string | null) => {
    const result = await saveDescriptions({
      projectId,
      nodeId,
      port,
      fields: [{ column: field.name, description }],
    });

    if (!('error' in result)) {
      setIsEditing(false);
    }
  };

  const inheritedDescription = isDeclared ? null : field.description?.trim();

  return (
    <>
      <LineNote as='div' style={{ display: 'flex', minWidth: 0 }}>
        <DescriptionButton
          type='button'
          aria-label={`Изменить описание колонки ${field.name}`}
          data-testid='widgets/node-fields-viewer/edit-description'
          onClick={startEditing}
        >
          <ColumnDescription field={field} />
          <EditOutlinedIcon aria-hidden='true' sx={{ fontSize: 13 }} />
        </DescriptionButton>
      </LineNote>
      <ColumnDescriptionDialog
        open={isEditing}
        columnName={field.name}
        meta={columnType}
        initialValue={isDeclared ? (field.description ?? '') : ''}
        {...(inheritedDescription
          ? { placeholder: `Наследуется: ${inheritedDescription}` }
          : {})}
        hint={`Запишется в ноду «${nodeName}» и будет наследоваться ниже по цепочке.`}
        canDelete={isDeclared}
        isSaving={isLoading}
        errorMessage={
          error
            ? 'message' in error
              ? error.message
              : 'Не удалось сохранить описание колонки.'
            : null
        }
        onSave={description => void save(description)}
        onClose={closeEditor}
      />
    </>
  );
};
