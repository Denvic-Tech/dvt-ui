import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionPackagePreviewSchema } from '@/shared/gatewayClient';

import { extensionsApi } from './extensionsApi';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/gatewayClient')>();
  return {
    ...actual,
    client: {
      ...actual.client,
      post: postMock,
    },
  };
});

const packagePreview: ExtensionPackagePreviewSchema = {
  package_id: 'package-1',
  filename: 'sample.dvtx',
  name: 'sample-extension',
  display_name: 'Sample Extension',
  version: '1.0.0',
  current_version: null,
  dvt_version: '>=1.22.0',
  operation: 'install',
  compatible: true,
  offline_ready: true,
  has_wheelhouse: true,
  bundled_wheels_count: 1,
  warnings: [],
};

describe('extensionsApi.previewPackage', () => {
  afterEach(() => {
    postMock.mockReset();
  });

  it('uploads the package as multipart FormData', async () => {
    postMock.mockResolvedValue({ data: packagePreview });
    const file = new File(['package-bytes'], 'sample.dvtx', {
      type: 'application/zip',
    });

    await expect(extensionsApi.previewPackage(file)).resolves.toEqual(
      packagePreview
    );

    expect(postMock).toHaveBeenCalledTimes(1);
    const options = postMock.mock.calls[0]?.[0];
    expect(options?.url).toBe('/extensions/packages/preview');
    expect(options?.requestValidator).toBeUndefined();
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get('file')).toBe(file);
  });
});
