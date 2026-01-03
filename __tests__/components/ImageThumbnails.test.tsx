import { render, screen } from '@testing-library/react';
import { ImageThumbnails } from '../../components/ImageThumbnails';
import { describe, it, expect, vi } from 'vitest';

describe('ImageThumbnails', () => {
  const mockImages = [
    {
      id: '1',
      file: new File([''], 'test.png', { type: 'image/png' }),
      preview: 'data:image/png;base64,',
      name: 'test.png',
      size: 1024,
    },
  ];

  const mockOnRemove = vi.fn();

  it('renders images and delete buttons', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);

    // Check if image name is displayed
    expect(screen.getByText('test.png')).toBeInTheDocument();

    // Check if delete button exists (we can look for the button element)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should have accessible name for the delete button', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);

    // Ideally, we should be able to find it by accessible name
    // If this fails, it means the button doesn't have a label
    const deleteButton = screen.getByRole('button', { name: /Remove/i });
    expect(deleteButton).toBeInTheDocument();
  });
});
