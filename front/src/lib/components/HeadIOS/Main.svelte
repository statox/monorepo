<script lang="ts">
    // This component is used to add meta info to turn a page into an iOS webapp
    // In Safari one can use "save to homescreen" to have a standalone app
    // https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html

    export let title: string;
    export let description: string;
    export let iconPath = '/favicon.png';
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <!-- Icon used on homescreen -->
    <link rel="apple-touch-icon" href={iconPath} />
    <!-- Title used on homescreen -->
    <meta name="apple-mobile-web-app-title" content={title} />
    <!-- Hide the Safari UI and status bar -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
</svelte:head>
