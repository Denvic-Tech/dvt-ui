import * as path from 'node:path';
import * as process from 'node:process';
import { promises as fs } from 'node:fs';

import type { NestedSdkPlugin } from './types';

const INDENT = '  ';
const PATH_PARAM_NAME_FALLBACK_PREFIX = 'param';

interface OperationInfo {
  key: string;
  method: string;
  path: string;
  summary?: string;
  deprecated?: boolean;
  typeNameBase: string;
  dataTypeName: string;
  responseType: string;
  responseTypeImport: string;
  errorTypeName: string;
  hasErrorType: boolean;
  dataSchemaName: string;
  responseSchemaName?: string;
  hasResponseSchema: boolean;
}

interface SegmentNode {
  segment: string;
  type: 'root' | 'static' | 'param';
  children: SegmentNode[];
  operations: OperationInfo[];
  path: string[];
  propertyName?: string;
  paramKey?: string;
  paramIdentifier?: string;
}

const isParamSegment = (segment: string): boolean =>
  segment.startsWith('{') && segment.endsWith('}');

const tokenizeIdentifier = (value: string): string[] =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const sanitizeIdentifier = (value: string, fallback: string): string => {
  let tokens = tokenizeIdentifier(value);

  if (tokens.length === 0) {
    tokens = tokenizeIdentifier(fallback);
  }

  if (tokens.length === 0) {
    tokens = ['value'];
  }

  const [first, ...rest] = tokens;
  const firstToken = first.replace(/^[^A-Za-z_$]+/, '').toLowerCase();
  const restTokens = rest.map(
    token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
  );
  const combined = (firstToken + restTokens.join('')).replace(
    /^[^A-Za-z_$]+/,
    ''
  );

  if (combined.length === 0) {
    return 'value';
  }

  return combined;
};

