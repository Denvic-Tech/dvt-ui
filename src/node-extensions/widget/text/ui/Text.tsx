import React from 'react';
import {
  BorderStyle,
  ColorLens,
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
  FormatPaint,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';

import type { NodeContentExtensionProps } from '@/app/providers/node-extensions';

import { useNodeData } from '@/features/node/manage-node-data';

import type { NodeInputValuesMap } from '@/shared/lib/node-input-values';
import { getConstValue, makeConst } from '@/shared/lib/node-input-values';

const getTextValue = <T,>(
  inputValues: NodeInputValuesMap,
  key: string,
  fallback: T
): T => {
  const value = getConstValue(inputValues[key]);
  return (value ?? fallback) as T;
};

export const TextFormat: React.FC<NodeContentExtensionProps> = ({
  id,
  data,
}) => {
  const { updateInputValue } = useNodeData(id);
  const inputValues = data?.inputValues ?? {};

  const handleSelectChange =
    (field: string) => (event: SelectChangeEvent<string>) => {
      const val = event.target.value;
      if (!updateInputValue) return;

      const isNumber = ['font_size', 'border_width'].includes(field);
      updateInputValue(field, makeConst(isNumber ? Number(val) : String(val)));
    };

  const handleAlignChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextAlign: string | null
  ) => {
    if (nextAlign !== null && updateInputValue) {
      updateInputValue('text_align', makeConst(nextAlign));
    }
  };

  const fontFamily = getTextValue<string>(inputValues, 'font_family', 'Arial');
  const fontSize = Number(
    getTextValue<number | string>(inputValues, 'font_size', 14)
  );
  const textAlign = getTextValue<string>(inputValues, 'text_align', 'left');
  const textColor = getTextValue<string>(inputValues, 'text_color', '#000000');
  const backgroundColor = getTextValue<string>(
    inputValues,
    'background_color',
    '#ffffff'
  );
  const borderWidth = Number(
    getTextValue<number | string>(inputValues, 'border_width', 0)
  );
  const borderColor = getTextValue<string>(
    inputValues,
    'border_color',
    '#000000'
  );

  return (
    <Box
      p='4px 8px'
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction='row' spacing={1} alignItems='center'>
        <Select
          size='small'
          value={String(fontFamily)}
          onChange={handleSelectChange('font_family')}
          sx={{ height: 28, fontSize: '12px', minWidth: 100 }}
        >
          {[
            'Arial',
            'Helvetica',
            'Times New Roman',
            'Courier',
            'Verdana',
            'Georgia',
            'monospace',
          ].map(font => (
            <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
              {font}
            </MenuItem>
          ))}
        </Select>

        <Select
          size='small'
          value={String(fontSize)}
          onChange={handleSelectChange('font_size')}
          sx={{ height: 28, fontSize: '12px', minWidth: 50 }}
        >
          {[8, 10, 12, 14, 16, 20, 24, 32, 48, 72].map(size => (
            <MenuItem key={size} value={String(size)}>
              {size}
            </MenuItem>
          ))}
        </Select>

        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

        <ToggleButtonGroup
          size='small'
          value={textAlign}
          exclusive
          onChange={handleAlignChange}
          sx={{ height: 26 }}
        >
          <ToggleButton value='left' sx={{ px: 1 }}>
            <FormatAlignLeft fontSize='small' />
          </ToggleButton>
          <ToggleButton value='center' sx={{ px: 1 }}>
            <FormatAlignCenter fontSize='small' />
          </ToggleButton>
          <ToggleButton value='right' sx={{ px: 1 }}>
            <FormatAlignRight fontSize='small' />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

        <Tooltip title='Цвет текста'>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              border: '1px solid #eee',
              borderRadius: 1,
            }}
          >
            <ColorLens fontSize='small' sx={{ color: textColor }} />
            <input
              type='color'
              value={textColor}
              onChange={e =>
                updateInputValue?.('text_color', makeConst(e.target.value))
              }
              style={{
                position: 'absolute',
                opacity: 0,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Tooltip>

        <Tooltip title='Цвет фона'>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              border: '1px solid #eee',
              borderRadius: 1,
            }}
          >
            <FormatPaint
              fontSize='small'
              sx={{
                color:
                  backgroundColor && backgroundColor !== 'transparent'
                    ? backgroundColor
                    : '#aaa',
              }}
            />
            <input
              type='color'
              value={backgroundColor}
              onChange={e =>
                updateInputValue?.(
                  'background_color',
                  makeConst(e.target.value)
                )
              }
              style={{
                position: 'absolute',
                opacity: 0,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Tooltip>

        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

        <Tooltip title='Ширина рамки'>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BorderStyle fontSize='small' sx={{ mr: 0.5, color: '#666' }} />
            <Select
              size='small'
              value={String(borderWidth)}
              onChange={handleSelectChange('border_width')}
              sx={{ height: 28, fontSize: '12px', minWidth: 50 }}
            >
              <MenuItem value='0'>No</MenuItem>
              {[1, 2, 3, 4, 5, 8, 10].map(size => (
                <MenuItem key={size} value={String(size)}>
                  {size}px
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Tooltip>

        {borderWidth > 0 && (
          <Tooltip title='Цвет рамки'>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                ml: 1,
                p: 0.5,
                border: '1px solid #eee',
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  bgcolor: borderColor,
                  borderRadius: '2px',
                  border: '1px solid #ccc',
                }}
              />
              <input
                type='color'
                value={borderColor}
                onChange={e =>
                  updateInputValue?.('border_color', makeConst(e.target.value))
                }
                style={{
                  position: 'absolute',
                  opacity: 0,
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};
