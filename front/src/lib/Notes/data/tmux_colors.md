[tags]: # '["tmux", "colors"]'
[title]: # 'Tmux list all 256 colors'

From [this SO comment](https://superuser.com/questions/285381/how-does-the-tmux-color-palette-work#comment1845985_1104214)

```bash
for i in {0..255}; do  printf "\x1b[38;5;${i}mcolor%-5i\x1b[0m" $i ; if ! (( ($i + 1 ) % 8 )); then echo ; fi ; done

# OR

for i in {0..255}; do
    printf "\x1b[38;5;${i}mcolour${i}\x1b[0m\n"
done
```

![Tmux colors light background](/notes/tmux_colors/tmux_colors_light.png 'Tmux colors light background')
![Tmux colors dark background](/notes/tmux_colors/tmux_colors_dark.png 'Tmux colors dark background')
