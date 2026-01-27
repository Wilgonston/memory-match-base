/**
 * Unit Tests for NetworkSwitcher Component
 * 
 * Tests network switching functionality, UI display, and preference persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkSwitcher } from './NetworkSwitcher';
import { base, baseSepolia } from 'wagmi/chains';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useSwitchChain: vi.fn(),
  useChainId: vi.fn(),
}));

// Import mocked hooks
import { useAccount, useSwitchChain, useChainId } from 'wagmi';

describe('NetworkSwitcher', () => {
  const mockSwitchChain = vi.fn();

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock implementations
    (useAccount as any).mockReturnValue({ isConnected: true });
    (useSwitchChain as any).mockReturnValue({
      switchChain: mockSwitchChain,
      isPending: false
    });
    (useChainId as any).mockReturnValue(baseSepolia.id);
  });

  describe('Display and Visibility', () => {
    it('should not render when wallet is not connected', () => {
      (useAccount as any).mockReturnValue({ isConnected: false });
      
      const { container } = render(<NetworkSwitcher />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when wallet is connected', () => {
      render(<NetworkSwitcher />);
      
      expect(screen.getByLabelText('Switch network')).toBeInTheDocument();
    });

    it('should display current network name', () => {
      render(<NetworkSwitcher />);
      
      expect(screen.getByText('Sepolia')).toBeInTheDocument();
    });

    it('should display Base Mainnet when on mainnet', () => {
      (useChainId as any).mockReturnValue(base.id);
      
      render(<NetworkSwitcher />);
      
      expect(screen.getByText('Base')).toBeInTheDocument();
    });
  });

  describe('Network Switching', () => {
    it('should open dropdown when button is clicked', () => {
      render(<NetworkSwitcher />);
      
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      expect(screen.getByText('Base Mainnet')).toBeInTheDocument();
      expect(screen.getByText('Base Sepolia')).toBeInTheDocument();
    });

    it('should call switchChain when different network is selected', async () => {
      render(<NetworkSwitcher />);
      
      // Open dropdown
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      // Click on Base Mainnet
      const mainnetOption = screen.getByText('Base Mainnet');
      fireEvent.click(mainnetOption);
      
      await waitFor(() => {
        expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: base.id });
      });
    });

    it('should not call switchChain when current network is selected', async () => {
      render(<NetworkSwitcher />);
      
      // Open dropdown
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      // Click on current network (Sepolia)
      const sepoliaOption = screen.getByText('Base Sepolia');
      fireEvent.click(sepoliaOption);
      
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it('should close dropdown after network selection', async () => {
      render(<NetworkSwitcher />);
      
      // Open dropdown
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      expect(screen.getByText('Base Mainnet')).toBeInTheDocument();
      
      // Select network
      const mainnetOption = screen.getByText('Base Mainnet');
      fireEvent.click(mainnetOption);
      
      await waitFor(() => {
        expect(screen.queryByText('Base Mainnet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Preference Persistence', () => {
    it('should persist mainnet preference to localStorage', async () => {
      render(<NetworkSwitcher />);
      
      // Open dropdown and select mainnet
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      const mainnetOption = screen.getByText('Base Mainnet');
      fireEvent.click(mainnetOption);
      
      await waitFor(() => {
        expect(localStorage.getItem('preferredNetwork')).toBe('mainnet');
      });
    });

    it('should persist sepolia preference to localStorage', async () => {
      (useChainId as any).mockReturnValue(base.id);
      
      render(<NetworkSwitcher />);
      
      // Open dropdown and select sepolia
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      const sepoliaOption = screen.getByText('Base Sepolia');
      fireEvent.click(sepoliaOption);
      
      await waitFor(() => {
        expect(localStorage.getItem('preferredNetwork')).toBe('sepolia');
      });
    });

    it('should default to sepolia when no preference is stored', () => {
      render(<NetworkSwitcher />);
      
      const preference = localStorage.getItem('preferredNetwork');
      expect(preference).toBeNull(); // No preference stored yet
    });
  });

  describe('Wrong Network Prompt', () => {
    it('should show wrong network prompt when on different network than preferred', async () => {
      // Set preferred network to mainnet
      localStorage.setItem('preferredNetwork', 'mainnet');
      
      // But user is on sepolia
      (useChainId as any).mockReturnValue(baseSepolia.id);
      
      render(<NetworkSwitcher />);
      
      await waitFor(() => {
        expect(screen.getByText(/You're on the wrong network/i)).toBeInTheDocument();
        expect(screen.getByText(/Please switch to Base Mainnet/i)).toBeInTheDocument();
      });
    });

    it('should not show wrong network prompt when on correct network', () => {
      // Set preferred network to sepolia
      localStorage.setItem('preferredNetwork', 'sepolia');
      
      // User is on sepolia
      (useChainId as any).mockReturnValue(baseSepolia.id);
      
      render(<NetworkSwitcher />);
      
      expect(screen.queryByText(/You're on the wrong network/i)).not.toBeInTheDocument();
    });

    it('should switch network when prompt button is clicked', async () => {
      // Set preferred network to mainnet
      localStorage.setItem('preferredNetwork', 'mainnet');
      
      // But user is on sepolia
      (useChainId as any).mockReturnValue(baseSepolia.id);
      
      render(<NetworkSwitcher />);
      
      await waitFor(() => {
        const switchButton = screen.getByRole('button', { name: /Switch to Base Mainnet/i });
        fireEvent.click(switchButton);
      });
      
      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: base.id });
    });
  });

  describe('Loading States', () => {
    it('should disable button when switching is pending', () => {
      (useSwitchChain as any).mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: true
      });
      
      render(<NetworkSwitcher />);
      
      const button = screen.getByLabelText('Switch network');
      expect(button).toBeDisabled();
    });

    it('should show switching overlay when pending', () => {
      (useSwitchChain as any).mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: true
      });
      
      render(<NetworkSwitcher />);
      
      expect(screen.getByText('Switching network...')).toBeInTheDocument();
    });

    it('should disable network options when switching is pending', () => {
      (useSwitchChain as any).mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: true
      });
      
      render(<NetworkSwitcher />);
      
      // Open dropdown
      const button = screen.getByLabelText('Switch network');
      fireEvent.click(button);
      
      const options = screen.getAllByRole('button');
      options.forEach(option => {
        if (option.getAttribute('aria-label') !== 'Switch network') {
          expect(option).toBeDisabled();
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NetworkSwitcher />);
      
      const button = screen.getByLabelText('Switch network');
      expect(button).toHaveAttribute('aria-label', 'Switch network');
    });

    it('should update aria-expanded when dropdown opens/closes', () => {
      render(<NetworkSwitcher />);
      
      const button = screen.getByLabelText('Switch network');
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Open dropdown
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close dropdown
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
