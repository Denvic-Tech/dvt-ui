import Ajv, { type ValidateFunction } from 'ajv';
import { z } from 'zod';

import {
  type InputDefinitionModel,
  type NodeDefinition,
  zIo,
} from '@/shared/gatewayClient';
import { isConst, isExpressionValue } from '@/shared/lib/node-input-values';
import { getDefaultValueForTypeInternal } from '@/shared/lib/node-io';

/**
 * Создает схему валидации Zod на основе определения входов ноды
 */
export function createNodeValidationSchema(
  nodeDefinition: NodeDefinition
): z.ZodSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  Object.values(nodeDefinition.input_definitions ?? {}).forEach(
    (inputDef: InputDefinitionModel) => {
      let fieldSchema = createFieldSchema(inputDef);

      if (inputDef.optional) {
        fieldSchema = z.optional(z.union([fieldSchema, z.null()]));
      }

      schemaFields[inputDef.attr_name] = fieldSchema;
    }
  );

  return z.object(schemaFields);
}

/**
 * Создает схему для отдельного поля на основе его определения
 */
function createFieldSchema(inputDef: InputDefinitionModel): z.ZodTypeAny {
  const { type, options, is_literal_type, is_list_type } = inputDef;

  let schema: z.ZodTypeAny;

  // Если это literal type (выбор из списка)
  if (is_literal_type && options && options.length > 0) {
    schema = z.enum(options as [string, ...string[]]);
    // Если это список literal типов
    if (is_list_type) {
      schema = z.array(schema);
    }
  }

  // Обрабатываем массивы типов
  if (Array.isArray(type)) {
    // Для массива типов создаем union
    const schemas = type.map(t => createSchemaForIOType(inputDef));
    schema = z.union(
      schemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
    );
    // Если это список union типов
    if (is_list_type) {
      schema = z.array(schema);
    }
  }

  schema = createSchemaForIOType(inputDef);

  // Если это список типов, оборачиваем в массив
  if (is_list_type) {
    schema = z.array(schema);
  }

  if (inputDef.optional) {
    schema = z.optional(z.union([schema, z.null()]));
  }

  return schema;
}

const SCHEMA_EXPRESSION_VALIDATION_SENTINEL = Symbol(
  'schema-expression-validation'
);
const jsonSchemaValidator = new Ajv({ allErrors: true, strict: false });
const jsonSchemaValidatorCache = new WeakMap<object, ValidateFunction | null>();

const getJsonSchemaValidator = (schema: object): ValidateFunction | null => {
  if (jsonSchemaValidatorCache.has(schema)) {
    return jsonSchemaValidatorCache.get(schema) ?? null;
  }

  try {
    const validator = jsonSchemaValidator.compile(schema);
    jsonSchemaValidatorCache.set(schema, validator);
    return validator;
  } catch (error) {
    // NodeDefinition приходит с backend и не должен ломать сохранение всей формы,
    // даже если отдельная JSON Schema повреждена (например, содержит битый $ref).
    // Runtime/backend validation остается authoritative fallback для такого поля.
    console.warn('Не удалось скомпилировать JSON Schema входа ноды:', error);
    jsonSchemaValidatorCache.set(schema, null);
    return null;
  }
};

const zJsonSchema = (schema: unknown, fieldLabel: string) => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return z.any();
  }

  const validator = getJsonSchemaValidator(schema);
  if (!validator) {
    return z.any();
  }

  return z.custom(
    value =>
      value === SCHEMA_EXPRESSION_VALIDATION_SENTINEL || validator(value),
    {
      message: `${fieldLabel} не соответствует ожидаемой структуре`,
    }
  );
};

const zDict = <T extends z.ZodTypeAny>(value: T, fieldLabel?: string) =>
  z.preprocess(
    // Если значение null или undefined, возвращаем {}, иначе само значение
    v => (v == null ? {} : v),
    z
      .custom<
        Record<string, unknown>
      >(v => typeof v === 'object' && v !== null && !Array.isArray(v), fieldLabel ? { message: `${fieldLabel} должно быть объектом` } : undefined)
      .and(z.record(z.string(), value))
  );

/**
 * Создает схему для конкретного IO типа
 */
