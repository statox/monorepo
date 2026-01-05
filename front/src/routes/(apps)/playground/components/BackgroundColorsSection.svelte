<section>
    <h2>Background Colors in Context</h2>
    <p class="section-intro">
        Examples showing how different background colors work with text, buttons, and accents.
    </p>

    <div class="bg-examples">
        <!-- bg-1 example -->
        <div class="bg-demo" style="background-color: var(--nc-bg-1)">
            <h3>Background 1 (bg-1)</h3>
            <p style="color: var(--nc-tx-1)">Primary text (tx-1)</p>
            <p style="color: var(--nc-tx-2)">Secondary text (tx-2)</p>
            <p style="color: var(--nc-tx-3)">Tertiary text (tx-3)</p>
            <a href="#bg" style="color: var(--nc-lk-1)">Link (lk-1)</a>
            <div class="button-row">
                <button class="btn-accent">Accent Button</button>
                <button class="btn-default">Default Button</button>
            </div>
        </div>

        <!-- bg-2 example -->
        <div class="bg-demo" style="background-color: var(--nc-bg-2)">
            <h3>Background 2 (bg-2)</h3>
            <p style="color: var(--nc-tx-1)">Primary text (tx-1)</p>
            <p style="color: var(--nc-tx-2)">Secondary text (tx-2)</p>
            <p style="color: var(--nc-tx-3)">Tertiary text (tx-3)</p>
            <a href="#bg" style="color: var(--nc-lk-1)">Link (lk-1)</a>
            <div class="button-row">
                <button class="btn-accent">Accent Button</button>
                <button class="btn-default">Default Button</button>
            </div>
        </div>

        <!-- bg-3 example -->
        <div class="bg-demo" style="background-color: var(--nc-bg-3)">
            <h3>Background 3 (bg-3)</h3>
            <p style="color: var(--nc-tx-1)">Primary text (tx-1)</p>
            <p style="color: var(--nc-tx-2)">Secondary text (tx-2)</p>
            <p style="color: var(--nc-tx-3)">Tertiary text (tx-3)</p>
            <a href="#bg" style="color: var(--nc-lk-1)">Link (lk-1)</a>
            <div class="button-row">
                <button class="btn-accent">Accent Button</button>
                <button class="btn-default">Default Button</button>
            </div>
        </div>
    </div>

    <h3>Nested Backgrounds</h3>
    <div class="nested-example" style="background-color: var(--nc-bg-1)">
        <p style="color: var(--nc-tx-1)">Background 1 (outer layer)</p>
        <div style="background-color: var(--nc-bg-2); padding: 1rem; border-radius: 4px;">
            <p style="color: var(--nc-tx-2)">Background 2 (middle layer)</p>
            <div style="background-color: var(--nc-bg-3); padding: 1rem; border-radius: 4px;">
                <p style="color: var(--nc-tx-1)">
                    Background 3 (inner layer) - often used for cards and elevated content
                </p>
                <button class="btn-accent">Call to Action</button>
            </div>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .section-intro {
        color: var(--nc-tx-2);
        margin-bottom: 1.5rem;
    }

    .bg-examples {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .bg-demo {
        padding: 1.5rem;
        border-radius: 4px;
        border: 1px solid var(--nc-bg-3);
    }

    .bg-demo h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--nc-tx-1);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .bg-demo p {
        margin: 0.5rem 0;
    }

    .bg-demo a {
        display: block;
        margin: 1rem 0;
        text-decoration: underline;
    }

    .button-row {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    .btn-accent {
        background-color: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-accent:hover {
        opacity: 0.9;
    }

    .btn-default {
        background-color: var(--nc-bg-3);
        color: var(--nc-tx-1);
        border: 1px solid var(--nc-tx-3);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .btn-default:hover {
        background-color: var(--nc-bg-2);
    }

    .nested-example {
        padding: 1.5rem;
        border-radius: 4px;
        margin-top: 1rem;
    }

    .nested-example p {
        margin: 0 0 1rem 0;
    }
</style>
