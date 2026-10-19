import React, { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Upload } from 'lucide-react';

import { getTransferTokens } from '../../ui/transferDialogStyles';

const IMPORT_FILE_ACCEPT = '.dvtpkg';

interface ImportDropZoneProps {
  title: string;
  error: string | null;
  reading: boolean;
  onFile: (file: File) => void;
}

/** Шаг выбора файла: зона drag&drop и состояние чтения архива. */
export const ImportDropZone: React.FC<ImportDropZoneProps> = ({
  title,
  error,
  reading,
  onFile,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  // dragenter/dragleave приходят и при переходе между дочерними элементами
  // зоны, поэтому считаем вложенность, а не реагируем на каждое событие
  const dragDepthRef = useRef(0);

  const take = (file: File | undefined) => {
    if (file) {
      onFile(file);
    }
  };

  const openPicker = () => {
    if (!reading) {
      inputRef.current?.click();
    }
  };

  return (
    <Box sx={{ p: '12px' }}>
      <input
        ref={inputRef}
        type='file'
        accept={IMPORT_FILE_ACCEPT}
        style={{ display: 'none' }}
        data-testid='features/project-transfer/import-file-input'
        onChange={event => {
          take(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {reading ? (
        <Box
          data-testid='features/project-transfer/import-reading'
          sx={theme => {
            const t = getTransferTokens(theme);
            return {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              height: 190,
              borderRadius: '12px',
              background: t.surface,
              fontSize: 13,
              color: t.text2,
            };
          }}
        >
          <Box
            component='span'
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: `2px solid ${t.borderStrong}`,
                borderTopColor: t.accent,
                animation: 'importReadSpin .7s linear infinite',
                '@keyframes importReadSpin': {
                  to: { transform: 'rotate(360deg)' },
                },
              };
            }}
          />
          Чтение файла…
        </Box>
      ) : (
        <Box
          role='button'
          tabIndex={0}
          aria-label='Выбрать файл .dvtpkg'
          data-testid='features/project-transfer/import-dropzone'
          onClick={openPicker}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={event => {
            event.preventDefault();
            dragDepthRef.current += 1;
            setOver(true);
          }}
          onDragOver={event => {
            event.preventDefault();
          }}
          onDragLeave={() => {
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
              setOver(false);
            }
          }}
          onDrop={event => {
            event.preventDefault();
            dragDepthRef.current = 0;
            setOver(false);
            take(event.dataTransfer.files[0]);
          }}
          sx={theme => {
            const t = getTransferTokens(theme);
            return {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: '44px 24px 40px',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              outline: 'none',
              border: `1.5px dashed ${
                over ? t.accent : error ? t.dangerBorder : t.borderStrong
              }`,
              background: over ? t.accentSoft : t.bg,
              transition: 'border-color .12s, background .12s',
              '&:focus-visible': { borderColor: t.accent },
            };
          }}
        >
          <Box
            component='span'
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                width: 44,
                height: 44,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: over ? '#fff' : t.surface,
                color: over ? t.accent : t.text2,
              };
            }}
          >
            <Upload size={20} strokeWidth={1.7} />
          </Box>
          <Box
            sx={theme => ({
              mt: '16px',
              fontSize: 16,
              fontWeight: 650,
              letterSpacing: '-.015em',
              color: getTransferTokens(theme).text,
            })}
          >
            {over ? 'Отпустите, чтобы импортировать' : title}
          </Box>
          <Box
            sx={theme => ({
              mt: '6px',
              fontSize: 13,
              color: getTransferTokens(theme).text2,
            })}
          >
            Перетащите файл .dvtpkg или{' '}
            <Box
              component='span'
              sx={theme => ({
                color: getTransferTokens(theme).accent,
                fontWeight: 500,
              })}
            >
              выберите на компьютере
            </Box>
          </Box>
        </Box>
      )}

      {error && !reading ? (
        <Box
          role='alert'
          data-testid='features/project-transfer/import-file-error'
          sx={theme => ({
            m: '8px 4px 0',
            fontSize: 12,
            color: getTransferTokens(theme).danger,
          })}
        >
          {error}
        </Box>
      ) : null}
    </Box>
  );
};
