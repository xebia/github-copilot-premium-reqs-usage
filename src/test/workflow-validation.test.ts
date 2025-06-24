import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import path from 'path';

describe('Workflow Configuration Validation', () => {
  it('should validate tag-rajbos workflow has correct token parameter', () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/tag-rajbos.yml');
    const workflowContent = readFileSync(workflowPath, 'utf8');
    const workflow = load(workflowContent) as any;

    // Check that the workflow exists and has the correct structure
    expect(workflow).toBeDefined();
    expect(workflow.jobs).toBeDefined();
    expect(workflow.jobs['tag-rajbos']).toBeDefined();
    
    // Check that the step exists
    const steps = workflow.jobs['tag-rajbos'].steps;
    expect(steps).toBeDefined();
    expect(steps.length).toBeGreaterThan(0);
    
    // Find the tag step
    const tagStep = steps.find((step: any) => step.uses === 'devops-actions/issue-comment-tag@v0.1.8');
    expect(tagStep).toBeDefined();
    
    // Verify the token parameter is correctly named 'token' (not 'github-token')
    expect(tagStep.with).toBeDefined();
    expect(tagStep.with.token).toBeDefined();
    expect(tagStep.with.token).toBe('${{ secrets.GITHUB_TOKEN }}');
    
    // Ensure the old incorrect parameter name is not present
    expect(tagStep.with['github-token']).toBeUndefined();
    
    // Verify username is still set
    expect(tagStep.with.username).toBe('rajbos');
  });

  it('should validate workflow has proper permissions', () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/tag-rajbos.yml');
    const workflowContent = readFileSync(workflowPath, 'utf8');
    const workflow = load(workflowContent) as any;

    // Check that proper permissions are set
    const permissions = workflow.jobs['tag-rajbos'].permissions;
    expect(permissions).toBeDefined();
    expect(permissions.issues).toBe('write');
    expect(permissions['pull-requests']).toBe('write');
  });

  it('should validate workflow only runs on main repository', () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/tag-rajbos.yml');
    const workflowContent = readFileSync(workflowPath, 'utf8');
    const workflow = load(workflowContent) as any;

    // Check that the conditional is set to prevent running on forks
    const condition = workflow.jobs['tag-rajbos'].if;
    expect(condition).toBe("github.repository == 'devops-actions/github-copilot-premium-reqs-usage'");
  });
});