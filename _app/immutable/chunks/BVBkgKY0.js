const n=`[tags]: # '["git", "branches"]'
[title]: # 'Git prune git branches'

See [stackoverflow](https://stackoverflow.com/a/28464339)

Prune branches not on the remote (with dry run):

\`\`\`bash
git remote prune origin --dry-run
\`\`\`
`;export{n as default};
