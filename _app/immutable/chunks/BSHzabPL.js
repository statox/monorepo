const e=`[tags]: # '["shell", "zsh"]'
[title]: # 'Zsh debug startup time'

Two lines to be added to \`.zshrc\`:

- At the top of the file: \`zmodload zsh/zprof\`
- At the very end of the file \`zprof\`

This will load the [zprof module](https://zsh.sourceforge.io/Doc/Release/Zsh-Modules.html#The-zsh_002fzprof-Module) and display what the shell did during startup.

To test, start a new tmux pane or run:

\`\`\`
time zsh -i -c exit
\`\`\`
`;export{e as default};