function createSchemaForIOType(inputDef: InputDefinitionModel): z.ZodTypeAny {
  switch (inputDef.type) {
    case zIo.enum.STRING: {
      const fieldName = inputDef.display_name || inputDef.attr_name;
      let stringSchema = z.string({
        error: `${fieldName} должно быть строкой`,
      });

      // Только для неопциональных полей добавляем проверку на пустую строку
      if (!inputDef.optional) {
        stringSchema = stringSchema.min(1, `${fieldName} обязательно`);
      }

      return stringSchema;
    }

    case zIo.enum.INT: {
      const fieldName = inputDef.display_name || inputDef.attr_name;
      let intSchema = z.preprocess(
        val => {
          // Если пустая строка, возвращаем 0 для не-optional полей
          if (val === '') {
            return inputDef.optional ? null : 0;
          }
          // Преобразуем строку в число, если это возможно
          if (typeof val === 'string') {
            const num = Number(val);
            return isNaN(num) ? val : num;
          }
          return val;
        },
        z.union([
          z
            .number({
              error: `${fieldName} должно быть числом`,
            })
            .int(`${fieldName} должно быть целым числом`),
          z.null(),
        ])
      );

      if (typeof inputDef.min_value === 'number') {
        intSchema = intSchema.refine(
          val => {
            if (val === null) return true; // null проходит для optional полей
            return val >= inputDef.min_value!;
          },
          {
            message: `Минимальное значение: ${inputDef.min_value}`,
          }
        );
      }
      if (typeof inputDef.max_value === 'number') {
        intSchema = intSchema.refine(
          val => {
            if (val === null) return true; // null проходит для optional полей
            return val <= inputDef.max_value!;
          },
          {
            message: `Максимальное значение: ${inputDef.max_value}`,
          }
        );
      }
      return intSchema;
    }

    case zIo.enum.FLOAT: {
      const fieldName = inputDef.display_name || inputDef.attr_name;
      let floatSchema = z.preprocess(
        val => {
          // Если пустая строка, возвращаем 0.0 для не-optional полей
          if (val === '') {
            return inputDef.optional ? null : 0.0;
          }
          // Преобразуем строку в число, если это возможно
          if (typeof val === 'string') {
            const num = Number(val);
            return isNaN(num) ? val : num;
          }
          return val;
        },
        z.union([
          z.number({
            error: `${fieldName} должно быть числом`,
          }),
          z.null(),
        ])
      );

      if (typeof inputDef.min_value === 'number') {
        floatSchema = floatSchema.refine(
          val => {
            if (val === null) return true; // null проходит для optional полей
            return val >= inputDef.min_value!;
          },
          {
            message: `Минимальное значение: ${inputDef.min_value}`,
          }
        );
      }
      if (typeof inputDef.max_value === 'number') {
        floatSchema = floatSchema.refine(
          val => {
            if (val === null) return true; // null проходит для optional полей
            return val <= inputDef.max_value!;
          },
          {
            message: `Максимальное значение: ${inputDef.max_value}`,
          }
        );
      }
      return floatSchema;
    }

    case zIo.enum.BOOLEAN:
      return z.boolean({
        error: `${inputDef.display_name || inputDef.attr_name} должно быть булевым значением (true/false)`,
      });

    case zIo.enum.DATETIME:
      return z.union([
        z.date(),
        z.string().refine(
          val => {
            try {
              return !isNaN(new Date(val).getTime());
            } catch {
              return false;
            }
          },
          {
            message: `${inputDef.display_name || inputDef.attr_name} должно быть валидной датой`,
          }
        ),
      ]);

    case zIo.enum.DICT:
      return zDict(z.any(), inputDef.display_name || inputDef.attr_name);

    case zIo.enum.SCHEMA:
      return zJsonSchema(
        inputDef.schema,
        inputDef.display_name || inputDef.attr_name
      );

    case zIo.enum.COLUMN_NAME:
      return z
        .string({
          error: `${inputDef.display_name || inputDef.attr_name} должно быть строкой`,
        })
        .min(1, `${inputDef.display_name || inputDef.attr_name} обязательно`);

    case zIo.enum.DATAFRAME:
    case zIo.enum.DB_CONNECTION:
    case zIo.enum.COLUMN:
    case zIo.enum.OBJECT:
      return z.any();

    case zIo.enum.UNKNOWN:
    case '*':
    default:
      return z.any();
  }
}

/**
 * Обогащает данные ноды дефолтными значениями для полей, которые не заданы
 */
