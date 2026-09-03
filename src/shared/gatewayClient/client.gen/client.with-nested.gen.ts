import { client as baseClient } from './client.gen';
import type { Client } from './client';
import type { NestedClient } from './client.nested.gen';
import { nestedClient } from './client.nested.gen';

const client = Object.assign(baseClient, nestedClient);

export { client };
export type ClientWithNested = typeof client;

export { nestedClient };