const escapeSingleQuotes = (value: string): string =>
  value
    .replace(/\\/g, '\\')
    .replace(/'/g, match => String.fromCharCode(92) + match);

const escapeJsDoc = (value: string): string =>
  value.replace(/\*\//g, '*' + String.fromCharCode(92) + '/');

const toPascalCase = (value: string, fallback: string): string => {
  const camel = sanitizeIdentifier(value, fallback);

  if (!camel) {
    const safeFallback = sanitizeIdentifier(fallback, 'value');
    return safeFallback.charAt(0).toUpperCase() + safeFallback.slice(1);
  }

  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const ensureTrailingNewLine = (value: string): string =>
  value.endsWith('\n') ? value : `${value}\n`;

const isValidIdentifier = (value: string): boolean =>
  /^[A-Za-z_$][\w$]*$/.test(value);

const formatPropertyKey = (value: string): string => {
  if (isValidIdentifier(value)) {
    return value;
  }

  return `'${escapeSingleQuotes(value)}'`;
};

const JSON_CONTENT_TYPE_PATTERN =
  /^(application\/json|[^/]+\/[^/]+\+json|text\/json)$/i;

const hasJsonLikeContentType = (mediaType: string): boolean =>
  JSON_CONTENT_TYPE_PATTERN.test(mediaType);

const hasJsonResponseSchema = (operation: {
  responses?: Record<string, unknown>;
}): boolean => {
  const responses = operation.responses;
  if (!responses) {
    return false;
  }

  const hasUsableSchema = (schema: unknown): boolean => {
    if (schema === undefined || schema === null) {
      return false;
    }

    if (typeof schema !== 'object') {
      return true;
    }

    const entries = schema as Record<string, unknown>;

    if ('type' in entries) {
      const typeValue = String(entries['type']).toLowerCase();
      if (typeValue === 'unknown') {
        return false;
      }
    }

    return Object.keys(entries).length > 0;
  };

  for (const [status, response] of Object.entries(responses)) {
    if (!response || typeof response !== 'object') {
      continue;
    }

    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus === 'default' || !/^2/.test(normalizedStatus)) {
      continue;
    }

    const mediaType = (response as { mediaType?: unknown }).mediaType;
    if (typeof mediaType === 'string' && hasJsonLikeContentType(mediaType)) {
      const schema = (response as { schema?: unknown }).schema;
      if (hasUsableSchema(schema)) {
        return true;
      }
    }

    const contentMap = (response as { content?: Record<string, unknown> })
      .content;
    if (!contentMap) {
      continue;
    }

    for (const [mediaTypeKey, mediaObject] of Object.entries(contentMap)) {
      if (!hasJsonLikeContentType(mediaTypeKey)) {
        continue;
      }

      if (!mediaObject || typeof mediaObject !== 'object') {
        continue;
      }

      if (
        'schema' in mediaObject &&
        hasUsableSchema((mediaObject as { schema?: unknown }).schema)
      ) {
        return true;
      }
    }
  }

  return false;
};

const createSegmentNode = (
  segment: string,
  pathSegments: string[]
): SegmentNode => {
  if (isParamSegment(segment)) {
    const paramKey = segment.slice(1, -1);
    const fallback = PATH_PARAM_NAME_FALLBACK_PREFIX + pathSegments.length;
    const paramIdentifier = sanitizeIdentifier(paramKey, fallback);

    return {
      segment,
      type: 'param',
      children: [],
      operations: [],
      path: [...pathSegments, segment],
      propertyName: paramIdentifier,
      paramKey,
      paramIdentifier,
    };
  }

  const fallback = `segment${pathSegments.length}`;
  const sanitized = sanitizeIdentifier(segment, fallback);
  const propertyName = isValidIdentifier(segment)
    ? segment
    : isValidIdentifier(sanitized)
      ? sanitized
      : fallback;

  return {
    segment,
    type: 'static',
    children: [],
    operations: [],
    path: [...pathSegments, segment],
    propertyName,
  };
};

const findOrCreateChild = (
  parent: SegmentNode,
  segment: string
): SegmentNode => {
  const existing = parent.children.find(child => child.segment === segment);

  if (existing) {
    return existing;
  }

  const child = createSegmentNode(segment, parent.path);
  parent.children.push(child);
  return child;
};

const renderOperation = (
  operation: OperationInfo,
  contextName: string,
  depth: number
): string[] => {
  const lines: string[] = [];
  const indent = INDENT.repeat(depth);
  const docLines: string[] = [];

  if (operation.summary) {
    for (const line of operation.summary.split(/\r?\n/)) {
      docLines.push((indent + ' * ' + escapeJsDoc(line)).trimEnd());
    }
  }

  if (operation.deprecated) {
    docLines.push(indent + ' * @deprecated');
  }

  if (docLines.length > 0) {
    lines.push(indent + '/**');
    lines.push(...docLines);
    lines.push(indent + ' */');
  }

  const propertyKey = formatPropertyKey(operation.key);
  const url = escapeSingleQuotes(operation.path);
  const errorType =
    operation.errorTypeName && operation.errorTypeName.length > 0
      ? operation.errorTypeName
      : 'never';
  const paramsType = `OperationParams<${operation.dataTypeName}>`;
  const configType = `OperationConfig<${operation.dataTypeName}, ${operation.responseType}>`;
  const resultType = `OperationResult<${operation.responseType}, ${errorType}>`;

  const funcSignature =
    indent +
    propertyKey +
    `: async (params?: ${paramsType}, config?: ${configType}): ${resultType} => {`;
  lines.push(funcSignature);
  lines.push(
    indent + INDENT + `const requestParams = (params ?? {}) as ${paramsType};`
  );
  lines.push(
    indent +
      INDENT +
      `const { client: clientOverride, ...requestConfig } = (config ?? {}) as ${configType};`
  );
  lines.push(
    indent + INDENT + 'const requestClient = clientOverride ?? client;'
  );
  lines.push(indent + INDENT + `const requestOptions = {`);
  lines.push(indent + INDENT + INDENT + '...requestConfig,');
  lines.push(indent + INDENT + INDENT + '...requestParams,');
  lines.push(
    indent +
      INDENT +
      `} satisfies Omit<OperationBaseOptions<${operation.dataTypeName}, ${operation.responseType}>, 'path'>;`
  );
  lines.push(
    indent + INDENT + 'if (requestOptions.requestValidator == null) {'
  );
  lines.push(
    indent +
      INDENT +
      INDENT +
      'requestOptions.requestValidator = async data => {'
  );
  lines.push(
    indent +
      INDENT +
      INDENT +
      INDENT +
      `return await ${operation.dataSchemaName}.parseAsync(data);`
  );
  lines.push(indent + INDENT + INDENT + '};');
  lines.push(indent + INDENT + '}');
  if (operation.hasResponseSchema && operation.responseSchemaName) {
    lines.push(
      indent + INDENT + 'if (requestOptions.responseValidator == null) {'
    );
    lines.push(
      indent +
        INDENT +
        INDENT +
        'requestOptions.responseValidator = async data => {'
    );
    lines.push(
      indent +
        INDENT +
        INDENT +
        INDENT +
        `return await ${operation.responseSchemaName}.parseAsync(data);`
    );
    lines.push(indent + INDENT + INDENT + '};');
    lines.push(indent + INDENT + '}');
  }
  const shouldIncludePath = contextName !== 'rootPathContext';
  if (shouldIncludePath) {
    lines.push(
      indent +
        INDENT +
        'const path = { ...' +
        contextName +
        ' } satisfies PathContext;'
    );
  }
  lines.push(
    indent +
      INDENT +
      `return requestClient.request<${operation.responseType}, ${errorType}, true>({`
  );
  lines.push(indent + INDENT + INDENT + '...requestOptions,');
  lines.push(indent + INDENT + INDENT + "method: '" + operation.method + "',");
  lines.push(indent + INDENT + INDENT + "url: '" + url + "',");
  if (shouldIncludePath) {
    lines.push(indent + INDENT + INDENT + 'path,');
  }
  lines.push(indent + INDENT + '});');
  lines.push(indent + '},');

  return lines;
};

const renderNode = (
  node: SegmentNode,
  contextName: string,
  depth: number
): string[] => {
  const lines: string[] = [];
  const indent = INDENT.repeat(depth);

  for (const child of node.children) {
    if (child.type === 'param') {
      const propertyName =
        child.propertyName ??
        PATH_PARAM_NAME_FALLBACK_PREFIX + child.path.length;
      const formattedKey = formatPropertyKey(propertyName);
      const paramIdentifier = child.paramIdentifier ?? propertyName;
      const nextContextName = contextName + '_' + paramIdentifier;
      const paramKey = escapeSingleQuotes(child.paramKey ?? paramIdentifier);

      lines.push(
        indent +
          formattedKey +
          ': (' +
          paramIdentifier +
          ': PathParamValue) => {'
      );
      lines.push(
        indent +
          INDENT +
          'const ' +
          nextContextName +
          ': PathContext = { ...' +
          contextName +
          ", '" +
          paramKey +
          "': " +
          paramIdentifier +
          ' };'
      );
      lines.push(indent + INDENT + 'return {');
      lines.push(...renderNode(child, nextContextName, depth + 2));
      lines.push(indent + INDENT + '};');
      lines.push(indent + '},');
    } else {
      const propertyKeySource = child.propertyName ?? child.segment;
      const formattedKey = formatPropertyKey(propertyKeySource);
      lines.push(indent + formattedKey + ': {');
      lines.push(...renderNode(child, contextName, depth + 1));
      lines.push(indent + '},');
    }
  }

  for (const operation of node.operations) {
    lines.push(...renderOperation(operation, contextName, depth));
  }

  return lines;
};

const collectTypeImports = (
  node: SegmentNode,
  accumulator: Set<string>
): void => {
  for (const operation of node.operations) {
    accumulator.add(operation.dataTypeName);
    accumulator.add(operation.responseTypeImport);
    if (operation.hasErrorType && operation.errorTypeName !== 'never') {
      accumulator.add(operation.errorTypeName);
    }
  }

  for (const child of node.children) {
    collectTypeImports(child, accumulator);
  }
};

const collectZodImports = (
  node: SegmentNode,
  accumulator: Set<string>
): void => {
  for (const operation of node.operations) {
    accumulator.add(operation.dataSchemaName);
    if (operation.hasResponseSchema && operation.responseSchemaName) {
      accumulator.add(operation.responseSchemaName);
    }
  }

  for (const child of node.children) {
    collectZodImports(child, accumulator);
  }
};

const buildFileContent = (root: SegmentNode): string => {
  const typeImports = new Set<string>();
  collectTypeImports(root, typeImports);
  const orderedTypeImports = [...typeImports].sort((a, b) =>
    a.localeCompare(b)
  );
  const zodImports = new Set<string>();
  collectZodImports(root, zodImports);
  const orderedZodImports = [...zodImports].sort((a, b) => a.localeCompare(b));

  const lines: string[] = [
    '// This file is auto-generated by the nested-sdk plugin for @hey-api/openapi-ts.',
    '// Do not edit this file manually.',
    '',
    "import { client } from './client.gen';",
  ];

  lines.push("import type { Client, Options, RequestResult } from './client';");
  if (orderedTypeImports.length > 0) {
    lines.push(
      `import type { ${orderedTypeImports.join(', ')} } from './types.gen';`
    );
  }
  if (orderedZodImports.length > 0) {
    lines.push(`import { ${orderedZodImports.join(', ')} } from './zod.gen';`);
  }
  lines.push('');
  lines.push('type PathContext = Record<string, unknown>;');
  lines.push('type PathParamValue = string | number | boolean;');
  lines.push(
    'type OperationBaseOptions<TData extends { url: string }, TResponse> = Options<TData, true, TResponse>;'
  );
  lines.push('type Simplify<T> = { [Key in keyof T]: T[Key] };');
  lines.push(
    'type PickNonNever<T, Key extends PropertyKey> = Key extends keyof T ? ([T[Key]] extends [never] ? {} : Pick<T, Key>) : {};'
  );
  lines.push(
    "type OperationParams<TData extends { url: string }> = Simplify<PickNonNever<TData, 'body'> & PickNonNever<TData, 'query'> & PickNonNever<TData, 'headers'> & PickNonNever<TData, 'formData'>>;"
  );
  lines.push(
    "type OperationConfig<TData extends { url: string }, TResponse> = Simplify<Omit<OperationBaseOptions<TData, TResponse>, keyof OperationParams<TData> | 'path'> & { client?: Client }>;"
  );
  lines.push(
    'type OperationResult<TResponse, TError> = RequestResult<TResponse, TError, true>;'
  );
  lines.push('');
  lines.push('const rootPathContext: PathContext = {};');
  lines.push('');
  lines.push('export const nestedClient = {');

  const bodyLines = renderNode(root, 'rootPathContext', 1);
  if (bodyLines.length > 0) {
    lines.push(...bodyLines);
  }

  lines.push('} as const;');
  lines.push('');
  lines.push('export type NestedClient = typeof nestedClient;');
  lines.push('');

  return lines.join('\n') + '\n';
};

const multiline = (...lines: string[]): string => lines.join('\n');

const replaceIfMissing = (
  input: string,
  original: string,
  replacement: string
): string => {
  if (input.includes(replacement)) {
    return input;
  }

  if (!input.includes(original)) {
    return input;
  }

  return input.replace(original, replacement);
};

const patchFileIfExists = async (
  filePath: string,
  transform: (content: string) => string
): Promise<void> => {
  try {
    const original = await fs.readFile(filePath, 'utf8');
    const updated = transform(original);
    if (updated !== original) {
      await fs.writeFile(filePath, updated, 'utf8');
    }
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return;
    }
    throw error;
  }
};

const patchClientUtils = (content: string): string => {
  let updated = content;

  updated = replaceIfMissing(
    updated,
    multiline(
      '            allowReserved,',
      '            explode: true,',
      '            name,',
      "            style: 'form',"
    ),
    multiline(
      '            ...(allowReserved !== undefined ? { allowReserved } : {}),',
      '            explode: true,',
      '            name,',
      "            style: 'form',"
    )
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '            allowReserved,',
      '            explode: true,',
      '            name,',
      "            style: 'deepObject',"
    ),
    multiline(
      '            ...(allowReserved !== undefined ? { allowReserved } : {}),',
      '            explode: true,',
      '            name,',
      "            style: 'deepObject',"
    )
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '            allowReserved,',
      '            name,',
      '            value: value as Record<string, unknown>,'
    ),
    multiline(
      '            ...(allowReserved !== undefined ? { allowReserved } : {}),',
      '            name,',
      '            value: value as Record<string, unknown>,'
    )
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '            allowReserved,',
      '            name,',
      '            value: value as string,'
    ),
    multiline(
      '            ...(allowReserved !== undefined ? { allowReserved } : {}),',
      '            name,',
      '            value: value as string,'
    )
  );

  if (
    !updated.includes(
      'const query = !options.paramsSerializer ? options.query : undefined;'
    )
  ) {
    const originalBlock = multiline(
      '  return getUrl({',
      '    baseUrl: baseUrl as string,',
      '    path: options.path,',
      '    // let `paramsSerializer()` handle query params if it exists',
      '    query: !options.paramsSerializer ? options.query : undefined,',
      '    querySerializer:',
      "      typeof options.querySerializer === 'function'",
      '        ? options.querySerializer',
      '        : createQuerySerializer(options.querySerializer),',
      '    url: options.url,',
      '  });'
    );

    if (updated.includes(originalBlock)) {
      const replacementBlock = multiline(
        '  const query = !options.paramsSerializer ? options.query : undefined;',
        '',
        '  return getUrl({',
        '    baseUrl: baseUrl as string,',
        '    ...(options.path ? { path: options.path } : {}),',
        '    // let `paramsSerializer()` handle query params if it exists',
        '    ...(query !== undefined ? { query } : {}),',
        '    querySerializer:',
        "      typeof options.querySerializer === 'function'",
        '        ? options.querySerializer',
        '        : createQuerySerializer(options.querySerializer),',
        '    url: options.url,',
        '  });'
      );

      updated = updated.replace(originalBlock, replacementBlock);
    }
  }

  return updated;
};

