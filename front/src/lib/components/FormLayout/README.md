# FormLayout Components

A collection of reusable form components that provide consistent styling, layout, and behavior across all forms in the application.

## Components

### FormLayout

A wrapper component that provides the standard form page structure.

**Features:**

- Title bar with back button
- AuthGuard integration
- Notice messages display
- Consistent styling (padding, background, border-radius)

**Props:**

- `title: string` - The form page title
- `backUrl: string` - URL to navigate to when clicking the back button
- `authMessage?: string` - Message shown when user is not authenticated (default: "Login to add an entry")
- `noticeMessages?: NoticeItem[]` - Array of notice/error messages to display
- `children: Snippet` - Form content

**Example:**

```svelte
<FormLayout
    title="Add a new item"
    backUrl="/items"
    authMessage="Login to add an item"
    {noticeMessages}
>
    <!-- Form content here -->
</FormLayout>
```

### FormGrid

A grid container for form fields with responsive behavior.

**Features:**

- Two-column grid layout (label on left, input on right)
- Automatic mobile responsive (single column on screens ≤ 600px)
- Consistent row gap spacing

**Props:**

- `children: Snippet` - Form fields

**Example:**

```svelte
<FormGrid>
    <label for="name">Name</label>
    <input type="text" bind:value={name} />

    <label for="email">Email</label>
    <input type="email" bind:value={email} />
</FormGrid>
```

**Responsive Behavior:**

- **Desktop (> 600px):** Two columns with labels on the left, inputs on the right
- **Mobile (≤ 600px):** Single column with labels appearing above inputs

### FormSubmitButton

A standardized submit button with loading state.

**Features:**

- Built-in loading spinner
- Disabled state handling
- Fixed width (doesn't stretch to fill grid)
- Left-aligned in grid
- Consistent spacing above button

**Props:**

- `onclick: () => void | Promise<void>` - Submit handler function
- `loading?: boolean` - Show loading spinner (default: false)
- `disabled?: boolean` - Disable button (default: false)
- `label?: string` - Button text (default: "Submit")
- `spanTwoColumns?: boolean` - Span full grid width (default: true)

**Example:**

```svelte
<FormSubmitButton onclick={handleSubmit} loading={uploading} label="Create Item" />
```

### FormFileInput

A file input with a built-in clear button.

**Features:**

- File input field
- Clear button to reset the file selection
- Consistent styling
- Flex layout with proper spacing

**Props:**

- `files?: FileList` - Bindable FileList for the selected files

**Example:**

```svelte
<script>
    let files: FileList | undefined = $state();

    const upload = async () => {
        let file: File | undefined;
        if (files && files.length) {
            file = files[0];
        }
        if (!file) {
            // Handle no file selected
            return;
        }
        // Upload the file
    };
</script>

<label for="file">File</label>
<FormFileInput bind:files />
```

### Error Handler Utilities

Helper functions for consistent error and success messaging.

**Functions:**

#### `handleFormError(error: unknown, action?: string)`

Displays an error toast with standardized formatting.

- Handles `ApiError` (401 → "Invalid logged in user")
- Handles `UserLoggedOutError` → "User is logged out"
- Falls back to error message for other errors
- `action`: defaults to "created", used in message: "Entry not {action}"

**Example:**

```svelte
try {
    await createItem(data);
} catch (error) {
    handleFormError(error, 'created');
}
```

#### `showSuccessToast(message: string)`

Displays a success toast with a checkmark icon.

**Example:**

```svelte
showSuccessToast('Item created successfully');
```

## Complete Form Example

Here's a complete example of a form using all components:

```svelte
<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        handleFormError,
        showSuccessToast
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { createItem } from '$lib/api';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();

    let name: string = $state('');
    let description: string = $state('');
    let uploading = $state(false);
    let noticeMessages: NoticeItem[] = $state([]);

    const handleSubmit = async () => {
        // Clear previous messages
        noticeMessages = [];

        // Validation
        if (!name) {
            noticeMessages.push({ level: 'error', header: 'Name must be defined' });
        }
        if (!description) {
            noticeMessages.push({ level: 'error', header: 'Description must be defined' });
        }

        if (noticeMessages.length) return;

        // Submit
        try {
            uploading = true;
            await createItem({ name, description });
            showSuccessToast('Item created successfully');
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout
    title="Add a new item"
    backUrl="/items"
    authMessage="Login to add an item"
    {noticeMessages}
>
    <FormGrid>
        <label for="name">Name</label>
        <input type="text" bind:value={name} />

        <label for="description">Description</label>
        <textarea bind:value={description} rows="5"></textarea>

        <FormSubmitButton onclick={handleSubmit} loading={uploading} />
    </FormGrid>
</FormLayout>
```

## Responsive Behavior

All forms automatically adapt to different screen sizes:

**Desktop (> 600px):**

- Labels and inputs side-by-side in 2-column grid
- Submit button has fixed width, left-aligned

**Mobile (≤ 600px):**

- Labels above inputs in single-column layout
- Submit button maintains same fixed width
- All spacing and padding adjusted for mobile

## Adding Custom Styles

If you need form-specific styles, add them in your form component:

```svelte
<FormLayout title="..." backUrl="..." {noticeMessages}>
    <FormGrid>
        <!-- ... -->
        <input class="custom-input" type="text" bind:value={name} />
    </FormGrid>
</FormLayout>

<style>
    .custom-input {
        /* Your custom styles here */
    }
</style>
```
