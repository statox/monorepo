<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: 'remote' | 'on site';
    }

    let { value = $bindable('remote') }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    const workplaceOptions: Array<{ value: 'remote' | 'on site'; emoji: string; label: string }> = [
        { value: 'remote', emoji: '🏠', label: 'Remote' },
        { value: 'on site', emoji: '🏢', label: 'On Site' }
    ];

    const getWorkplaceColor = (workplace: 'remote' | 'on site') => {
        return workplace === 'remote' ? '#4caf50' : '#2196f3';
    };
</script>

<div class="workplace-form">
    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="current-workplace">
        <div class="workplace-display">
            <span class="workplace-emoji">{workplaceOptions.find(opt => opt.value === value)?.emoji}</span>
            <span class="workplace-label">{workplaceOptions.find(opt => opt.value === value)?.label}</span>
        </div>
    </div>

    <div class="workplace-buttons">
        {#each workplaceOptions as option}
            <button
                class="workplace-button"
                class:selected={value === option.value}
                onclick={() => (value = option.value)}
                style="--workplace-color: {getWorkplaceColor(option.value)}"
                title={option.label}
            >
                <span class="emoji">{option.emoji}</span>
                <span class="label">{option.label}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .workplace-form {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .current-workplace {
        text-align: center;
    }

    .workplace-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .workplace-emoji {
        font-size: 3em;
        line-height: 1;
    }

    .workplace-label {
        font-size: 1.2em;
        font-weight: bold;
        opacity: 0.9;
    }

    .workplace-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1em;
        padding: 0 0.5em;
    }

    .workplace-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        padding: 1.5em 1em;
        border: 2px solid var(--nc-bg-3);
        border-radius: 8px;
        background-color: var(--nc-bg-1);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .workplace-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--workplace-color);
    }

    .workplace-button.selected {
        background-color: var(--workplace-color);
        border-color: var(--workplace-color);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .workplace-button .emoji {
        font-size: 2.5em;
        line-height: 1;
    }

    .workplace-button .label {
        font-size: 1.1em;
        font-weight: bold;
    }

    .workplace-button.selected .label {
        color: white;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .workplace-emoji {
            font-size: 2.5em;
        }

        .workplace-buttons {
            gap: 0.75em;
        }

        .workplace-button {
            padding: 1.25em 0.75em;
        }

        .workplace-button .emoji {
            font-size: 2em;
        }

        .workplace-button .label {
            font-size: 1em;
        }
    }

    @media (max-width: 480px) {
        .workplace-emoji {
            font-size: 2em;
        }

        .workplace-buttons {
            gap: 0.5em;
        }

        .workplace-button {
            padding: 1em 0.5em;
        }

        .workplace-button .emoji {
            font-size: 1.75em;
        }

        .workplace-button .label {
            font-size: 0.9em;
        }
    }
</style>
