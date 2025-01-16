<script lang="ts">
    import { page } from '$app/stores';

    // Using the Office Web Viewer to display Microsoft documents
    // currently used by the Song Book app to display .doc and .docx songs
    // See https://www.microsoft.com/en-us/microsoft-365/blog/2013/04/10/office-web-viewer-view-office-documents-in-a-browser/

    let innerWidth: number = $state(0);

    const { path } = $page.params;
    const src = `https://view.officeapps.live.com/op/embed.aspx?src=${path}`;

    let viewWidth = $derived(Math.min(innerWidth, 700));
</script>

<div id="viewer">
    <iframe title={path} {src} width={viewWidth} height="900px" frameborder="0"> document </iframe>
</div>

<svelte:window bind:innerWidth />
