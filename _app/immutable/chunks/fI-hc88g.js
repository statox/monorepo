const a=`[tags]: # '["bash", "clamav", "scan", "virus"]'
[title]: # 'Clamav cheatsheet'

### Refresh the database

\`\`\`
sudo freshclam
\`\`\`

### Scan a file

\`\`\`
clamscan /path/to/file
\`\`\`
`;export{a as default};
