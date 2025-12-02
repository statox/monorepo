<script lang="ts">
    import type { BuildInfo } from './types';
    import { pageMetadataStore } from '$lib/components/Header';

    pageMetadataStore.set({ name: 'About this website' });

    interface Props {
        // From +page.server.ts load() function
        data: BuildInfo;
    }

    let { data }: Props = $props();
</script>

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

<br />

<div class="description">
    <p>
        This website is a collection of applications I created for myself. You can access some
        features (mostly reading non-sensitive data) but any modification or access to sensitive
        data (theoretically) requires to login as myself, so you shouldn't be able to do it. (The
        authentication used to be handled via <a target="_blank" href="https://auth0.com/">auth0</a>
        and used Github as the identity provider. Now our own api uses passportJS to handle login and
        session cookies and we use the browsers built-in cookie handling to authenticate calls after
        the initial login.
    </p>
    <br />
    <p>
        If you are trying to find out more about me, you probably want to check out my blog
        <a target="_blank" href="https://www.statox.fr/">statox.fr</a> where I discuss some of the applications
        I created here as well as other projects.
    </p>
    <br />
    <p>
        If you are curious about this website the sources are
        <a target="_blank" href="https://github.com/statox/apps.statox.fr">on Github</a>. It is
        deployed via Github pages (see the badge above for the latest build status and a quick
        access to the CI) and made with
        <a target="_blank" href="https://svelte.dev/">SvelteJS</a>.
    </p>
    <br />
    <p>
        You can also find the sources of
        <a target="_blank" href="https://github.com/statox/api.statox.fr">the api I created</a> to
        power this website (and other projects). The API is hosted on Heroku, is made with
        <a target="_blank" href="https://expressjs.com/">ExpressJS</a> and uses a MySQL db, cloudflare
        R2 storage and various other technologies.
    </p>
</div>

<style>
    .build-info {
        display: flex;
        justify-content: space-between;
    }

    .build-status-badge {
        margin: 0;
    }

    p {
        text-align: justify;
        text-justify: inter-word;
    }
</style>
