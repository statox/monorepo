const e=`[tags]: # '["npm", "dependencies", "javascript","js", "package.json"]'
[title]: # 'NPM: dependencies utils'

### Check unused dependencies

The npm package [depcheck](https://www.npmjs.com/package/depcheck) is great for that:

\`\`\`bash
npx depcheck
\`\`\`

### Update all dependencies

See [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)

\`\`\`bash
npx npm-check-updates -u
\`\`\`

Note: \`--doctor\` option _"Iteratively installs upgrades and runs tests to identify breaking upgrades."_ looks interesting, might need to test next time I use this note.
`;export{e as default};