export function enrichNodeDataWithDefaults(
  nodeDefinition: NodeDefinition,
  data: Record<string, unknown>
): Record<string, unknown> {
  const enrichedData = { ...data };

  Object.values(nodeDefinition.input_definitions ?? {}).forEach(
    (inputDef: InputDefinitionModel) => {
      // Если поле не задано в данных
      if (
        enrichedData[inputDef.attr_name] === undefined ||
        enrichedData[inputDef.attr_name] === null
      ) {
        // Если у поля есть default значение, используем его
        if (inputDef.default !== undefined && inputDef.default !== null) {
          enrichedData[inputDef.attr_name] = inputDef.default;
        } else if (!inputDef.optional) {
          // Если поле не optional, устанавливаем системное дефолтное значение
          const defaultValue = getDefaultValueForTypeInternal(inputDef.type);

          // Для DICT типа обрабатываем специально
          if (inputDef.type === zIo.enum.DICT) {
            if (typeof defaultValue === 'string') {
              try {
                enrichedData[inputDef.attr_name] = JSON.parse(defaultValue);
              } catch {
                enrichedData[inputDef.attr_name] = {};
              }
            } else {
              enrichedData[inputDef.attr_name] = defaultValue;
            }
          } else {
            enrichedData[inputDef.attr_name] = defaultValue;
          }
        }
      }
    }
  );

  return enrichedData;
}

const getValidationPlaceholderForInput = (
  inputDef: InputDefinitionModel
): unknown => {
  if (inputDef.default !== undefined && inputDef.default !== null) {
    return inputDef.default;
  }

  if (inputDef.optional) {
    return null;
  }

  if (inputDef.is_literal_type && inputDef.options?.length) {
    return inputDef.options[0];
  }

  if (inputDef.is_list_type) {
    return [];
  }

  const baseType = Array.isArray(inputDef.type)
    ? inputDef.type[0]
    : inputDef.type;

  if (baseType === zIo.enum.STRING || baseType === zIo.enum.COLUMN_NAME) {
    return 'variable';
  }

  if (baseType === zIo.enum.INT || baseType === zIo.enum.FLOAT) {
    let value = 0;
    const min =
      typeof inputDef.min_value === 'number' ? inputDef.min_value : undefined;
    const max =
      typeof inputDef.max_value === 'number' ? inputDef.max_value : undefined;

    if (min !== undefined && value < min) {
      value = min;
    }
    if (max !== undefined && value > max) {
      value = max;
    }

    if (baseType === zIo.enum.INT) {
      return Math.trunc(value);
    }
    return value;
  }

  if (baseType === zIo.enum.BOOLEAN) {
    return false;
  }

  if (baseType === zIo.enum.DICT) {
    return {};
  }

  if (baseType === zIo.enum.DATETIME) {
    return new Date().toISOString();
  }

  return getDefaultValueForTypeInternal(inputDef.type);
};

const normalizeNodeDataForValidation = (
  nodeDefinition: NodeDefinition,
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized = { ...data };

  for (const inputDef of Object.values(
    nodeDefinition.input_definitions ?? {}
  )) {
    const value = normalized[inputDef.attr_name];

    if (isExpressionValue(value)) {
      normalized[inputDef.attr_name] =
        inputDef.type === zIo.enum.SCHEMA
          ? SCHEMA_EXPRESSION_VALIDATION_SENTINEL
          : getValidationPlaceholderForInput(inputDef);
      continue;
    }

    if (isConst(value)) {
      normalized[inputDef.attr_name] = value.value;
    }
  }

  return normalized;
};

/**
 * Валидирует данные ноды и возвращает результат валидации
 */
export function validateNodeData(
  nodeDefinition: NodeDefinition,
  data: Record<string, unknown>
): {
  success: boolean;
  errors: Record<string, string[]>;
  data?: Record<string, unknown>;
} {
  try {
    const normalizedData = normalizeNodeDataForValidation(nodeDefinition, data);

    // Сначала обогащаем данные дефолтными значениями
    const enrichedData = enrichNodeDataWithDefaults(
      nodeDefinition,
      normalizedData
    );

    const schema = createNodeValidationSchema(nodeDefinition);
    const result = schema.safeParse(enrichedData);
    if (result.success) {
      return {
        success: true,
        errors: {},
        data: result.data as Record<string, unknown>,
      };
    } else {
      const errors: Record<string, string[]> = {};

      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });

      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    console.error('Ошибка при валидации:', error);
    return {
      success: false,
      errors: {
        _general: ['Ошибка валидации'],
      },
    };
  }
}

/**
 * Создает функцию валидации для использования в NodeDataModal
 */
export function createValidationCallback(
  nodeDefinition: NodeDefinition,
  getData: () => Record<string, unknown>,
  onValidationError?: (errors: Record<string, string[]>) => void
): () => boolean {
  return () => {
    const data = getData();
    const result = validateNodeData(nodeDefinition, data);

    if (!result.success && onValidationError) {
      onValidationError(result.errors);
    }

    return result.success;
  };
}
