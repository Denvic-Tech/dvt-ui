import type { ConnectionIssueResponse } from '@/shared/gatewayClient';

import type { DBConnectionFieldDescriptor, DBConnectionRecord } from './types';

export const INVALID_CONNECTION_FALLBACK_MESSAGE =
  'Connection metadata is invalid.';

const SECTION_ALIASES: Record<string, DBConnectionFieldDescriptor['section']> =
  {
    properties: 'properties',
    raw_properties: 'properties',
    driver_options: 'driver_options',
    raw_driver_options: 'driver_options',
    driverOptions: 'driver_options',
    secrets: 'secrets',
    raw_secrets: 'secrets',
  };

const toFieldKey = (field: DBConnectionFieldDescriptor) =>
  `${field.section}.${field.name}`;

const toPathSegments = (field: string): string[] =>
  field
    .trim()
    .replace(/^\$\.?/, '')
    .replace(/\[(?:"([^"]+)"|'([^']+)'|([^\]]+))\]/g, '.$1$2$3')
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean);

const resolveIssueTarget = (
  issue: ConnectionIssueResponse
):
  | {
      section: DBConnectionFieldDescriptor['section'];
      name: string;
    }
  | { name: string }
  | null => {
  const segments = toPathSegments(issue.field);

  if (segments.length === 0) {
    return null;
  }

  const [firstSegment, ...restSegments] = segments;
  const section = SECTION_ALIASES[firstSegment];

  if (section && restSegments.length > 0) {
    return {
      section,
      name: restSegments[restSegments.length - 1],
    };
  }

  return {
    name: segments[segments.length - 1],
  };
};

const findDescriptorForIssue = (
  issue: ConnectionIssueResponse,
  descriptors: DBConnectionFieldDescriptor[]
): DBConnectionFieldDescriptor | null => {
  const target = resolveIssueTarget(issue);

  if (!target) {
    return null;
  }

  if ('section' in target) {
    return (
      descriptors.find(
        descriptor =>
          descriptor.section === target.section &&
          descriptor.name === target.name
      ) ?? null
    );
  }

  const matches = descriptors.filter(
    descriptor => descriptor.name === target.name
  );

  return matches.length === 1 ? matches[0] : null;
};

const toReadableIssueField = (field: string) =>
  toPathSegments(field)
    .join(' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase());

const getIssueMessage = (issue: ConnectionIssueResponse) =>
  issue.message.trim() ||
  issue.code.trim() ||
  INVALID_CONNECTION_FALLBACK_MESSAGE;

export const isBrokenConnection = (
  connection: Pick<DBConnectionRecord, 'state'> | null | undefined
) => connection?.state === 'invalid';

export const buildConnectionIssueFieldMap = (
  issues: ConnectionIssueResponse[] | null | undefined,
  descriptors: DBConnectionFieldDescriptor[]
): Record<string, ConnectionIssueResponse> => {
  const issueMap: Record<string, ConnectionIssueResponse> = {};

  issues?.forEach(issue => {
    const descriptor = findDescriptorForIssue(issue, descriptors);

    if (!descriptor) {
      return;
    }

    issueMap[toFieldKey(descriptor)] ??= issue;
  });

  return issueMap;
};

export const formatConnectionIssue = (
  issue: ConnectionIssueResponse,
  descriptors: DBConnectionFieldDescriptor[] = []
): string => {
  const descriptor = findDescriptorForIssue(issue, descriptors);
  const message = getIssueMessage(issue);
  const fieldLabel = descriptor?.label ?? toReadableIssueField(issue.field);

  return fieldLabel ? `${fieldLabel}: ${message}` : message;
};

export const formatConnectionIssueSummary = (
  connection: Pick<DBConnectionRecord, 'issues'>
) => {
  const firstIssue = connection.issues[0];

  return firstIssue
    ? getIssueMessage(firstIssue)
    : INVALID_CONNECTION_FALLBACK_MESSAGE;
};

export const buildConnectionIssueValidationErrors = (
  issues: ConnectionIssueResponse[] | null | undefined,
  descriptors: DBConnectionFieldDescriptor[]
): Record<string, string> => {
  const issueMap = buildConnectionIssueFieldMap(issues, descriptors);

  return Object.fromEntries(
    Object.entries(issueMap).map(([key, issue]) => [
      key,
      formatConnectionIssue(issue, descriptors),
    ])
  );
};
