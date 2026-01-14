const o=`[tags]: # '["bash", "xclip", "clipboard"]'
[title]: # 'Linux copy to clipboard'

### Copy data to the clipboard

\`\`\`bash
echo 'foo' | xclip -selection clipboard
\`\`\`
`;export{o as default};
