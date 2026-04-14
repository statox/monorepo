[tags]: # '["git", "search", "commands", "explore"]'
[title]: # 'Git commands to get the state of a repo'

https://piechowski.io/post/git-commands-before-reading-code/

### What changes the most

```bash
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20
```

### Who built this

```bash
git shortlog -sn --no-merges
```

### Where do bugs cluster

```bash
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20
```
