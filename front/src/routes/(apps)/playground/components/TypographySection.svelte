<section>
    <h2>Typography</h2>
    <div class="typography-examples">
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>

        <p>
            This is a paragraph with <strong>bold text</strong>, <em>italic text</em>, and
            <a href="#typography">a link</a>. Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <p>
            <code>Inline code example</code> and a <kbd>keyboard input</kbd> example.
        </p>

        <pre><code
                >// Code block example
function greet(name) &#123;
    return `Hello, $&#123;name&#125;!`;
&#125;</code
            ></pre>

        <ul>
            <li>Unordered list item 1</li>
            <li>Unordered list item 2</li>
            <li>
                Nested item
                <ul>
                    <li>Nested item 1</li>
                    <li>Nested item 2</li>
                </ul>
            </li>
        </ul>

        <ol>
            <li>Ordered list item 1</li>
            <li>Ordered list item 2</li>
            <li>Ordered list item 3</li>
        </ol>

        <blockquote>
            This is a blockquote. It can be used for highlighting important text or quotes from
            other sources.
        </blockquote>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .typography-examples {
        background-color: var(--nc-bg-2);
        padding: 2rem;
        border-radius: 4px;
    }

    .typography-examples > * {
        margin-bottom: 1rem;
    }
</style>
