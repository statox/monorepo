<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        FormFileInput,
        handleFormError,
        showSuccessToast
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';

    let name: string = $state('');
    let email: string = $state('');
    let number: number = $state(42);
    let description: string = $state('');
    let category: string = $state('general');
    let durationSeconds: number = $state(600);
    let isPublic: boolean = $state(false);
    let acceptTerms: boolean = $state(false);
    let priority: string = $state('');
    let files: FileList | undefined = $state();
    let uploading = $state(false);
    let noticeMessages: NoticeItem[] = $state([]);

    const handleSubmit = async () => {
        // Clear previous messages
        noticeMessages = [];

        // Validation
        if (!name) {
            noticeMessages.push({ level: 'error', header: 'Name must be defined' });
        }
        if (!email) {
            noticeMessages.push({ level: 'error', header: 'Email must be defined' });
        }
        if (email && !email.includes('@')) {
            noticeMessages.push({ level: 'error', header: 'Email must be valid' });
        }
        if (!description) {
            noticeMessages.push({ level: 'warning', header: 'Description is recommended' });
        }

        if (noticeMessages.filter((m) => m.level === 'error').length) {
            return;
        }

        // Simulate API call
        try {
            uploading = true;
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Simulate random failure
            if (Math.random() < 0.3) {
                throw new Error('Simulated API error: Server unavailable');
            }

            showSuccessToast('Demo item created successfully');

            // Reset form
            name = '';
            email = '';
            number = 42;
            description = '';
            category = 'general';
            durationSeconds = 600;
            isPublic = false;
            acceptTerms = false;
            priority = '';
            noticeMessages = [];
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };

    const handleReset = () => {
        name = '';
        email = '';
        number = 42;
        description = '';
        category = 'general';
        durationSeconds = 600;
        isPublic = false;
        acceptTerms = false;
        priority = '';
        noticeMessages = [];
    };
</script>

<div class="demo-container">
    <div class="demo-description">
        <h3>FormLayout Components Demo</h3>
        <p>
            This demonstrates the shared <code>FormLayout</code>, <code>FormGrid</code>,
            <code>FormSubmitButton</code>, and <code>FormFileInput</code> components, along with all standard
            form elements used across the application.
        </p>
        <ul class="features">
            <li><strong>Consistent styling:</strong> Title bar, back button, auth guard</li>
            <li>
                <strong>Responsive design:</strong> Two columns on desktop, single column on mobile
            </li>
            <li><strong>Loading states:</strong> Built-in spinner during submission</li>
            <li><strong>Error handling:</strong> Standardized validation and error messages</li>
            <li>
                <strong>All input types:</strong> Text, email, number, select, textarea, checkbox, radio,
                file
            </li>
        </ul>
        <p class="note">
            Try submitting the form to see validation, loading state, and success/error messages.
            Resize your browser window to see responsive behavior (breakpoint: 600px).
        </p>
    </div>

    <div class="demo-form">
        <FormLayout
            title="Example Form (Demo)"
            backUrl="/playground"
            authMessage="Login to submit this demo form"
            {noticeMessages}
        >
            <FormGrid>
                <label for="name">Name *</label>
                <input type="text" bind:value={name} placeholder="John Doe" />

                <label for="email">Email *</label>
                <input type="email" bind:value={email} placeholder="john@example.com" />

                <label for="number">Number</label>
                <input type="number" bind:value={number} placeholder="42" />

                <label for="category">Category</label>
                <select bind:value={category}>
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="support">Support</option>
                    <option value="billing">Billing</option>
                </select>

                <label for="duration">Duration</label>
                <DurationPicker
                    bind:valueInSeconds={durationSeconds}
                    allowedUnits={['minutes', 'hours', 'days']}
                    defaultDuration={{ value: 10, unit: 'minutes' }}
                />

                <label for="isPublic">Visibility</label>
                <button
                    type="button"
                    class="visibility-toggle"
                    class:public={isPublic}
                    onclick={() => (isPublic = !isPublic)}
                >
                    {#if isPublic}
                        Public <i class="fas fa-lock-open"></i>
                    {:else}
                        Private <i class="fas fa-lock"></i>
                    {/if}
                </button>

                <label for="file">File Upload</label>
                <FormFileInput bind:files />

                <label for="checkbox">Terms & Conditions</label>
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={acceptTerms} />
                    I accept the terms and conditions
                </label>

                <label for="priority">Priority</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="priority" value="low" bind:group={priority} />
                        Low
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="priority" value="medium" bind:group={priority} />
                        Medium
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="priority" value="high" bind:group={priority} />
                        High
                    </label>
                </div>

                <label for="description">Description</label>
                <textarea
                    bind:value={description}
                    rows="4"
                    placeholder="Enter a detailed description..."
                ></textarea>

                <div class="button-group">
                    <FormSubmitButton onclick={handleSubmit} loading={uploading} label="Submit" />
                    <button type="button" class="reset-button" onclick={handleReset}>Reset</button>
                </div>
            </FormGrid>
        </FormLayout>
    </div>

    <div class="demo-code">
        <h4>Sample Code:</h4>
        <pre><code
                >&lt;FormLayout title="Add item" backUrl="/items" {'{noticeMessages}'}&gt;
    &lt;FormGrid&gt;
        &lt;label&gt;Name&lt;/label&gt;
        &lt;input type="text" bind:value={'{name}'} /&gt;

        &lt;label&gt;Email&lt;/label&gt;
        &lt;input type="email" bind:value={'{email}'} /&gt;

        &lt;FormSubmitButton onclick={'{handleSubmit}'} loading={'{uploading}'} /&gt;
    &lt;/FormGrid&gt;
&lt;/FormLayout&gt;</code
            ></pre>
    </div>
</div>

<style>
    .demo-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .demo-description {
        background: var(--nc-bg-2);
        padding: 1.5rem;
        border-radius: 8px;
        border-left: 4px solid var(--nc-ac-1);
    }

    .demo-description h3 {
        margin-top: 0;
        color: var(--nc-tx-1);
    }

    .demo-description p {
        color: var(--nc-tx-2);
        line-height: 1.6;
    }

    .features {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }

    .features li {
        margin-bottom: 0.5rem;
        color: var(--nc-tx-2);
    }

    .note {
        background: var(--nc-bg-3);
        padding: 1rem;
        border-radius: 4px;
        font-size: 0.9em;
        margin-top: 1rem;
    }

    .demo-form {
        max-width: 800px;
    }

    .visibility-toggle {
        background-color: var(--nc-success);
        max-width: 150px;
    }

    .visibility-toggle.public {
        background-color: var(--nc-error);
    }

    .button-group {
        grid-column: 1 / -1;
        display: flex;
        gap: 1rem;
        margin-top: 1em;
    }

    .reset-button {
        background-color: var(--nc-error);
        margin-top: 1em;
        min-width: 120px;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        margin: 0;
    }

    .checkbox-label input[type='checkbox'] {
        margin: 0;
        cursor: pointer;
    }

    .radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        margin: 0;
    }

    .radio-label input[type='radio'] {
        margin: 0;
        cursor: pointer;
    }

    .demo-code {
        background: var(--nc-bg-2);
        padding: 1.5rem;
        border-radius: 8px;
        overflow-x: auto;
    }

    .demo-code h4 {
        margin-top: 0;
        color: var(--nc-tx-1);
    }

    .demo-code pre {
        margin: 0;
        background: var(--nc-bg-1);
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
    }

    .demo-code code {
        color: var(--nc-tx-2);
        font-size: 0.9em;
        line-height: 1.5;
    }

    @media screen and (max-width: 600px) {
        .demo-description {
            padding: 1rem;
        }

        .features {
            padding-left: 1rem;
        }

        .button-group {
            flex-direction: column;
        }
    }
</style>
