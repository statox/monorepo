<script lang="ts">
    import type { BuildInfo } from './types';
    // From +page.server.ts load() function
    export let data: BuildInfo;
</script>

<h2>About this website</h2>

<div class="description">
    <div>
        This website is a collection of application I created for myself. You can access some
        features (mostly reading non-sensitive data) but any modification or access to sensitive
        data (theoretically) requires to login as myself, so you shouldn't be able to do it. (For
        now the authentication is handled via <a target="_blank" href="https://auth0.com/">auth0</a>
        and uses Github as the identity provider.
    </div>
    <br />
    <div>
        If you are trying to find out more about me, you probably want to check out my blog
        <a target="_blank" href="https://www.statox.fr/">statox.fr</a> where I discuss some of the applications
        I created here as well as other projects.
    </div>
    <br />
    <div>
        If you are curious about this website the sources are
        <a target="_blank" href="https://github.com/statox/apps.statox.fr">on Github</a>. It is
        deployed via Github pages (see the badge below for the latest build status and a quick
        access to the CI) and made with
        <a target="_blank" href="https://svelte.dev/">SvelteJS</a>.
    </div>
    <br />
    <div>
        You can also find the sources of
        <a target="_blank" href="https://github.com/statox/api.statox.fr">the api I created</a> to
        power this website (and other projects). The API is hosted on Heroku, is made with
        <a target="_blank" href="https://expressjs.com/">ExpressJS</a> and uses a MySQL db, cloudflare
        R2 storage and various other technologies.
    </div>
</div>

<br />

<div class="build-info">
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
    .build-info {
        display: flex;
        justify-content: space-around;
    }

    .build-status-badge {
        margin: 0;
    }
</style>