const patchPathSerializer = (content: string): string => {
  let updated = replaceIfMissing(
    content,
    multiline(
      '      return serializePrimitiveParam({',
      '        allowReserved,',
      '        name,',
      '        value: v as string,',
      '      });'
    ),
    multiline(
      '      return serializePrimitiveParam({',
      '        ...(allowReserved !== undefined ? { allowReserved } : {}),',
      '        name,',
      '        value: v as string,',
      '      });'
    )
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '      serializePrimitiveParam({',
      '        allowReserved,',
      "        name: style === 'deepObject' ? `${name}[${key}]` : key,",
      '        value: v as string,',
      '      }),'
    ),
    multiline(
      '      serializePrimitiveParam({',
      '        ...(allowReserved !== undefined ? { allowReserved } : {}),',
      "        name: style === 'deepObject' ? `${name}[${key}]` : key,",
      '        value: v as string,',
      '      }),'
    )
  );

  return updated;
};

const patchCoreParams = (content: string): string =>
  replaceIfMissing(
    content,
    multiline(
      '        map.set(config.key, {',
      '          in: config.in,',
      '          map: config.map,',
      '        });'
    ),
    multiline(
      '        map.set(config.key, {',
      '          in: config.in,',
      '          ...(config.map ? { map: config.map } : {}),',
      '        });'
    )
  );

