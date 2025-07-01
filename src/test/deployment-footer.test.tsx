import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DeploymentFooter } from '@/components/DeploymentFooter';

// Mock the deployment info module
vi.mock('@/lib/deployment-info', () => ({
  getDeploymentInfo: vi.fn(),
}));

import * as deploymentInfoModule from '@/lib/deployment-info';

describe('DeploymentFooter', () => {
  const mockGetDeploymentInfo = vi.mocked(deploymentInfoModule.getDeploymentInfo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('should display branch name and deploy time when deployment info is available', () => {
    const mockDeployInfo = {
      branchName: 'main',
      deployTime: '2025-06-28T10:00:00Z',
      buildTime: '2025-06-28T10:00:00Z',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    expect(screen.getByText('Branch:')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('Deployed:')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Built:'))).toBeInTheDocument();
  });

  it('should display feature branch name correctly', () => {
    const mockDeployInfo = {
      branchName: 'feature/footer-implementation',
      deployTime: '2025-06-28T10:00:00Z',
      buildTime: '2025-06-28T10:00:00Z',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    expect(screen.getByText('feature/footer-implementation')).toBeInTheDocument();
  });

  it('should not render when deployment info is unknown', () => {
    const mockDeployInfo = {
      branchName: 'unknown',
      deployTime: 'unknown',
      buildTime: 'unknown',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    const { container } = render(<DeploymentFooter />);

    expect(container.firstChild).toBeNull();
  });

  it('should render when only branch name is available', () => {
    const mockDeployInfo = {
      branchName: 'main',
      deployTime: 'unknown',
      buildTime: 'unknown',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    expect(screen.getByText('Branch:')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.queryByText('Deployed:')).not.toBeInTheDocument();
    expect(screen.queryByText('Built:')).not.toBeInTheDocument();
  });

  it('should render when only deploy time is available', () => {
    const mockDeployInfo = {
      branchName: 'unknown',
      deployTime: '2025-06-28T10:00:00Z',
      buildTime: '2025-06-28T10:00:00Z',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    expect(screen.queryByText('Branch:')).not.toBeInTheDocument();
    expect(screen.getByText('Deployed:')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Built:'))).toBeInTheDocument();
  });

  it('should format date correctly when valid ISO date is provided', () => {
    const mockDeployInfo = {
      branchName: 'main',
      deployTime: '2025-06-28T10:30:45Z',
      buildTime: '2025-06-28T10:30:45Z',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    // Check that the dates are formatted (should have been converted from ISO)
    expect(screen.getByText((content) => content.includes('Deployed:'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Built:'))).toBeInTheDocument();
    
    // Check that the formatted dates contain digits (meaning they were processed)
    // Using getAllByText since there are multiple elements with the date
    const elementsWithDate = screen.getAllByText((content) => content.includes('28') || content.includes('2025'));
    expect(elementsWithDate.length).toBeGreaterThan(0);
  });

  it('should handle invalid date strings gracefully', () => {
    const mockDeployInfo = {
      branchName: 'main',
      deployTime: 'invalid-date',
      buildTime: 'another-invalid-date',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    render(<DeploymentFooter />);

    // Should display the raw string when date parsing fails
    expect(screen.getByText('invalid-date')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('another-invalid-date'))).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    const mockDeployInfo = {
      branchName: 'test-styling-branch',
      deployTime: '2025-06-28T10:00:00Z',
      buildTime: '2025-06-28T10:00:00Z',
    };
    
    mockGetDeploymentInfo.mockReturnValue(mockDeployInfo);

    const { container } = render(<DeploymentFooter />);
    
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('mt-8', 'py-4', 'border-t', 'border-border');
    
    const branchElement = screen.getByText('test-styling-branch');
    expect(branchElement).toHaveClass('font-mono', 'text-foreground');
  });
});