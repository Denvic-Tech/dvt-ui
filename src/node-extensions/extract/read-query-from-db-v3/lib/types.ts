import type { DataFrameMetadata } from '@/shared/gatewayClient';

export interface ExtensionState {
  connectionID?: string | null;
  metadata?: DataFrameMetadata | null;
  error?: string | null;
  isMetadataLoading?: boolean;
}
