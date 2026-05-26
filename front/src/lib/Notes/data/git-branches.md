[tags]: # '["git", "branches"]'
[title]: # 'Git prune branches'

See [stackoverflow](https://stackoverflow.com/a/28464339)

1. Prune branches not on the remote (with dry run):

```bash
git remote prune origin --dry-run
```


2. Delete remote branches

```bash
git push <remote_name> --delete <branch_name>
```
