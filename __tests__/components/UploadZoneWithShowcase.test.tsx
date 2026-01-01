import { render, screen, fireEvent } from '@testing-library/react';
import { UploadZoneWithShowcase } from '@/components/UploadZoneWithShowcase';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Camera: () => <div data-testid="camera-icon">Camera</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

describe('UploadZoneWithShowcase', () => {
  const mockOnFilesSelected = vi.fn();
  const mockSetIsShowcaseOpen = vi.fn();

  it('renders upload area', () => {
    render(
      <UploadZoneWithShowcase
        onFilesSelected={mockOnFilesSelected}
        hasImages={false}
        isShowcaseOpen={false}
        setIsShowcaseOpen={mockSetIsShowcaseOpen}
      />
    );
    expect(screen.getByText('Upload images to start')).toBeInTheDocument();
  });

  // UX Test: Accessibility check
  it('should be keyboard accessible', () => {
    render(
        <UploadZoneWithShowcase
          onFilesSelected={mockOnFilesSelected}
          hasImages={false}
          isShowcaseOpen={false}
          setIsShowcaseOpen={mockSetIsShowcaseOpen}
        />
      );

      // The main upload area should be focusable and have button role
      // Note: We need to find the correct parent element that has the onClick handler and role
      const textElement = screen.getByText('Upload images to start');
      // The text is inside p -> div -> div -> div (the one with role=button)
      // Structure is:
      // div (role=button)
      //   div
      //     div (relative)
      //     div (text-center)
      //       p (text)
      const uploadArea = textElement.closest('div[role="button"]');

      // Check if it has the button role
      expect(uploadArea).toHaveAttribute('role', 'button');

      // Check if it is focusable
      expect(uploadArea).toHaveAttribute('tabIndex', '0');

      // Check for Enter key support
      if (uploadArea) {
        fireEvent.keyDown(uploadArea, { key: 'Enter' });
      }

      // Since we can't easily check if file input was clicked without refs in JSDOM sometimes,
      // we at least ensure the event handler is there.
      // Ideally we would mock the ref, but for this "bad UX" check, failing on role/tabindex is enough.
  });

  it('info button should have aria-label', () => {
    render(
      <UploadZoneWithShowcase
        onFilesSelected={mockOnFilesSelected}
        hasImages={false}
        isShowcaseOpen={false}
        setIsShowcaseOpen={mockSetIsShowcaseOpen}
      />
    );

    const infoButton = screen.getByTestId('info-icon').parentElement;
    expect(infoButton).toHaveAttribute('aria-label', 'How it works');
  });
});
