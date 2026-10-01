import { IconType } from 'react-icons';
import { BiShow } from 'react-icons/bi'; // для представления (VIEW)
import {
  Bs123, // Int
  BsBox, // Object
  BsCalendarDate, // Datetime
  BsDatabase, // для базы данных
  BsQuestionSquare, // Unknown
  BsTag, // Category
  BsToggleOn, // Boolean
  BsType, // String
} from 'react-icons/bs';
import { GoProjectTemplate } from 'react-icons/go'; // для temporary table
import { GrStatusUnknown } from 'react-icons/gr'; // unknown table type
import {
  IoHourglassOutline, // timeDelta
} from 'react-icons/io5';
import { LuFileSpreadsheet } from 'react-icons/lu';
import {
  MdDataObject, // Dictionary
} from 'react-icons/md';
import {
  TbDecimal, // Float
  TbTable, // для таблицы (BASE_TABLE)
  TbTableOptions, // для системной таблицы (SYSTEM)
} from 'react-icons/tb';

import type { DbTableType as DBTableType } from '@/shared/gatewayClient';
import { DataType } from '@/shared/gatewayClient';

export const dataTypeIconMap: Record<DataType, IconType> = {
  STRING: BsType,
  INT: Bs123,
  FLOAT: TbDecimal,
  BOOLEAN: BsToggleOn,
  DATETIME: BsCalendarDate,
  TIMEDELTA: IoHourglassOutline,
  CATEGORY: BsTag,
  DICTIONARY: MdDataObject,
  OBJECT: BsBox,
  UNKNOWN: BsQuestionSquare,
  BINARY: BsBox,
  LIST: LuFileSpreadsheet,
  STRUCT: MdDataObject,
};

export const DBIcon = BsDatabase; // Иконка для базы данных
export const SchemaIcon = LuFileSpreadsheet; // Иконка для схемы

export const dbTableTypeIconMap: Record<DBTableType, IconType> = {
  BASE_TABLE: TbTable,
  VIEW: BiShow,
  TEMPORARY: GoProjectTemplate,
  SYSTEM: TbTableOptions,
  UNKNOWN: GrStatusUnknown,
};

/**
 * Вспомогательная функция для получения компонента иконки по типу данных.
 * Возвращает иконку "Unknown" если тип не найден.
 * @param dtype - Тип данных колонки
 * @returns React-компонент иконки
 */
export const getIconForDataType = (dtype: DataType): IconType => {
  return dataTypeIconMap[dtype] || BsQuestionSquare;
};

/**
 * Вспомогательная функция для получения компонента иконки по типу таблицы БД.
 * Возвращает иконку "Unknown" если тип не найден.
 * @param tableType - Тип таблицы БД
 * @returns React-компонент иконки
 */
export const getIconForDBTableType = (tableType: DBTableType): IconType => {
  return dbTableTypeIconMap[tableType] || GrStatusUnknown;
};
