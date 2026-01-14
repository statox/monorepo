const n=`[tags]: # '["git", "commit", "search"]'
[title]: # 'Search git commits'

### Find commits which change the number of occurences of a string

\`\`\`bash
git log -SsearchedString
\`\`\`

### Find commits with a commit message including a string

\`\`\`bash
git log --grep=searchedString
\`\`\`
`;export{n as default};
