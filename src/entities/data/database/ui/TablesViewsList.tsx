import React, { useEffect, useMemo, useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  ListItemIcon,
  TextField,
  Box,
} from '@mui/material';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { DBIcon, SchemaIcon, getIconForDBTableType } from '@/shared/icons.ts';

import type { DbTable as DBTable } from '@/shared/gatewayClient';

type TableMap = {
  [databaseName: string]: {
    [schemaName: string]: DBTable[];
  };
};

const groupTablesByDBAndSchema = (tables: DBTable[]): TableMap => {
  const result: TableMap = {};

  for (const table of tables) {
    const db = table.database_name ?? 'default_db';
    const schema = table.schema_name ?? 'default_schema';

    if (!result[db]) result[db] = {};
    if (!result[db][schema]) result[db][schema] = [];

    result[db][schema].push(table);
  }

  // сортировка таблиц по имени
  for (const db of Object.keys(result)) {
    for (const schema of Object.keys(result[db])) {
      result[db][schema].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return result;
};

/**
 * Пропсы для компоненты DatabaseObjectList
 */
interface DatabaseObjectListProps {
  tables: DBTable[];
  selectedItem?: DBTable | null | undefined;
  onItemClick: (item: DBTable) => void;
  collapseAfterSelect?: boolean;
}

/**
 * Компонента для отображения списка таблиц и представлений из метаданных БД.
 * Позволяет раскрывать списки и выделять выбранный элемент.
 */
export const TablesViewsList: React.FC<DatabaseObjectListProps> = ({
  tables,
  selectedItem,
  onItemClick,
  collapseAfterSelect = false,
}) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (selectedItem) {
      setOpenStates(prev => ({
        ...prev,
        [`db-${selectedItem.database_name || 'default_db'}`]: true,
        [`schema-${selectedItem.database_name}-${selectedItem.schema_name || 'default_schema'}`]:
          true,
      }));
    }
  }, [selectedItem]);

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    return tables.filter(table =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tables, searchQuery]);

  const groupedTables = useMemo(
    () => groupTablesByDBAndSchema(filteredTables),
    [filteredTables]
  );

  const toggle = (key: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTableClick = (table: DBTable) => {
    onItemClick(table);
    if (collapseAfterSelect) {
      setOpenStates({});
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant='outlined'
          placeholder='Поиск по названию таблицы...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size='small'
        />
      </Box>
      <List>
        {Object.entries(groupedTables).map(([database, schemas]) => {
          const dbKey = `db-${database}`;
          return (
            <React.Fragment key={dbKey}>
              <ListItemButton onClick={() => toggle(dbKey)}>
                <ListItemIcon sx={{ minWidth: 'auto', pr: 1 }}>
                  <DBIcon style={{ fontSize: '1.2rem' }} />
                </ListItemIcon>
                <ListItemText primary={<Typography>{database}</Typography>} />
                {openStates[dbKey] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openStates[dbKey]} timeout='auto' unmountOnExit>
                <List component='div' disablePadding sx={{ pl: 2 }}>
                  {Object.entries(schemas).map(([schema, tables]) => {
                    const schemaKey = `schema-${database}-${schema}`;
                    return (
                      <React.Fragment key={schemaKey}>
                        <ListItemButton onClick={() => toggle(schemaKey)}>
                          <ListItemIcon sx={{ minWidth: 'auto', pr: 1 }}>
                            <SchemaIcon style={{ fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography>{schema}</Typography>}
                          />
                          {openStates[schemaKey] ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </ListItemButton>
                        <Collapse
                          in={openStates[schemaKey]}
                          timeout='auto'
                          unmountOnExit
                        >
                          <List component='div' disablePadding sx={{ pl: 4 }}>
                            {tables.map(table => {
                              const TableTypeIcon = getIconForDBTableType(
                                table.type
                              );
                              return (
                                <ListItemButton
                                  key={table.name}
                                  selected={
                                    table.name === selectedItem?.name &&
                                    table.database_name ===
                                      selectedItem?.database_name &&
                                    table.schema_name ===
                                      selectedItem?.schema_name
                                  }
                                  onClick={() => handleTableClick(table)}
                                >
                                  <ListItemIcon
                                    sx={{ minWidth: 'auto', pr: 1 }}
                                  >
                                    <TableTypeIcon
                                      style={{ fontSize: '1.2rem' }}
                                    />
                                  </ListItemIcon>
                                  <ListItemText primary={table.name} />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    );
                  })}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default TablesViewsList;
