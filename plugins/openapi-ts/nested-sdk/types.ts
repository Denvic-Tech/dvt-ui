import type { DefinePlugin } from '@hey-api/openapi-ts';

export type UserConfig = {
  /**
   * Plugin name. Must be unique across configuration.
   */
  name: 'nested-sdk';
  /**
   * Name of the generated file (without extension).
   *
   * @default 'client.nested'
   */
  output?: string;
  /**
   * If true, generated methods are merged into the default `client`
   * instance from @hey-api/client-axios.
   */
  includeToClient?: boolean;
  /**
   * List of path patterns to exclude from nested client generation.
   * Supports exact match or prefix match when ending with `*`.
   */
  excludePath?: ReadonlyArray<string>;
};

export type NestedSdkPlugin = DefinePlugin<UserConfig>;
