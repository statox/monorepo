const n=`[tags]: # '["ubuntu", "swap", "linux"]'
[title]: # 'Change swap size on Linux'

Sources:

- https://askubuntu.com/a/1177939
- https://help.ubuntu.com/community/SwapFaq

### Resize Swap to 8GB

1. Turn swap off. This moves stuff in swap to the main memory and might take several minutes

    \`\`\`shell
    sudo swapoff -a
    \`\`\`

2. Create an empty swapfile. Note that "1M" is basically just the unit and count is an integer. Together, they define the size. In this case 8GiB.

    \`\`\`shell
    sudo dd if=/dev/zero of=/swap.img bs=1M count=8192
    \`\`\`

3. Set the correct permissions

    \`\`\`shell
    sudo chmod 0600 /swap.img
    \`\`\`

4. Make the file a swap area

    \`\`\`shell
    sudo mkswap /swap.img # Set up a Linux swap area
    \`\`\`

5. Turn swap on.

    \`\`\`shell
    sudo swapon /swap.img
    \`\`\`

The result can be checked with \`htop\` or \`grep Swap /proc/meminfo\`

#### Persistance

\`/etc/fstab\` should contain the following to have the swap enabled at start up. On Ubuntu that should be the case if the install was done with swap enabled

\`\`\`
# <file system> <mount point> <type>  <options> <dump>  <pass>
/swap.img       none          swap    sw        0       0
\`\`\`

### Swap size

The Ubuntu FAQ mentions the following:

> For modern systems (>1GB RAM), your swap space should be at a minimum be equal to your physical memory (RAM) size "if you use hibernation", otherwise you need a minimum of \`round(sqrt(RAM))\` and a maximum of twice the amount of RAM. The only downside to having more swap space than you will actually use, is the disk space you will be reserving for it.
`;export{n as default};
