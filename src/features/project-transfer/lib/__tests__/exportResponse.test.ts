import { describe, expect, it } from 'vitest';

import {
  parseContentDispositionFileName,
  parseExportWarningsHeader,
  readHeader,
} from '../exportResponse';

describe('features/project-transfer/lib/exportResponse', () => {
  describe('parseContentDispositionFileName', () => {
    it('prefers the UTF-8 filename* parameter', () => {
      const header =
        'attachment; filename="export.dvtpkg"; filename*=UTF-8\'\'%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82.dvtpkg';

      expect(parseContentDispositionFileName(header)).toBe('Проект.dvtpkg');
    });

    it('falls back to the plain filename parameter', () => {
      expect(
        parseContentDispositionFileName('attachment; filename="alpha.dvtpkg"')
      ).toBe('alpha.dvtpkg');
      expect(
        parseContentDispositionFileName('attachment; filename=beta.dvtpkg')
      ).toBe('beta.dvtpkg');
    });

    it('uses the plain filename when filename* cannot be decoded', () => {
      expect(
        parseContentDispositionFileName(
          'attachment; filename="safe.dvtpkg"; filename*=UTF-8\'\'%E0%A4%A'
        )
      ).toBe('safe.dvtpkg');
    });

    it('returns the default name for missing or malformed headers', () => {
      expect(parseContentDispositionFileName(null)).toBe('export.dvtpkg');
      expect(parseContentDispositionFileName('inline')).toBe('export.dvtpkg');
      expect(parseContentDispositionFileName('', 'custom.dvtpkg')).toBe(
        'custom.dvtpkg'
      );
    });
  });

  describe('parseExportWarningsHeader', () => {
    it('parses a JSON array of warnings', () => {
      const header = JSON.stringify([
        {
          code: 'schedule_forbidden',
          message: 'Only admins',
          project_ref: 'p1',
        },
        { code: 'connection_inaccessible', message: 'Hidden' },
      ]);

      expect(parseExportWarningsHeader(header)).toEqual([
        {
          code: 'schedule_forbidden',
          message: 'Only admins',
          project_ref: 'p1',
        },
        {
          code: 'connection_inaccessible',
          message: 'Hidden',
          project_ref: null,
        },
      ]);
    });

    it('ignores malformed entries and invalid JSON', () => {
      expect(
        parseExportWarningsHeader(
          JSON.stringify([
            { code: 'x' },
            'str',
            null,
            { code: 'ok', message: 'm' },
          ])
        )
      ).toEqual([{ code: 'ok', message: 'm', project_ref: null }]);
      expect(parseExportWarningsHeader('{not json')).toEqual([]);
      expect(parseExportWarningsHeader('{"code":"x"}')).toEqual([]);
      expect(parseExportWarningsHeader(undefined)).toEqual([]);
      expect(parseExportWarningsHeader('   ')).toEqual([]);
    });
  });

  describe('readHeader', () => {
    it('reads headers case-insensitively from plain objects', () => {
      expect(
        readHeader(
          { 'Content-Disposition': 'attachment' },
          'content-disposition'
        )
      ).toBe('attachment');
      expect(
        readHeader({ 'x-dvt-export-warnings': '[]' }, 'X-DVT-Export-Warnings')
      ).toBe('[]');
      expect(readHeader({}, 'content-disposition')).toBeNull();
      expect(readHeader(null, 'content-disposition')).toBeNull();
    });

    it('supports header bags with a get() accessor', () => {
      const bag = {
        get: (name: string) =>
          name.toLowerCase() === 'content-disposition'
            ? 'attachment'
            : undefined,
      };

      expect(readHeader(bag, 'Content-Disposition')).toBe('attachment');
      expect(readHeader(bag, 'x-other')).toBeNull();
    });
  });
});
