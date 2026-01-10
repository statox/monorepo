[tags]: # '["bash", "pwd", "current", "directory"]'
[title]: # 'Bash get current directory'

_This was LLM generated and shellcheck validated, double check if it's really the best way_

### Get script directory

```bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
```
