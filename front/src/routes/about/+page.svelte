<script lang="ts">
    import type { BuildInfo } from './types';
    // From +page.server.ts load() function
    export let data: BuildInfo;
</script>

<div class="container">
    <a target="_blank" rel="noopener noreferrer" href="https://github.com/statox/apps/actions">
        <img
            class="build-status-badge"
            src="https://github.com/statox/blog/actions/workflows/deploy.yml/badge.svg"
            alt="Build Status"
        />
    </a>
    <span>
        <a href={data.commitLink}>
            {data.commitSha}
        </a>
        {data.commitMessage}
        -
        <a href={data.buildUrl}>
            {data.buildTimeStr}
        </a>
    </span>
</div>

<style>
    .container {
        display: flex;
        justify-content: space-around;
    }

    .build-status-badge {
        margin: 0;
    }
</style>
