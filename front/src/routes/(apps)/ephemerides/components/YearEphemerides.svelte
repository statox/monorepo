<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import ButtonSwitch from '$lib/components/ButtonSwitch/Main.svelte';
    import { getYearlyEphemerides, processYearlyEphemerides } from '$lib/HomeTracker';
    import type { YearlyEphemerisDay } from '$lib/HomeTracker';

    // TODO Rework ButtonSwitch to avoid this weird mechanic
    let utcDisplay: 'UTC' | 'Europe/Paris' = $state('UTC');

    let hoveredDayTs = $state<number | null>(null);
    let hoveredDay = $state<YearlyEphemerisDay | null>(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let tooltipEl = $state<HTMLDivElement | null>(null);

    const isHovered = (day: YearlyEphemerisDay) => hoveredDayTs === day.dateMs;

    const handleMouseEnter = (day: YearlyEphemerisDay, event: MouseEvent) => {
        hoveredDayTs = day.dateMs;
        hoveredDay = day;
        updateTooltipPosition(event);
    };

    const handleMouseMove = (event: MouseEvent) => {
        updateTooltipPosition(event);
    };

    const handleMouseLeave = () => {
        hoveredDayTs = null;
        hoveredDay = null;
    };

    const updateTooltipPosition = (event: MouseEvent) => {
        const margin = 12;
        let x = event.clientX + margin;
        let y = event.clientY - 10;

        if (tooltipEl) {
            const rect = tooltipEl.getBoundingClientRect();
            if (y + rect.height > window.innerHeight - margin) {
                y = window.innerHeight - rect.height - margin;
            }
            if (x + rect.width > window.innerWidth - margin) {
                x = event.clientX - rect.width - margin;
            }
        }

        tooltipX = x;
        tooltipY = y;
    };
</script>

{#await getYearlyEphemerides() then rawEphemerides}
    {@const days = processYearlyEphemerides(rawEphemerides, utcDisplay)}
    <h2>Yearly ephemerides</h2>
    <ButtonSwitch
        bind:value={utcDisplay}
        label="Display mode"
        design="multi"
        options={['UTC', 'Europe/Paris']}
    />

    <div class="container">
        <div class="year-chart">
            <div class="time-header">
                <div class="label-col"></div>
                <div class="bar-col">
                    <span class="tick" style="left: 0%">0h</span>
                    <span class="tick" style="left: 25%">6h</span>
                    <span class="tick" style="left: 50%">12h</span>
                    <span class="tick" style="left: 75%">18h</span>
                    <span class="tick" style="left: 100%">24h</span>
                </div>
                <div class="diff-col"></div>
                <div class="moon-col"></div>
            </div>

            {#each days as day}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="day-row"
                    class:today={day.isToday}
                    class:hovered={isHovered(day)}
                    onmouseenter={(e) => handleMouseEnter(day, e)}
                    onmousemove={handleMouseMove}
                    onmouseleave={handleMouseLeave}
                >
                    {#if day.solarEvent}
                        <div class="highlight-line solar-event-line"></div>
                    {/if}
                    {#if day.isToday}
                        <div class="highlight-line today-line"></div>
                    {/if}
                    {#if isHovered(day)}
                        <div class="highlight-line hovered-line"></div>
                    {/if}

                    <div class="label-col">
                        {#if day.solarEvent}
                            <span class="solar-event-label">{day.solarEvent}</span>
                        {/if}
                        {#if day.isFirstOfMonth}
                            <span class="month-label">{day.monthLabel}</span>
                        {/if}
                    </div>

                    <div class="bar-col">
                        {#if day.isFirstOfMonth}
                            <div class="month-tick"></div>
                        {/if}
                        <div class="night-segment" style="width: {day.sunrisePercent}%"></div>
                        <div
                            class="day-segment"
                            style="width: {day.sunsetPercent - day.sunrisePercent}%"
                        ></div>
                        <div class="night-segment" style="width: {100 - day.sunsetPercent}%"></div>
                    </div>

                    <div class="diff-col">
                        <div class="diff-bar">
                            {#if day.dayLengthDiffMs >= 0}
                                <div class="diff-half"></div>
                                <div class="diff-half">
                                    <div
                                        class="diff-fill positive"
                                        style="width: {Math.abs(day.dayLengthDiffNormalized) *
                                            100}%"
                                    ></div>
                                </div>
                            {:else}
                                <div class="diff-half left">
                                    <div
                                        class="diff-fill negative"
                                        style="width: {Math.abs(day.dayLengthDiffNormalized) *
                                            100}%"
                                    ></div>
                                </div>
                                <div class="diff-half"></div>
                            {/if}
                        </div>
                    </div>

                    <div class="moon-col">
                        {#if day.showMoonIcon && day.moonIconURL}
                            <img class="moon-icon" src={day.moonIconURL} alt="moon phase" />
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    {#if hoveredDay}
        <div class="tooltip" bind:this={tooltipEl} style="left: {tooltipX}px; top: {tooltipY}px;">
            <div class="tooltip-date">{hoveredDay.dateFormatted}</div>
            <div class="tooltip-row">
                <span class="tooltip-muted">Lever</span>
                <span>{hoveredDay.sunriseFormatted}</span>
                <span class="tooltip-muted">-</span>
                <span class="tooltip-muted">Coucher</span>
                <span>{hoveredDay.sunsetFormatted}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-muted">Dur&#233;e</span>
                <span>{hoveredDay.dayLengthFormatted}</span>
                <span
                    class="tooltip-diff"
                    class:positive={hoveredDay.dayLengthDiffMs >= 0}
                    class:negative={hoveredDay.dayLengthDiffMs < 0}
                >
                    ({hoveredDay.dayLengthDiffFormatted})
                </span>
            </div>
            {#if hoveredDay.moonIconURL}
                <div class="tooltip-moon">
                    <img src={hoveredDay.moonIconURL} alt="moon phase" />
                    <span>{hoveredDay.moonPhaseFr}</span>
                </div>
            {/if}
        </div>
    {/if}
{:catch error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting ephemerides data',
            message: error
        }}
    />
{/await}

<style>
    .container {
        display: flex;
        align-items: center;
    }

    .year-chart {
        --label-w: 40px;
        --diff-w: 50px;
        --moon-w: 20px;
        --moon-icon-size: 14px;

        width: 100%;
        max-width: 700px;
    }

    /* Column widths shared between header and rows */
    .label-col {
        width: var(--label-w);
        flex-shrink: 0;
        position: relative;
    }

    .diff-col {
        width: var(--diff-w);
        flex-shrink: 0;
        height: 100%;
        padding-left: 4px;
    }

    .moon-col {
        width: var(--moon-w);
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bar-col {
        flex: 1;
        display: flex;
        height: 100%;
        position: relative;
    }

    /* Time header */
    .time-header {
        display: flex;
        align-items: flex-end;
        margin-bottom: 4px;
        font-size: 10px;
        color: var(--nc-tx-3);

        .bar-col {
            height: 16px;
        }

        .tick {
            position: absolute;
            bottom: 0;
            transform: translateX(-50%);

            &:first-child {
                transform: translateX(0);
            }

            &:last-child {
                transform: translateX(-100%);
            }
        }
    }

    /* Day rows */
    .day-row {
        display: flex;
        align-items: center;
        height: 2px;
        position: relative;
        cursor: pointer;

        &.today {
            z-index: 1;
        }

        &.hovered {
            z-index: 2;
        }
    }

    .highlight-line {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 3px;
        pointer-events: none;
        z-index: 3;
    }

    .today-line {
        background-color: #1690f4;
    }

    .hovered-line {
        background-color: #5a90bc;
    }

    .solar-event-line {
        background-color: #c97097;
        opacity: 0.6;
        height: 1px;
    }

    .solar-event-label {
        position: absolute;
        left: 50px;
        top: -15px;
        font-size: 11px;
        color: #c97097;
        line-height: 1;
        white-space: nowrap;
        z-index: 4;
    }

    .month-label {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: var(--nc-tx-2);
        line-height: 1;
        white-space: nowrap;
    }

    .month-tick {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        border-top: 1px solid var(--nc-tx-3);
        opacity: 0.3;
        z-index: 1;
        pointer-events: none;
    }

    .night-segment {
        height: 100%;
        background-color: #323575;
    }

    .day-segment {
        height: 100%;
        background-color: #d6cf13;
    }

    /* Diff column */
    .diff-bar {
        display: flex;
        height: 100%;
        width: 100%;
    }

    .diff-half {
        width: 50%;
        height: 100%;

        &.left {
            display: flex;
            justify-content: flex-end;
        }
    }

    .diff-fill {
        height: 100%;

        &.positive {
            background-color: var(--nc-success);
        }

        &.negative {
            background-color: var(--nc-error);
        }
    }

    /* Moon icons */
    .moon-icon {
        width: var(--moon-icon-size);
        height: var(--moon-icon-size);
        position: absolute;
        display: inline;
        margin: 0;
    }

    /* Tooltip */
    .tooltip {
        position: fixed;
        z-index: 100;
        background: var(--nc-bg-1);
        border: 1px solid var(--nc-tx-3);
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        color: var(--nc-tx-1);
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .tooltip-date {
        font-weight: bold;
        margin-bottom: 4px;
        text-transform: capitalize;
    }

    .tooltip-row {
        display: flex;
        gap: 6px;
        line-height: 1.6;
    }

    .tooltip-muted {
        color: var(--nc-tx-3);
    }

    .tooltip-diff {
        &.positive {
            color: var(--nc-success);
        }

        &.negative {
            color: var(--nc-error);
        }
    }

    .tooltip-moon {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid var(--nc-bg-3);

        img {
            width: 32px;
            height: 32px;
            display: inline;
            margin: 0;
        }

        span {
            color: var(--nc-tx-2);
        }
    }

    @media (max-width: 600px) {
        .year-chart {
            --label-w: 30px;
            --diff-w: 30px;
            --moon-w: 16px;
            --moon-icon-size: 12px;
        }

        .month-label,
        .today-marker {
            font-size: 8px;
        }

        .solar-event-label {
            font-size: 7px;
        }

        .time-header {
            font-size: 8px;
        }
    }
</style>
