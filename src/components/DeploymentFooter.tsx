import { getDeploymentInfo } from "@/lib/deployment-info";

export function DeploymentFooter() {
  const deployInfo = getDeploymentInfo();
  
  // Don't show footer if no deployment info is available
  if (deployInfo.branchName === 'unknown' && deployInfo.deployTime === 'unknown') {
    return null;
  }
  
  const formatDeployTime = (deployTime: string) => {
    if (deployTime === 'unknown') return 'Unknown';
    try {
      // Try to parse and format the timestamp
      const date = new Date(deployTime);
      if (isNaN(date.getTime())) return deployTime; // Return as-is if not parseable
      return date.toLocaleString();
    } catch {
      return deployTime; // Return as-is if parsing fails
    }
  };

  return (
    <footer className="mt-8 py-4 border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {deployInfo.branchName !== 'unknown' && (
              <span>
                Branch: <span className="font-mono text-foreground">{deployInfo.branchName}</span>
              </span>
            )}
            {deployInfo.deployTime !== 'unknown' && (
              <span>
                Deployed: <span className="text-foreground">{formatDeployTime(deployInfo.deployTime)}</span>
              </span>
            )}
          </div>
          {deployInfo.buildTime !== 'unknown' && (
            <span className="text-xs">
              Built: {formatDeployTime(deployInfo.buildTime)}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}