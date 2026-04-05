import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBackground } from '../HeroBackground';

// Mock IntersectionObserver
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
});

describe('HeroBackground', () => {
  it('renders without crashing', () => {
    const { container } = render(<HeroBackground />);
    expect(container.querySelector('[data-testid="hero-background"]')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <HeroBackground>
        <span data-testid="child">Hello</span>
      </HeroBackground>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders a video element with correct sources', () => {
    const { container } = render(<HeroBackground />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();

    const source = container.querySelector('source[type="video/mp4"]');
    expect(source).toHaveAttribute('src', '/videos/bg-sand.mp4');
  });

  it('accepts custom videoSrc', () => {
    const { container } = render(<HeroBackground videoSrc="/videos/custom.mp4" />);
    const source = container.querySelector('source[type="video/mp4"]');
    expect(source).toHaveAttribute('src', '/videos/custom.mp4');
  });

  it('renders webm source when provided', () => {
    const { container } = render(<HeroBackground videoWebmSrc="/videos/bg.webm" />);
    const webmSource = container.querySelector('source[type="video/webm"]');
    expect(webmSource).toHaveAttribute('src', '/videos/bg.webm');
  });

  it('applies custom className to content wrapper', () => {
    const { container } = render(<HeroBackground className="custom-class" />);
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
