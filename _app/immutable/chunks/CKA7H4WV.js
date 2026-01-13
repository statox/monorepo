const t=`[tags]: # '["dunst", "dunstctl", "notification"]'
[title]: # 'Dunst'

Good reference in the [Arch wiki article](https://wiki.archlinux.org/title/Dunst).

### Test notification

With \`notify-send\` (works with all notification daemons):

\`\`\`bash
notify-send 'Test notification'
notify-send -u low|normal|critical 'Notification with urgency'
notify-send 'Test notification 1 second' -t 1000
\`\`\`

With \`dunstify\` (dunst tool working only with dunst):

\`\`\`bash
dunstify -h string:x-dunst-stack-tag:test Test -A 'tested,default'
dunstify -h string:x-dunst-stack-tag:test Testing
\`\`\`
`;export{t as default};
