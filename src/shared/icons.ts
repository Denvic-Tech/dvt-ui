import { IconType } from 'react-icons';
import {
  BsType, // String
  Bs123, // Int
  BsToggleOn, // Boolean
  BsCalendarDate, // Datetime
  BsTag, // Category
  BsBox, // Object
  BsQuestionSquare, // Unknown
} from 'react-icons/bs';
import {
  TbDecimal, // Float
} from 'react-icons/tb';
import {
  IoHourglassOutline, // timeDelta
} from 'react-icons/io5';
import {
  MdDataObject, // Dictionary
} from 'react-icons/md';
import { BsDatabase } from 'react-icons/bs'; // для базы данных
import { LuFileSpreadsheet } from 'react-icons/lu';
import { TbTable, TbTableOptions } from 'react-icons/tb'; // для таблицы (BASE_TABLE) и системной таблицы (SYSTEM)
import { BiShow } from 'react-icons/bi'; // для представления (VIEW)
import { GoProjectTemplate } from 'react-icons/go'; // для temporary table
import { GrStatusUnknown } from 'react-icons/gr'; // unknown table type

import { DataType } from '@/shared/gatewayClient';
import type { DbTableType as DBTableType } from '@/shared/gatewayClient';

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
