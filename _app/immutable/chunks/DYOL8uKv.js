const e=`[tags]: # '["recording", "screen", "screencast", "keys", "keypress", "ubuntu", "linux"]'
[title]: # 'Display key presses while screen recording'

I use [screenkey](https://www.thregr.org/wavexx/software/screenkey/) to display my key presses in a banner during screen recording (for example with [simplescreenrecorder](https://launchpad.net/ubuntu/+source/simplescreenrecorder)). On Ubuntu this is easily installed with \`apt install screenkey\`)

### Tips

One can toggle the banner by pressing both \`<Shift>\` keys simultaneously. So for example when using simplescreenrecorder you can:

- Start simplescreenrecorder
- Start screenkey with \`screenkey --start-disabled\` to prevent showing the banner
- Start the recording with \`Alt+r\` without having this key press displayed
- Press both \`<Shift>\` keys to start displaying the banner
- Record the demo
- Press again both \`<Shift>\` keys to stop displaying the banner
- Stop the recording with \`Alt+r\` without having this key press displayed

**Note** \`--opacity\` doesn't seem to work on my setup which makes sense since I removed picom from my setup.
`;export{e as default};
