# Continuous Integration (CI) Setup

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows Overview

### 1. CI Build Workflow (`.github/workflows/ci.yml`)

**Purpose**: Validates code quality and build integrity on pull requests and feature branches.

**Triggers**:
- Pull requests to `main` branch
- Pushes to any branch except `main`
- Excludes documentation-only changes (`.md` files, `LICENSE`, `SECURITY.md`)

**Steps**:
1. **Setup**: Checkout code and setup Node.js 18 with npm cache
2. **Dependencies**: Install npm packages
3. **Linting**: Run ESLint (warnings allowed, errors fail the build)
4. **Testing**: Run all Vitest tests (currently 92 tests)
5. **Build Validation**: 
   - Standard production build (`npm run build`)
   - GitHub Pages build (`npm run build:pages`)
6. **Output Validation**: Verify build artifacts are created correctly

**Concurrency**: Only one CI run per branch/PR (cancels previous runs on new commits)

### 2. Deploy to GitHub Pages Workflow (`.github/workflows/deploy-to-pages.yml`)

**Purpose**: Builds and deploys the application to GitHub Pages.

**Triggers**:
- Pushes to `main` branch only
- Manual workflow dispatch
- Excludes documentation-only changes

**Steps**:
1. **Build**: Same as CI workflow build steps
2. **Deploy**: Deploy built assets to GitHub Pages
3. **Smoke Test**: Validate deployed application functionality

## Benefits for Pull Requests

### ✅ **Pre-merge Validation**
- Ensures code compiles without errors
- Validates all tests pass
- Checks both standard and GitHub Pages builds
- Prevents broken code from reaching main branch

### ✅ **Dependabot Support**
- Automated dependency update PRs are validated
- Prevents dependency updates that break the build
- Ensures compatibility with existing codebase

### ✅ **Fast Feedback**
- Developers get immediate feedback on PR status
- Failed builds are clearly indicated with detailed logs
- No need to wait for deployment to catch build issues

## Code Quality Standards

### Linting
- Uses ESLint v9+ with flat configuration
- TypeScript strict checking enabled
- React hooks rules enforced
- Warnings don't fail the build (allows existing code patterns)

### Testing
- All existing tests must pass (currently 92 tests)
- Tests cover CSV parsing, UI components, data processing
- Includes smoke tests for build validation

### Build Requirements
- TypeScript compilation must succeed
- Vite production build must complete
- GitHub Pages build must succeed
- Build artifacts must be created correctly

## Local Development

To run the same checks locally before pushing:

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm run test:run

# Test builds
npm run build
npm run build:pages
```

## Workflow Configuration

Both workflows use:
- **Node.js 18**: Stable LTS version
- **Ubuntu Latest**: GitHub-hosted runners
- **npm cache**: Speeds up dependency installation
- **Path ignores**: Skip CI for documentation-only changes
- **Concurrency control**: Prevent resource conflicts

## Troubleshooting

### Common CI Failures

1. **Lint Errors**: Check ESLint output for specific issues
2. **Test Failures**: Review test logs for failing assertions
3. **Build Failures**: Check TypeScript compilation or Vite build errors
4. **Missing Dependencies**: Ensure `package-lock.json` is committed

### Dependabot PRs

Dependabot PRs will automatically trigger the CI workflow. If a dependency update breaks the build:
1. The CI will fail with detailed error logs
2. Review the failing step (lint, test, or build)
3. The PR can be updated or closed if the dependency is incompatible

## Security

- Workflows run in isolated environments
- No secrets required for CI validation
- Deploy workflow uses GitHub's built-in GITHUB_TOKEN
- All actions use pinned versions for security