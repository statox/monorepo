var e=`[tags]: # '["docker", "overlay2"]'
[title]: # 'Docker cheatsheet'

[\`docker exec\` reference](https://docs.docker.com/engine/reference/commandline/exec/)

Run interactive shell on container

\`\`\`bash
docker exec -it <container_id> bash
\`\`\`

Run command on container

\`\`\`bash
docker exec -d <container_id> touch /tmp/test
\`\`\`

Set an environment variable in the current bash session.

\`\`\`bash
docker exec -it -e VAR=1 <container_id> bash
\`\`\`

Select working directory for the command to execute into

\`\`\`bash
 docker exec -it -w /root <container_id> pwd
\`\`\`

## \`overlay2\` getting too big

Show a detailed usage of the data

\`\`\`bash
docker system df -v
\`\`\`

Remove dangling/unused images only

\`\`\`bash
docker image prune -a
\`\`\`

_(-a also removes unused-but-tagged images not referenced by any container. Still safe, just more thorough than default)_

Remove stopped containers, unused networks, dangling images, build cache:

\`\`\`bash
docker system prune
\`\`\`

Everything unused including unused volumes too
Check first this can delete data volumes not attached to any running container

\`\`\`bash
docker volume ls
docker system prune --volumes
\`\`\`
`;export{e as default};