// Deployment information that gets injected at build time
export interface DeploymentInfo {
  branchName: string;
  deployTime: string;
  buildTime: string;
}

// Get deployment information from environment variables injected at build time
export function getDeploymentInfo(): DeploymentInfo {
  return {
    branchName: import.meta.env.VITE_GIT_BRANCH || 'unknown',
    deployTime: import.meta.env.VITE_DEPLOY_TIME || 'unknown',
    buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
  };
}