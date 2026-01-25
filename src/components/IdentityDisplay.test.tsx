/**
 * Unit Tests for IdentityDisplay Component
 * 
 * Tests the identity display component functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdentityDisplay } from './IdentityDisplay';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock wagmi's useAccount hook
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}));

// Mock OnchainKit's identity components
vi.mock('@coinbase/onchainkit/identity', () => ({
  Identity: ({ children, address }: any) => (
    <div data-testid="identity" data-address={address}>
      {children}
    </div>
  ),
  Avatar: ({ className }: any) => (
    <div data-testid="avatar" className={className}>Avatar</div>
  ),
  Name: ({ className }: any) => (
    <div data-testid="name" className={className}>Name</div>
  ),
  Address: ({ className }: any) => (
    <div data-testid="address" className={className}>Address</div>
  ),
}));

import { useAccount } from 'wagmi';

describe('IdentityDisplay Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should render identity components when wallet is connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    render(<IdentityDisplay />, { wrapper });

    // Should render all identity components
    expect(screen.getByTestId('identity')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByTestId('name')).toBeInTheDocument();
    expect(screen.getByTestId('address')).toBeInTheDocument();

    // Should pass the address to Identity component
    expect(screen.getByTestId('identity')).toHaveAttribute('data-address', mockAddress);
  });

  it('should not render when wallet is not connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { container } = render(<IdentityDisplay />, { wrapper });

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('should not render when address is undefined', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: true,
    } as any);

    const { container } = render(<IdentityDisplay />, { wrapper });

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    const { container } = render(<IdentityDisplay className="custom-class" />, { wrapper });

    // Should have both default and custom class
    const identityDisplay = container.querySelector('.identity-display');
    expect(identityDisplay).toHaveClass('identity-display');
    expect(identityDisplay).toHaveClass('custom-class');
  });

  it('should apply correct CSS classes to child components', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    render(<IdentityDisplay />, { wrapper });

    // Check that components have correct CSS classes
    expect(screen.getByTestId('avatar')).toHaveClass('identity-avatar');
    expect(screen.getByTestId('name')).toHaveClass('identity-name');
    expect(screen.getByTestId('address')).toHaveClass('identity-address');
  });

  it('should update when wallet address changes', () => {
    const mockAddress1 = '0x1111111111111111111111111111111111111111' as `0x${string}`;
    const mockAddress2 = '0x2222222222222222222222222222222222222222' as `0x${string}`;
    
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress1,
      isConnected: true,
    } as any);

    const { rerender } = render(<IdentityDisplay />, { wrapper });

    // Should show first address
    expect(screen.getByTestId('identity')).toHaveAttribute('data-address', mockAddress1);

    // Change wallet address
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress2,
      isConnected: true,
    } as any);

    rerender(<IdentityDisplay />);

    // Should show second address
    expect(screen.getByTestId('identity')).toHaveAttribute('data-address', mockAddress2);
  });
});
