[tags]: # '["bash", "command", "exist", "available", "check"]'
[title]: # 'Bash check if command is available'

### Check if command `plop` is available

```bash
if command -v plop >/dev/null 2>&1; then
    echo "Command is available"
    return 0
else
    echo "Command is not available" >&2
    return 1
fi

# Negative condition
if ! command -v plop >/dev/null 2>&1; then
    echo "Command is not available"
fi
```

Avoid using `which`: Not POSIX compliant, not guaranteed to be present
Avoid using `type`: Behavior changes among shells
