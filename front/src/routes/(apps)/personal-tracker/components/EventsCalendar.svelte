<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import {
        eventsStore,
        personalTrackerPassword,
        type PersonalTrackerEvent
    } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // Current month being viewed
    let currentMonth = $state(DateTime.now().startOf('month'));

    // Fetch events on mount if not already cached
    onMount(() => {
        eventsStore.fetch($personalTrackerPassword);
    });

    // Navigate to previous month
    const previousMonth = () => {
        currentMonth = currentMonth.minus({ months: 1 });
    };

    // Navigate to next month
    const nextMonth = () => {
        currentMonth = currentMonth.plus({ months: 1 });
    };

    // Go to current month
    const goToToday = () => {
        currentMonth = DateTime.now().startOf('month');
    };

    // Handle clicking on any day (with or without event)
    const handleDayClick = (timestamp: number) => {
        goto(`/personal-tracker/add/${timestamp}`);
    };

    // Generate calendar days for the current month
    const generateCalendarDays = (month: DateTime, events: PersonalTrackerEvent[]) => {
        const firstDay = month.startOf('month');

        // Get the day of week for the first day (1 = Monday, 7 = Sunday)
        const startDayOfWeek = firstDay.weekday;

        // Calculate how many days from previous month to show
        const daysFromPrevMonth = startDayOfWeek - 1;

        // Calculate total days to display (6 weeks = 42 days)
        const totalDays = 42;

        const days = [];

        // Start from the first day we'll display
        let currentDay = firstDay.minus({ days: daysFromPrevMonth });

        for (let i = 0; i < totalDays; i++) {
            const dayTimestamp = currentDay
                .toUTC()
                .plus({ days: 1 })
                .startOf('day')
                .toUnixInteger();
            const event = events.find((e) => e.eventDateUnix === dayTimestamp);
            const isCurrentMonth = currentDay.month === month.month;
            const isToday = currentDay.hasSame(DateTime.now(), 'day');

            days.push({
                date: currentDay,
                timestamp: dayTimestamp,
                event,
                isCurrentMonth,
                isToday
            });

            currentDay = currentDay.plus({ days: 1 });
        }

        return days;
    };

    // Reactive calendar days
    const calendarDays = $derived(generateCalendarDays(currentMonth, $eventsStore.events));

    // Format month/year for display
    const monthYearDisplay = $derived(currentMonth.toFormat('MMMM yyyy'));
</script>

