<script lang="ts">
    export let tags: { letter: string, tag: string}[];
</script>

<ol id="indexList" class="navigationBar disable-scrollbars">
    {#each tags as tag}
        <li class='navigationBtn'>
            <a href={'#'+tag.tag} class='navigationLink'>
                {tag.letter.toUpperCase()}
            </a>
        </li>
    {/each}
</ol>

<style>
.navigationBar {
    position:fixed;
    z-index: 1000;
    width: 50px;
    top: 250px;
    bottom: 10px;
    right: 10px;
    padding-right: 5px;
    padding-left: 5px;
    background: var(--nc-bg-1);
    list-style: none;
    overflow-x: auto;
    display: inline-block;
    border: 1px solid;
    border-radius: 5px;
    border-color: var(--nc-bg-2);
}

.navigationBar.scrolled {
    top: 20px;
}

.navigationBtn {
    background: var(--nc-bg-0);
    text-align: center;
    height: 50px;
    width: 50px;
    border-radius: 5px;
}

.navigationLink {
    display: inline-block;
    height: 40px;
    width: 40px;
    line-height: 50px;
    font-weight: bold;
}
</style>
