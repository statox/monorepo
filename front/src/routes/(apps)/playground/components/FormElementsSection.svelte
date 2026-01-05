<section>
    <h2>Form Elements</h2>
    <div class="form-examples">
        <div class="form-group">
            <label for="text-input">Text Input</label>
            <input type="text" id="text-input" placeholder="Enter text..." />
        </div>

        <div class="form-group">
            <label for="email-input">Email Input</label>
            <input type="email" id="email-input" placeholder="email@example.com" />
        </div>

        <div class="form-group">
            <label for="number-input">Number Input</label>
            <input type="number" id="number-input" placeholder="42" />
        </div>

        <div class="form-group">
            <label for="select">Select Dropdown</label>
            <select id="select">
                <option value="">Choose an option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
            </select>
        </div>

        <div class="form-group">
            <label for="textarea">Textarea</label>
            <textarea id="textarea" rows="4" placeholder="Enter multiline text..."></textarea>
        </div>

        <div class="form-group">
            <label>
                <input type="checkbox" />
                Checkbox option
            </label>
        </div>

        <div class="form-group">
            <label>
                <input type="radio" name="radio-group" />
                Radio option 1
            </label>
            <label>
                <input type="radio" name="radio-group" />
                Radio option 2
            </label>
        </div>

        <div class="form-group">
            <button type="button">Regular Button</button>
            <button type="submit">Submit Button</button>
            <button type="button" disabled>Disabled Button</button>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .form-examples {
        background-color: var(--nc-bg-2);
        padding: 2rem;
        border-radius: 4px;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--nc-tx-2);
        font-weight: 500;
    }

    .form-group input[type='checkbox'],
    .form-group input[type='radio'] {
        margin-right: 0.5rem;
    }
</style>
