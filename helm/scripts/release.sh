#!/bin/bash

# HELM Release Script
# Usage: ./scripts/release.sh <version>
# Must be run from the repo root (parent of helm/)

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 0.2.0"
    exit 1
fi

VERSION=$1
PACKAGE_NAME="chief-helm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if we're in the helm directory
if [ ! -f "package.json" ]; then
    error "This script must be run from the helm/ directory"
fi

log "Starting release process for ${PACKAGE_NAME} v${VERSION}"

# Check if version is already in package.json
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
if [ "$CURRENT_VERSION" = "$VERSION" ]; then
    warn "Version $VERSION is already set in package.json"
else
    log "Updating package.json version from $CURRENT_VERSION to $VERSION"
    npm version "$VERSION" --no-git-tag-version
fi

# Update release notes
RELEASE_DATE=$(date +"%Y-%m-%d")
RELEASE_HEADER="## $VERSION - $RELEASE_DATE"

if grep -q "^## $VERSION" RELEASE_NOTES.md; then
    warn "Release notes for version $VERSION already exist"
else
    log "Adding release notes header"
    echo -e "$RELEASE_HEADER\n\n$(cat RELEASE_NOTES.md)" > RELEASE_NOTES.md
fi

# Build the package
log "Building the package"
npm run build

# Commit version bump first, then tag
log "Committing version bump"
cd ..
git add helm/package.json helm/package-lock.json helm/RELEASE_NOTES.md
git commit -m "[helm-release] v${VERSION}"

# Create git tag (after commit so the tag points to the release commit)
log "Creating git tag helm-v${VERSION}"
git tag "helm-v${VERSION}"

log "Release process completed successfully!"
log ""
log "Next steps:"
log "  git push origin main && git push origin helm-v${VERSION}"
log ""
log "Pushing the tag will trigger the GitHub Actions workflow which will:"
log "  1. Build and verify the package"
log "  2. Publish to npm"
log "  3. Create a GitHub Release"