const patchServerSentEvents = (content: string): string => {
  let updated = replaceIfMissing(
    content,
    multiline(
      '        const requestInit: RequestInit = {',
      "          redirect: 'follow',",
      '          ...options,',
      '          headers,',
      '          signal,',
      '        };'
    ),
    multiline(
      '        const requestInit: RequestInit = {',
      "          redirect: 'follow',",
      '          ...options,',
      '          headers,',
      '          signal,',
      '        };',
      '        if (options.serializedBody !== undefined) {',
      '          requestInit.body = options.serializedBody;',
      '        }'
    )
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '              onSseEvent?.({',
      '                data,',
      '                event: eventName,',
      '                id: lastEventId,',
      '                retry: retryDelay,',
      '              });'
    ),
    multiline(
      '              onSseEvent?.({',
      '                data,',
      '                ...(eventName !== undefined ? { event: eventName } : {}),',
      '                ...(lastEventId !== undefined ? { id: lastEventId } : {}),',
      '                retry: retryDelay,',
      '              });'
    )
  );

  return updated;
};

const patchClientTypes = (content: string): string => {
  let updated = replaceIfMissing(
    content,
    multiline(
      '  ? Promise<',
      '      AxiosResponse<',
      '        TData extends Record<string, unknown> ? TData[keyof TData] : TData',
      '      >',
      '    >'
    ),
    multiline('  ? Promise<', '      AxiosResponse<TData>', '    >')
  );

  updated = replaceIfMissing(
    updated,
    multiline(
      '      | (AxiosResponse<',
      '          TData extends Record<string, unknown> ? TData[keyof TData] : TData',
      '        > & { error: undefined })'
    ),
    multiline('      | (AxiosResponse<TData> & { error: undefined })')
  );

  return updated;
};

