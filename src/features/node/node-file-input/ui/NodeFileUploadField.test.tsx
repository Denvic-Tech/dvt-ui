import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NodeFileUploadField } from './NodeFileUploadField';

describe('NodeFileUploadField', () => {
  it('switches between manual and upload modes', () => {
    const onModeChange = vi.fn();

    render(
      <NodeFileUploadField
        config={{
          acceptedExtensions: ['.csv'],
          displayName: 'CSV файл',
          helperText: 'helper',
        }}
        currentFileName={null}
        error={null}
        isUploading={false}
        mode='manual'
        onClear={vi.fn()}
        onFileSelected={vi.fn()}
        onModeChange={onModeChange}
      />
    );

    fireEvent.click(screen.getByText('Drag and drop'));

    expect(onModeChange).toHaveBeenCalledWith('upload');
  });

  it('forwards selected file to the callback', () => {
    const onFileSelected = vi.fn();
    const { container } = render(
      <NodeFileUploadField
        config={{
          acceptedExtensions: ['.csv'],
          displayName: 'CSV файл',
          helperText: 'helper',
        }}
        currentFileName='data.csv'
        currentFilePath='data.csv'
        error={null}
        isUploading={false}
        mode='upload'
        onClear={vi.fn()}
        onFileSelected={onFileSelected}
        onModeChange={vi.fn()}
      />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();

    const file = new File(['id,name'], 'data.csv', { type: 'text/csv' });
    fireEvent.change(input!, { target: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });
});
