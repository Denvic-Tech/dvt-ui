import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import { Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import { SettingsFieldHint, SettingsTextInput } from '@/shared/ui';
import { SingleOptionDropdownSelect } from '@/shared/ui/select/SingleOptionDropdownSelect';

export type ColumnDtypeEntry = {
  columnName: string;
  dtype: string;
};

export type ColumnDtypeOption = {
  label: string;
  value: string;
};

type ColumnDtypeOverridesEditorProps = {
  addLabel?: string;
  columnErrors?: Partial<Record<number, string>>;
  defaultDtype: string;
  description: string;
  emptyText: string;
  entries: ColumnDtypeEntry[];
  onChange: (entries: ColumnDtypeEntry[]) => void;
  options: ColumnDtypeOption[];
  suggestedColumnName?: string;
  title: string;
};

const Card = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 14,
  background: theme.palette.background.paper,
  overflow: 'hidden',
}));

const CardHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  padding: '12px 14px',
  background: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderText = styled('div')({
  minWidth: 0,
  flex: 1,
});

const Title = styled('div')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  color: theme.palette.grey[900],
}));

const Description = styled('div')(({ theme }) => ({
  marginTop: 2,
  fontSize: 11.5,
  color: theme.palette.grey[500],
}));

const AddTypeButton = styled(Button)(({ theme }) => ({
  flexShrink: 0,
  minWidth: 'fit-content',
  minHeight: 32,
  padding: '3px 10px',
  borderRadius: 10,
  textTransform: 'none',
  fontWeight: 600,
  lineHeight: 1.1,
  backgroundColor: theme.palette.background.paper,
  '& .MuiButton-startIcon': {
    marginRight: 6,
  },
}));

const CardBody = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
});

const Row = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 16px 160px 28px',
  alignItems: 'start',
  gap: 10,
  flexShrink: 0,
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
  },
});

const Arrow = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 42,
  color: theme.palette.grey[400],
  '@media (max-width: 760px)': {
    display: 'none',
  },
}));

const SelectWrap = styled('div')({
  minWidth: 0,
});

const DeleteButton = styled(IconButton)(({ theme }) => ({
  width: 28,
  height: 28,
  marginTop: 7,
  color: theme.palette.grey[400],
  borderRadius: 8,
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.grey[600],
  },
  '@media (max-width: 760px)': {
    justifySelf: 'end',
    marginTop: 0,
  },
}));

const EmptyState = styled('div')(({ theme }) => ({
  fontSize: 12.5,
  color: theme.palette.grey[500],
  padding: '4px 2px',
}));

export const ColumnDtypeOverridesEditor = ({
  addLabel = 'Добавить тип',
  columnErrors = {},
  defaultDtype,
  description,
  emptyText,
  entries,
  onChange,
  options,
  suggestedColumnName = '',
  title,
}: ColumnDtypeOverridesEditorProps) => {
  const addEntry = () => {
    onChange([
      ...entries,
      {
        columnName: suggestedColumnName,
        dtype: defaultDtype,
      },
    ]);
  };

  const updateEntry = (index: number, patch: Partial<ColumnDtypeEntry>) => {
    onChange(
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      )
    );
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  };

  return (
    <Card>
      <CardHeader>
        <HeaderText>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </HeaderText>

        <AddTypeButton
          size='small'
          variant='outlined'
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={addEntry}
        >
          {addLabel}
        </AddTypeButton>
      </CardHeader>

      <CardBody>
        {!entries.length ? <EmptyState>{emptyText}</EmptyState> : null}

        {entries.map((entry, index) => {
          const error = columnErrors[index];

          return (
            <Row key={index}>
              <div>
                <SettingsTextInput
                  aria-label={`Имя колонки ${index + 1}`}
                  value={entry.columnName}
                  onChange={event =>
                    updateEntry(index, {
                      columnName: event.currentTarget.value,
                    })
                  }
                  placeholder='имя колонки'
                  hasError={Boolean(error)}
                />
                {error ? (
                  <SettingsFieldHint tone='error'>{error}</SettingsFieldHint>
                ) : null}
              </div>

              <Arrow>
                <EastRoundedIcon sx={{ fontSize: 15 }} />
              </Arrow>

              <SelectWrap>
                <SingleOptionDropdownSelect
                  ariaLabel={`Тип колонки ${index + 1}`}
                  value={entry.dtype}
                  onChange={dtype => updateEntry(index, { dtype })}
                  options={options}
                  popperMinWidth={0}
                  textFieldSx={{
                    minHeight: 42,
                    borderRadius: '10px',
                    backgroundColor: 'background.paper',
                  }}
                  optionTextSx={{
                    fontFamily:
                      '"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: 13.5,
                    color: 'text.primary',
                  }}
                />
              </SelectWrap>

              <DeleteButton
                aria-label={`Удалить dtype ${index + 1}`}
                onClick={() => removeEntry(index)}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
              </DeleteButton>
            </Row>
          );
        })}
      </CardBody>
    </Card>
  );
};
