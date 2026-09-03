import React, { useEffect, useMemo, useState } from 'react';
import { Box, InputBase } from '@mui/material';
import { NodeResizer } from '@xyflow/react';

import { CustomNodeData } from '@/entities/project-editor/graph';

import type { NodeInputValue } from '@/shared/gatewayClient';
import { getConstValue, makeConst } from '@/shared/lib/node-input-values';

type TextStyleValues = {
  font_family: string;
  font_size: number;
  font_weight: string;
  font_style: string;
  text_color: string;
  background_color: string;
  text_align: 'left' | 'center' | 'right';
  border_width: number;
  border_color: string;
};

type TextWidgetProps = {
  id: string;
  data: CustomNodeData;
  selected: boolean;
  updateData: (inputName: string, value: NodeInputValue) => void;
};

const readTextStyleValues = (
  inputValues: Record<string, NodeInputValue>
): TextStyleValues => {
  const textColor =
    getConstValue<string>(inputValues['text_color']) ?? '#000000';

  return {
    font_family: getConstValue<string>(inputValues['font_family']) ?? 'Arial',
    font_size: Number(getConstValue(inputValues['font_size']) ?? 14),
    font_weight: getConstValue<string>(inputValues['font_weight']) ?? 'normal',
    font_style: getConstValue<string>(inputValues['font_style']) ?? 'normal',
    text_color: textColor,
    background_color:
      getConstValue<string>(inputValues['background_color']) ?? 'transparent',
    text_align:
      (getConstValue<string>(inputValues['text_align']) as
        | 'left'
        | 'center'
        | 'right'
        | undefined) ?? 'left',
    border_width: Number(getConstValue(inputValues['border_width']) ?? 0),
    border_color:
      getConstValue<string>(inputValues['border_color']) ?? textColor,
  };
};

const getTextStyles = (values: TextStyleValues) => {
  return {
    fontFamily: values.font_family,
    fontSize: `${values.font_size}pt`,
    fontWeight: values.font_weight,
    fontStyle: values.font_style,
    color: values.text_color,
    backgroundColor: values.background_color,
    lineHeight: 1.5,
    textAlign: values.text_align,
    borderWidth: `${values.border_width}px`,
    borderStyle: values.border_width > 0 ? 'solid' : 'none',
    borderColor: values.border_color,
  };
};

export const TextWidget: React.FC<TextWidgetProps> = ({
  data,
  selected,
  updateData,
}) => {
  const inputValues = data?.inputValues ?? {};

  const styleValues = useMemo(
    () => readTextStyleValues(inputValues),
    [inputValues]
  );
  const textContent = getConstValue<string>(inputValues['text_content']) ?? '';

  const [localText, setLocalText] = useState(textContent);

  useEffect(() => {
    setLocalText(textContent);
  }, [textContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  };

  const handleBlur = () => {
    if (localText !== textContent) {
      updateData('text_content', makeConst(localText));
    }
  };

  const styles = getTextStyles(styleValues);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={40}
        handleStyle={{
          width: '20px',
          height: '20px',
          backgroundColor: 'transparent',
          border: 'none',
          margin: '-10px',
          zIndex: 9999,
        }}
        lineStyle={{
          border: '12px solid transparent',
          margin: '-12px',
          backgroundColor: 'transparent',
          zIndex: 9998,
        }}
      />

      <Box
        sx={{
          height: '100%',
          width: '100%',
          backgroundColor: styles.backgroundColor,
          borderRadius: '4px',
          borderWidth: styles.borderWidth,
          borderStyle: styles.borderStyle,
          borderColor: styles.borderColor,
          boxSizing: 'border-box',
          position: 'relative',
          outline: selected ? '2px dashed #2196f3' : 'none',
          outlineOffset: '2px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <InputBase
          multiline
          fullWidth
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder='Текст...'
          sx={{
            ...styles,
            border: 'none',
            height: '100%',
            '& .MuiInputBase-input': {
              textAlign: styles.textAlign,
              height: '100% !important',
              padding: '12px',
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
            },
          }}
        />
      </Box>
    </Box>
  );
};
