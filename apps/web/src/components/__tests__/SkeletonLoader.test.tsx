import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, CardSkeleton } from '../SkeletonLoader.js';

describe('SkeletonLoader', () => {
  it('renders a base skeleton element with animate-pulse class', () => {
    const { container } = render(<Skeleton data-testid="skeleton" className="custom-test" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('custom-test');
  });

  it('renders a card skeleton structure without crashing', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
