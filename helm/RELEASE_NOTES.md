# Helm 0.1.0 Release Notes

## Initial Release

### Features
- Complete CLI for CHIEF personal AI operations system
- 7 core commands: setup, status, secrets, sync, push, inputs, config
- Interactive setup wizard with 6-step guided configuration
- Secure credential storage using AES-256-GCM encrypted local storage
- Git integration for configuration management
- React-based UI components for enhanced terminal experience

### Commands
- `helm setup` - First-time guided setup wizard
- `helm status` - Health overview of repo, inputs, and engine
- `helm secrets` - Manage credentials securely
- `helm sync` - Git pull and show repo status
- `helm push` - Git add, commit, and push changes
- `helm inputs` - Manage and test input connections
- `helm config` - List and open configuration files

### Technical Details
- TypeScript implementation with strict type checking
- React-based UI using Ink framework
- Node.js v20+ requirement
- Git v2.30+ requirement
- AES-256-GCM encrypted local storage support for credential storage

### Installation
```bash
npm install -g chief-helm
helm --version
```

### First-Time Setup
```bash
helm setup
```

This release marks the initial public availability of Helm as a standalone npm package.