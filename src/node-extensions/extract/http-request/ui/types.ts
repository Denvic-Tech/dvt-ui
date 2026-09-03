import type { NodeInputValue } from '@/shared/gatewayClient';

export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  DIGEST = 'digest',
  OAUTH2 = 'oauth2',
  FILE_CERT = 'file_cert',
}

export type AuthFieldValue = NodeInputValue | string | null;

export type HttpRequestAuth =
  | { type: AuthType.NONE }
  | {
      type: AuthType.BASIC;
      username?: AuthFieldValue;
      password?: AuthFieldValue;
    }
  | {
      type: AuthType.DIGEST;
      username?: AuthFieldValue;
      password?: AuthFieldValue;
    }
  | { type: AuthType.OAUTH2; token?: AuthFieldValue }
  | {
      type: AuthType.FILE_CERT;
      cert_file_path?: AuthFieldValue;
      key_file_path?: AuthFieldValue;
      key_password?: string | null;
    };

export type HTTPRequestValues = {
  url?: string;
  method?: string;
  headers?: any;
  params?: any;
  json_payload?: any;
  data?: any;
  timeout?: number;
  verify_ssl?: boolean;

  auth?: HttpRequestAuth;
};

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
};
