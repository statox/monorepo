[tags]: # '["git", "hook", "commit", "message", "msg"]'
[title]: # 'Git commit-msg hook'

`.git/hooks/commit-msg`

```
#!/bin/sh

MSG_FILE="$1"

# Pattern to remove
PATTERN='Co-Authored-By'

# Remove matching lines
grep -v -E "$PATTERN" "$MSG_FILE" > "$MSG_FILE.tmp" &&
mv "$MSG_FILE.tmp" "$MSG_FILE"

exit 0
```
