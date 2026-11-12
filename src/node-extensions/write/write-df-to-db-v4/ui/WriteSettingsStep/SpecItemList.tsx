import { useState } from 'react';
import { MenuItem } from '@mui/material';

import { IconButtonBase } from '@/shared/ui/clean-minimal/controls';
import { ActionMenu } from '@/shared/ui/clean-minimal/dropdown';
import { MoreIcon, PlusIcon } from '@/shared/ui/clean-minimal/icons';

import {
  AddButton,
  ListHeader,
  ListItem,
  ListItemButton,
  SettingsBox,
} from './settings.styles';

export type SpecListItem = {
  id: string;
  /** Имя, заданное пользователем, или сгенерированное по колонкам. */
  name: string;
  isAutoName: boolean;
  details: string;
  tag?: string;
};

type SpecItemListProps = {
  title: string;
  addLabel: string;
  items: readonly SpecListItem[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

/** Список индексов или внешних ключей (макет: `.qsub` + `.qli`). */
export const SpecItemList = ({
  title,
  addLabel,
  items,
  onAdd,
  onEdit,
  onDelete,
}: SpecItemListProps) => {
  const [menu, setMenu] = useState<{ id: string; anchor: HTMLElement } | null>(
    null
  );

  return (
    <SettingsBox>
      <ListHeader>
        <span className='list-title'>{title}</span>
        <AddButton type='button' onClick={onAdd}>
          <PlusIcon size={12} strokeWidth={1.8} />
          {addLabel}
        </AddButton>
      </ListHeader>
      {items.map(item => (
        <ListItem key={item.id}>
          <ListItemButton
            type='button'
            title={`Изменить ${item.name}`}
            onClick={() => onEdit(item.id)}
          >
            <span className='item-name' data-auto={item.isAutoName}>
              {item.name}
            </span>
            <span className='item-details'>{item.details}</span>
          </ListItemButton>
          {item.tag ? <span className='item-tag'>{item.tag}</span> : null}
          <IconButtonBase
            type='button'
            aria-label={`Действия: ${item.name}`}
            title='Действия'
            aria-haspopup='menu'
            aria-expanded={menu?.id === item.id}
            onClick={event =>
              setMenu({ id: item.id, anchor: event.currentTarget })
            }
          >
            <MoreIcon />
          </IconButtonBase>
        </ListItem>
      ))}
      <ActionMenu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { style: { minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menu) onEdit(menu.id);
            setMenu(null);
          }}
        >
          Изменить
        </MenuItem>
        <MenuItem
          data-tone='danger'
          onClick={() => {
            if (menu) onDelete(menu.id);
            setMenu(null);
          }}
        >
          Удалить
        </MenuItem>
      </ActionMenu>
    </SettingsBox>
  );
};
