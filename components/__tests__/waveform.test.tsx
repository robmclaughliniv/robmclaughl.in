import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Waveform } from '../waveform';

describe('Waveform', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Waveform />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders four path elements', () => {
    const { container } = render(<Waveform />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(4);
  });

  it('applies custom className', () => {
    const { container } = render(<Waveform className="test-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
  });

  it('paths use currentColor for stroke', () => {
    const { container } = render(<Waveform />);
    const paths = container.querySelectorAll('path');
    paths.forEach((path) => {
      expect(path.getAttribute('stroke')).toBe('currentColor');
    });
  });
});
