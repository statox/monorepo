#!/usr/bin/env bash

COMPOSE_FILE='src/tools/docker-compose.yml'

CMD=''
case "$1" in
    up)
        CMD='up -d'
        ;;
    down)
        CMD='down'
        ;;
    *)
        echo "Error: unknown argument $1" >&2
        exit 1
        ;;
esac

if [[ -n "${ENGINE}" && "${ENGINE}" != "docker" && "${ENGINE}" != "podman" ]]; then
    echo "Error: ENGINE must be 'docker' or 'podman', got '${ENGINE}'" >&2
    exit 1
fi

if [[ "${ENGINE}" != "docker" ]] && command -v podman-compose &>/dev/null; then
    podman-compose -f "${COMPOSE_FILE}" ${CMD}
elif [[ "${ENGINE}" != "podman" ]] && command -v docker &>/dev/null; then
    docker compose -f "${COMPOSE_FILE}" ${CMD}
else
    echo "Neither podman-compose nor docker were found on this system" >&2
    exit 1
fi
