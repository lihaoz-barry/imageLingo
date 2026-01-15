import { render, screen, fireEvent } from '@testing-library/react';
import { ImageThumbnails } from '@/components/ImageThumbnails';
import { vi, describe, it, expect } from 'vitest';

describe('ImageThumbnails', () => {
  const mockImages = [
    {
      id: '1',
      file: new File([''], 'test.png', { type: 'image/png' }),
      preview: 'blob:test',
      name: 'test.png',
      size: 1024,
    },
  ];

  const mockOnRemove = vi.fn();

  it('renders images', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);
    expect(screen.getByAltText('test.png')).toBeInTheDocument();
    expect(screen.getByText('test.png')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);
    // Ideally we'd select by aria-label, but it's not there yet.
    // So we'll find the button by role (implied for button)
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('remove button has accessibility attributes', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Remove image test.png');
  });

  it('remove button is keyboard accessible', () => {
    render(<ImageThumbnails images={mockImages} onRemove={mockOnRemove} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:opacity-100');
    expect(button).toHaveClass('focus-visible:ring-2');
  });
});
