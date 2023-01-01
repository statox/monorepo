<script>
    import { Tabs, Tab, TabList, TabPanel } from 'svelte-tabs';
    import Game from '$lib/components/Game.svelte';
    import Markdown from '$lib/components/Markdown/Main.svelte';
</script>

<Tabs>
    <TabList>
        <Tab>Game</Tab>
        <Tab>Markdown</Tab>
    </TabList>

    <TabPanel>
        <Game />
    </TabPanel>
    <TabPanel>
        <Markdown />
    </TabPanel>
</Tabs>
