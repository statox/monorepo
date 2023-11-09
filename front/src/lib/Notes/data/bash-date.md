[tags]: # '["bash", "date"]'
[title]: # 'Bash dates'

_This note is about `date` from GNU coreutils on Linux. Some parameters may differ on MacOS._

### Timestamp / Date conversions

```bash
date +"%s"  # Get current date as timestamp in seconds

alias ts2date='timestamp2date' # Parse timestamp as date
function timestamp2date {
    echo $(date -d @$1)
}
```