const applyPostGenerationPatches = async (outputDir: string): Promise<void> => {
  const targets: Array<[string, (content: string) => string]> = [
    [path.resolve(outputDir, 'client', 'types.gen.ts'), patchClientTypes],
    [path.resolve(outputDir, 'client', 'utils.gen.ts'), patchClientUtils],
    [
      path.resolve(outputDir, 'core', 'pathSerializer.gen.ts'),
      patchPathSerializer,
    ],
    [path.resolve(outputDir, 'core', 'params.gen.ts'), patchCoreParams],
    [
      path.resolve(outputDir, 'core', 'serverSentEvents.gen.ts'),
      patchServerSentEvents,
    ],
  ];

  for (const [file, transform] of targets) {
    await patchFileIfExists(file, transform);
  }
};

export const handler: NestedSdkPlugin['Handler'] = async ({ plugin }) => {
  const { includeToClient = false, excludePath = [] } = plugin.config;

  const root: SegmentNode = {
    segment: '',
    type: 'root',
    children: [],
    operations: [],
    path: [],
  };

  const shouldExclude = (operationPath: string): boolean => {
    return excludePath.some(pattern => {
      if (!pattern) {
        return false;
      }

      const normalized = pattern.trim();
      if (!normalized.length) {
        return false;
      }

      if (normalized.endsWith('*')) {
        const prefix = normalized.slice(0, -1);
        return operationPath.startsWith(prefix);
      }

      return operationPath === normalized;
    });
  };

  plugin.forEach('operation', ({ operation }) => {
    if (shouldExclude(operation.path)) {
      return;
    }

    const segments = String(operation.path).split('/').filter(Boolean);

    let current = root;

    for (const segment of segments) {
      current = findOrCreateChild(current, segment);
    }

    const paramSegments = segments
      .filter(segment => isParamSegment(segment))
      .map(segment => segment.slice(1, -1));

    const staticSegments = segments.filter(segment => !isParamSegment(segment));

    const resourceSegment =
      staticSegments[staticSegments.length - 1] ??
      paramSegments[paramSegments.length - 1] ??
      operation.path;

    const resourceName = toPascalCase(resourceSegment, 'resource');

    const paramSuffix =
      paramSegments.length === 0
        ? ''
        : 'By' +
          paramSegments
            .map(segment => toPascalCase(segment, 'param'))
            .join('And');

    const methodNameMap: Record<string, string> = {
      delete: 'delete',
      get: 'get',
      head: 'head',
      options: 'options',
      patch: 'update',
      post: 'create',
      put: 'replace',
      trace: 'trace',
    };

    const methodPrefix =
      methodNameMap[operation.method.toLowerCase()] ??
      operation.method.toLowerCase();

    const rawName = `${methodPrefix}${resourceName}${paramSuffix}`;

    const normalizedRawName = rawName.replace(/[^A-Za-z0-9_$]/g, '').trim();

    const methodKey = operation.method.toLowerCase();

    let key = methodKey;

    const existingKeys = new Set(current.operations.map(entry => entry.key));
    if (existingKeys.has(key)) {
      let attempt = 1;
      const baseKey = methodKey || 'method';
      while (existingKeys.has(key)) {
        key = sanitizeIdentifier(
          `${baseKey}${attempt}`,
          `${baseKey}${attempt}`
        );
        attempt += 1;
      }
    }

    const operationIdSource =
      operation.id && operation.id.trim().length > 0
        ? operation.id
        : normalizedRawName || rawName || `${operation.method}${resourceName}`;
    const typeNameBase = toPascalCase(
      operationIdSource,
      rawName || 'operation'
    );
    const dataTypeName = `${typeNameBase}Data`;
    const responseTypeImport = `${typeNameBase}Responses`;
    const responseType = `${responseTypeImport}[keyof ${responseTypeImport}]`;
    const errorTypeNameCandidate = `${typeNameBase}Error`;
    const responseStatuses = Object.keys(operation.responses ?? {});
    const hasErrorType = responseStatuses.some(status => {
      if (!status) {
        return false;
      }

      const trimmed = status.trim();
      if (!trimmed.length) {
        return false;
      }

      if (trimmed.toLowerCase() === 'default') {
        return true;
      }

      const firstChar = trimmed.charAt(0);
      return firstChar !== '2';
    });
    const hasResponseSchema = hasJsonResponseSchema(operation);
    const operationInfo: OperationInfo = {
      key,
      method: operation.method.toUpperCase(),
      path: operation.path,
      summary: operation.summary as string,
      deprecated: operation.deprecated as boolean,
      typeNameBase,
      dataTypeName,
      responseType,
      responseTypeImport,
      errorTypeName: hasErrorType ? errorTypeNameCandidate : 'never',
      hasErrorType,
      dataSchemaName: `z${typeNameBase}Data`,
      hasResponseSchema,
    };

    if (hasResponseSchema) {
      operationInfo.responseSchemaName = `z${typeNameBase}Response`;
    }

    current.operations.push(operationInfo);
  });

  const content = buildFileContent(root);

  const outputConfig = plugin.context.config.output;
  const outputDir =
    typeof outputConfig === 'string'
      ? path.isAbsolute(outputConfig)
        ? outputConfig
        : path.resolve(process.cwd(), outputConfig)
      : outputConfig?.path && path.isAbsolute(outputConfig.path)
        ? outputConfig.path
        : plugin.gen.root;

  const outputFileName = plugin.output.endsWith('.ts')
    ? plugin.output
    : `${plugin.output}.gen.ts`;

  const absolutePath = path.resolve(outputDir, outputFileName);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');

  const augmentedClientPath = path.resolve(
    outputDir,
    'client.with-nested.gen.ts'
  );
  const indexPath = path.resolve(outputDir, 'index.ts');
  const nestedModuleName = path.basename(outputFileName).replace(/\.ts$/, '');
  const nestedImportPath = `./${nestedModuleName}`;

  if (includeToClient) {
    const clientAugmentation = [
      "import { client as baseClient } from './client.gen';",
      "import type { Client } from './client';",
      `import type { NestedClient } from '${nestedImportPath}';`,
      `import { nestedClient } from '${nestedImportPath}';`,
      '',
      'const client = Object.assign(baseClient, nestedClient);',
      '',
      'export { client };',
      'export type ClientWithNested = typeof client;',
      '',
      'export { nestedClient };',
    ];

    await fs.writeFile(
      augmentedClientPath,
      ensureTrailingNewLine(clientAugmentation.join('\n')),
      'utf8'
    );

    const indexLines = [
      "export { client } from './client.with-nested.gen';",
      "export * from './client';",
      `export { nestedClient } from '${nestedImportPath}';`,
      `export type { NestedClient } from '${nestedImportPath}';`,
    ];

    await fs.writeFile(indexPath, ensureTrailingNewLine(indexLines.join('\n')));
  } else {
    try {
      await fs.rm(augmentedClientPath, { force: true });
    } catch (error) {
      // Augmented client file may be missing; ignore removal errors.
    }

    const indexLines = [
      "export { client } from './client.gen';",
      "export * from './client';",
      `export { nestedClient } from '${nestedImportPath}';`,
      `export type { NestedClient } from '${nestedImportPath}';`,
    ];

    await fs.writeFile(indexPath, ensureTrailingNewLine(indexLines.join('\n')));
  }

  await applyPostGenerationPatches(outputDir);
};