{#if $eventsStore.loading}
    <p>Loading events</p>
{:else if $eventsStore.error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting events',
            message: $eventsStore.error.message
        }}
    />
{:else}
    <div class="calendar-container">
        <div class="calendar-header">
            <button onclick={previousMonth} class="nav-button">&lt;</button>
            <h3 class="month-year">{monthYearDisplay}</h3>
            <button onclick={nextMonth} class="nav-button">&gt;</button>
            <button onclick={goToToday} class="today-button">Today</button>
        </div>

        <div class="calendar-grid">
            <!-- Day names header -->
            <div class="day-name">Mon</div>
            <div class="day-name">Tue</div>
            <div class="day-name">Wed</div>
            <div class="day-name">Thu</div>
            <div class="day-name">Fri</div>
            <div class="day-name">Sat</div>
            <div class="day-name">Sun</div>

            <!-- Calendar days -->
            {#each calendarDays as day}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                    class="calendar-day"
                    class:other-month={!day.isCurrentMonth}
                    class:has-event={day.event}
                    class:today={day.isToday}
                    onclick={() => handleDayClick(day.timestamp)}
                    role="button"
                    tabindex="0"
                >
                    <div class="day-number">{day.date.day}</div>

                    {#if !day.event}
                        <div class="add-indicator">
                            <span class="plus-sign">+</span>
                        </div>
                    {/if}

                    {#if day.event}
                        <div class="event-indicators">
                            {#if day.event.mood !== undefined}
                                <div class="indicator mood" title="Mood: {day.event.mood}">
                                    {day.event.mood}
                                </div>
                            {/if}
                            {#if day.event.weight !== undefined}
                                <div
                                    class="indicator weight"
                                    title="Weight: {(day.event.weight / 100).toFixed(1)} kg"
                                >
                                    W
                                </div>
                            {/if}
                            {#if day.event.emotionwheel?.emotions}
                                <div
                                    class="indicator emotions"
                                    title="{day.event.emotionwheel.emotions.length} emotions"
                                >
                                    E
                                </div>
                            {/if}
                            {#if day.event.workplace !== undefined}
                                <div
                                    class="indicator workplace"
                                    title="Workplace: {day.event.workplace}"
                                >
                                    {day.event.workplace === 'remote' ? '🏠' : '🏢'}
                                </div>
                            {/if}
                            {#if day.event.energy !== undefined}
                                <div class="indicator energy" title="Energy: {day.event.energy}">
                                    {day.event.energy}
                                </div>
                            {/if}
                            {#if day.event.journal !== undefined}
                                <div class="indicator journal" title="Journal entry">📝</div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="calendar-legend">
            <div class="legend-item">
                <div class="indicator mood">5</div>
                <span>Mood</span>
            </div>
            <div class="legend-item">
                <div class="indicator weight">W</div>
                <span>Weight</span>
            </div>
            <div class="legend-item">
                <div class="indicator emotions">E</div>
                <span>Emotions</span>
            </div>
            <div class="legend-item">
                <div class="indicator workplace">🏠</div>
                <span>Workplace</span>
            </div>
            <div class="legend-item">
                <div class="indicator energy">5</div>
                <span>Energy</span>
            </div>
            <div class="legend-item">
                <div class="indicator journal">📝</div>
                <span>Journal</span>
            </div>
        </div>
    </div>
{/if}

<style>
    .calendar-container {
        padding: 1em;
        max-width: 1200px;
        margin: 0 auto;
    }

    .calendar-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1em;
        margin-bottom: 1em;
    }

    .month-year {
        margin: 0;
        min-width: 200px;
        text-align: center;
    }

    .nav-button {
        padding: 0.5em 1em;
        font-size: 1.2em;
        font-weight: bold;
    }

    .today-button {
        padding: 0.5em 1em;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        background-color: var(--nc-bg-3);
        border: 2px solid var(--nc-bg-3);
    }

    .day-name {
        background-color: var(--nc-bg-2);
        padding: 0.5em;
        text-align: center;
        font-weight: bold;
        font-size: 0.9em;
    }

    .calendar-day {
        background-color: var(--nc-bg-1);
        min-height: 80px;
        padding: 0.5em;
        position: relative;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .calendar-day:hover {
        background-color: var(--nc-bg-2);
    }

    .calendar-day.other-month {
        opacity: 0.4;
    }

    .calendar-day.today {
        border: 2px solid var(--nc-ac-1);
        background-color: var(--nc-bg-2);
    }

    .calendar-day.has-event {
        background-color: var(--nc-bg-2);
        border-left: 3px solid var(--nc-ac-1);
    }

    .calendar-day.has-event:hover {
        background-color: var(--nc-bg-3);
        transform: scale(1.02);
    }

    .day-number {
        font-weight: bold;
        margin-bottom: 0.5em;
    }

    .add-indicator {
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--nc-ac-1);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
    }

    .calendar-day:hover .add-indicator {
        display: flex;
    }

    .plus-sign {
        color: white;
        font-size: 2em;
        font-weight: bold;
        line-height: 1;
    }

    .event-indicators {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        border-radius: 4px;
        font-size: 0.75em;
        font-weight: bold;
        padding: 2px 4px;
    }

    .indicator.mood {
        background-color: #4caf50;
        color: white;
    }

    .indicator.weight {
        background-color: #2196f3;
        color: white;
    }

    .indicator.emotions {
        background-color: #ff9800;
        color: white;
    }

    .indicator.workplace {
        background-color: #9c27b0;
        color: white;
    }

    .indicator.energy {
        background-color: #00bcd4;
        color: white;
    }

    .indicator.journal {
        background-color: #795548;
        color: white;
    }

    .calendar-legend {
        display: flex;
        gap: 1.5em;
        margin-top: 1em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 4px;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .calendar-day {
            min-height: 60px;
            padding: 0.3em;
        }

        .day-number {
            font-size: 0.9em;
        }

        .add-indicator {
            width: 32px;
            height: 32px;
        }

        .plus-sign {
            font-size: 1.5em;
        }

        .indicator {
            min-width: 8px;
            width: 8px;
            height: 8px;
            padding: 0;
            border-radius: 50%;
            font-size: 0;
            overflow: hidden;
        }

        .event-indicators {
            gap: 3px;
        }

        .month-year {
            font-size: 1.2em;
            min-width: 150px;
        }
    }

    @media (max-width: 480px) {
        .calendar-day {
            min-height: 50px;
            padding: 0.2em;
        }

        .day-name {
            font-size: 0.75em;
            padding: 0.3em;
        }

        .add-indicator {
            width: 28px;
            height: 28px;
        }

        .plus-sign {
            font-size: 1.3em;
        }

        .indicator {
            min-width: 18px;
            height: 18px;
            font-size: 0.6em;
        }

        .calendar-legend {
            flex-direction: column;
            gap: 0.5em;
        }
    }
</style>
