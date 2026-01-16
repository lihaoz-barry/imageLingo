import { render, screen } from '@testing-library/react';
import { ProcessButton } from '@/components/ProcessButton';
import { vi } from 'vitest';

describe('ProcessButton', () => {
  it('renders correctly', () => {
    render(<ProcessButton onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /process images/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows processing state correctly', () => {
    render(<ProcessButton onClick={() => {}} isProcessing={true} />);
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ProcessButton onClick={() => {}} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
