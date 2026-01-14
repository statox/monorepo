const e=`[tags]: # '["docker", "proxy"]'
[title]: # 'Docker Using a proxy'

In order to pull images (from instruction or docker pull command) via the proxy:

1. Create a systemd drop-in directory:

    \`\`\`bash
    mkdir /etc/systemd/system/docker.service.d
    \`\`\`

1. Add proxy in \`/etc/systemd/system/docker.service.d/http-proxy.conf\` file:

    \`\`\`bash
    # /etc/systemd/system/docker.service.d/http-proxy.conf
    [Service]
    Environment="HTTP_PROXY=http:/proxy.address.com:3128"
    Environment="HTTPS_PROXY=http://proxy.address.com:3128"
    Environment="NO_PROXY=localhost,127.0.0.1,localaddress,.localdomain.com"
    \`\`\`

1. Flush changes:

    \`\`\`bash
    systemctl daemon-reload
    \`\`\`

1. Restart Docker:

    \`\`\`bash
    systemctl restart docker
    \`\`\`

In order to have \`apt-get\` working inside the Dockerfile via the proxy you have to add some build args to the command:

\`\`\`bash
docker build --build-arg http_proxy=http://proxy.service.kwift.eu:3128 --build-arg https_proxy=http://proxy.service.kwift.eu:3128 .
\`\`\`
`;export{e as default};
