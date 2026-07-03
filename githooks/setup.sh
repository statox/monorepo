#!/bin/bash
#
# Put custom hooks in the git hooks directory

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

HOOKS_DIR_DEST='./.git/hooks'
HOOKS_DIR_SRC='./githooks/files'

if [[ -d $HOOKS_DIR_DEST ]]; then
    for hook in "$HOOKS_DIR_SRC"/*; do
        ln -sf "$(realpath "$hook")" "$HOOKS_DIR_DEST/$(basename "$hook")"
    done

    echo -e "${GREEN}SUCCESS${NC} Git hooks successfully set up"
else
    echo -e "${RED}ERROR${NC} No directory $HOOK_DIR found"
fi
