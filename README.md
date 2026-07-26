# AI Premium Tools

**Monorepo for AI Premium Suite of developer tools and automation frameworks.**

A comprehensive pnpm workspace containing 10+ sub-projects for AI integration, automation, and no-code system building.

## Overview

AI Premium Tools is a monorepo structure designed for:
- Shared utilities and dependencies
- Multiple independent applications
- Consistent development practices
- Unified deployment pipeline
- Workspace-level scripts and tools

## Workspace Structure

```
packages/
├── core/                # Core utilities & shared libraries
├── ai-models/           # AI model integrations
├── automation/          # Automation frameworks
├── cli-tools/           # Command-line utilities
├── templates/           # Project templates
├── plugins/             # Plugin system
├── utils/               # Helper utilities
├── types/               # TypeScript type definitions
├── config/              # Shared configurations
└── [other-packages]/    # Additional packages
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install

# Install specific workspace
pnpm --filter @aitools/core install
```

### Development

```bash
# Start dev mode (all workspaces)
pnpm dev

# Start specific workspace
pnpm --filter @aitools/core dev

# Build all
pnpm build

# Run tests
pnpm test

# Lint all packages
pnpm lint
```

## Workspace Management

### pnpm Commands

```bash
# List all workspaces
pnpm list --depth=-1

# Add dependency to specific workspace
pnpm --filter @aitools/core add axios

# Remove dependency
pnpm --filter @aitools/core remove axios

# Run script in specific workspace
pnpm --filter @aitools/core run build

# Run script in all workspaces
pnpm -r run build
```

### Adding New Package

```bash
# Create new package
mkdir packages/my-package
cd packages/my-package
npm init

# Add to pnpm-workspace.yaml if not auto-detected
```

## Scripts

### Global Scripts
```bash
pnpm dev          # Start development mode
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm format       # Format with Prettier
pnpm clean        # Clean all node_modules and builds
```

### Package-Specific Scripts
Each package has its own scripts:
```bash
pnpm --filter @aitools/core run build
pnpm --filter @aitools/ai-models run test
```

## Packages

### Core (`packages/core`)
**Shared utilities and base classes**
- Configuration management
- Logger setup
- Error handling
- Type definitions

### AI Models (`packages/ai-models`)
**AI model integrations**
- OpenAI integration
- Anthropic Claude integration
- Local model support
- Model interfaces

### Automation (`packages/automation`)
**Automation frameworks**
- Workflow engines
- Task scheduling
- Integration templates
- Trigger systems

### CLI Tools (`packages/cli-tools`)
**Command-line utilities**
- Project scaffolding
- Code generation
- Deployment helpers
- Development utilities

### Templates (`packages/templates`)
**Starter project templates**
- React templates
- Node.js templates
- Automation workflows
- Integration examples

## Development Practices

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Pre-commit hooks

### Testing
- Jest for unit tests
- Vitest for fast testing
- Integration tests
- E2E tests

### Documentation
- TypeDoc for API docs
- README in each package
- Examples directory
- Contributing guides

## Dependency Management

### Adding Dependencies
```bash
# Add to root (devDependencies)
pnpm add -w -D typescript

# Add to specific package
pnpm --filter @aitools/core add axios

# Add shared dependency
pnpm add -r axios  # across all packages
```

### Shared Dependencies
- TypeScript
- ESLint
- Prettier
- Jest/Vitest
- Husky

### Package-Specific Dependencies
Each package can have its own dependencies without affecting others.

## Building for Production

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @aitools/core build

# Output locations (check each package)
dist/
lib/
build/
```

## Publishing

```bash
# Publish to npm (requires setup)
pnpm publish -r

# Check what would be published
pnpm publish -r --dry-run
```

## Troubleshooting

### Clean Install
```bash
pnpm clean
pnpm install
```

### Clear Cache
```bash
pnpm store prune
```

### Check Workspace Health
```bash
pnpm ls -r
pnpm audit
```

## CI/CD

GitHub Actions workflow included for:
- Testing on push
- Linting checks
- Build verification
- Automated publishing

## Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Contributing

See individual package README files and root `CONTRIBUTING.md`

## License

Private - SYSmoAI. All rights reserved.

## Support

- **Documentation:** See `/docs`
- **Issues:** GitHub Issues
- **Questions:** Team Slack channel

---

Built in Dhaka, Bangladesh 🇧🇩  
Part of the SYSmoAI AI Premium Suite
