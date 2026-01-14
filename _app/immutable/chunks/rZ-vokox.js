const e=`[tags]: # '["svelte", "css", "html"]'
[title]: # 'Svelte - Use variable in CSS'

[Playground example](https://svelte.dev/repl/4b1c649bc75f44eb9142dadc0322eccd?version=3.6.7) and [reddit thread](https://www.reddit.com/r/sveltejs/comments/15ggm9v/how_best_to_use_js_variables_within_css/)

\`\`\`html
<script>
    // Define the variable to be used in CSS
    const color = '#ff0000'; // or 'rgb(250, 0, 0)' or '#ff0000'
<\/script>

<!-- Let the CSS know about the JS/TS variable -->
<div style="--theme-color: {color}">
    <p>the color is set using a CSS variable</p>
</div>

<style>
    p {
        // Use the variable defined in HTML markup and coming from JS/TS
        color: var(--theme-color);
    }
</style>
\`\`\`

When a variable is defined in a CSS file and needs to be accessed in a svelte component:

\`\`\`
let textColor = $state("#000000"); // Default in case we can't get it from the CSS

onMount(() => {
    const bodyStyle = getComputedStyle(document.body);
    textColor = bodyStyle.getPropertyValue('--nc-tx-1');
});
\`\`\`
`;export{e as default};
