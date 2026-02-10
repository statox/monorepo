<script lang="ts">
    import { DateTime, Duration } from 'luxon';
    import { Notice } from '$lib/components/Notice';
    import { getYearlyEphemerides, getMoonPhaseIconURL } from '$lib/HomeTracker';

    const FRENCH_MONTHS = [
        '',
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Aoû',
        'Sep',
        'Oct',
        'Nov',
        'Déc'
    ];

    type SolarEvent =
        | 'Solstice d\u2019été'
        | 'Solstice d\u2019hiver'
        | 'Équinoxe de printemps'
        | 'Équinoxe d\u2019automne';

    interface ProcessedDay {
        date: DateTime;
        sunrisePercent: number;
        sunsetPercent: number;
        sunriseFormatted: string;
        sunsetFormatted: string;
        dayLengthFormatted: string;
        dayLengthMs: number;
        dayLengthDiffNormalized: number;
        dayLengthDiffMs: number;
        dayLengthDiffFormatted: string;
        showMoonIcon: boolean;
        moonIconURL: string;
        moonPhaseFr: string;
        isFirstOfMonth: boolean;
        monthLabel: string;
        isToday: boolean;
        solarEvent: SolarEvent | null;
    }

    const formatDiffMs = (ms: number): string => {
        const sign = ms >= 0 ? '+' : '-';
        const dur = Duration.fromMillis(Math.abs(ms));
        const mins = Math.floor(dur.as('minutes'));
        const secs = Math.floor(dur.as('seconds')) % 60;
        return `${sign}${mins}m${secs.toString().padStart(2, '0')}s`;
    };

    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

    const processEphemerides = (
        rawData: Awaited<ReturnType<typeof getYearlyEphemerides>>
    ): ProcessedDay[] => {
        const maxAbsDiff = rawData.reduce(
            (max, entry) => Math.max(max, Math.abs(entry.ephemeride.sunState.dayLengthDiffMs)),
            1
        );

        const now = DateTime.now();
        let prevMoonPhase: string | undefined;
        let prevMonth: number | undefined;

        const days: ProcessedDay[] = rawData.map((entry) => {
            const date = DateTime.fromMillis(entry.day, { zone: 'Europe/Paris' });
            const { sunState, moonState } = entry.ephemeride;

            const sunrise = DateTime.fromMillis(sunState.sunrise, { zone: 'Europe/Paris' });
            const sunset = DateTime.fromMillis(sunState.sunset, { zone: 'Europe/Paris' });
            const sunriseHours = sunrise.hour + sunrise.minute / 60;
            const sunsetHours = sunset.hour + sunset.minute / 60;
            const sunrisePercent = (sunriseHours / 24) * 100;
            const sunsetPercent = (sunsetHours / 24) * 100;

            const dayLengthDiffNormalized = sunState.dayLengthDiffMs / maxAbsDiff;

            const showMoonIcon =
                prevMoonPhase !== undefined && moonState.moonPhase !== prevMoonPhase;
            let moonIconURL = '';
            try {
                moonIconURL = getMoonPhaseIconURL(
                    moonState.moonPhase as Parameters<typeof getMoonPhaseIconURL>[0]
                );
            } catch {
                // ignore unknown phases
            }
            prevMoonPhase = moonState.moonPhase;

            const currentMonth = date.month;
            const isFirstOfMonth = prevMonth !== undefined && currentMonth !== prevMonth;
            const monthLabel = isFirstOfMonth ? FRENCH_MONTHS[currentMonth] : '';
            prevMonth = currentMonth;

            const isToday = date.hasSame(now, 'day');

            const dayLengthDur = Duration.fromMillis(sunState.dayLengthMs);
            const dayLengthH = Math.floor(dayLengthDur.as('hours'));
            const dayLengthM = Math.floor(dayLengthDur.as('minutes')) % 60;

            return {
                date,
                sunrisePercent,
                sunsetPercent,
                sunriseFormatted: sunrise.toFormat('HH:mm'),
                sunsetFormatted: sunset.toFormat('HH:mm'),
                dayLengthFormatted: `${dayLengthH}h${dayLengthM.toString().padStart(2, '0')}`,
                dayLengthMs: sunState.dayLengthMs,
                dayLengthDiffNormalized,
                dayLengthDiffMs: sunState.dayLengthDiffMs,
                dayLengthDiffFormatted: formatDiffMs(sunState.dayLengthDiffMs),
                showMoonIcon,
                moonIconURL,
                moonPhaseFr: (moonState as { moonPhaseFr?: string }).moonPhaseFr ?? '',
                isFirstOfMonth,
                monthLabel,
                isToday,
                solarEvent: null
            };
        });

        // Detect solstices (dayLengthDiff crosses zero) and equinoxes (dayLength crosses 12h)
        for (let i = 1; i < days.length; i++) {
            const prev = days[i - 1];
            const curr = days[i];

            // Solstice: dayLengthDiffMs sign change
            if (prev.dayLengthDiffMs > 0 && curr.dayLengthDiffMs <= 0) {
                // Days were getting longer, now getting shorter → summer solstice
                curr.solarEvent = 'Solstice d\u2019été';
            } else if (prev.dayLengthDiffMs < 0 && curr.dayLengthDiffMs >= 0) {
                // Days were getting shorter, now getting longer → winter solstice
                curr.solarEvent = 'Solstice d\u2019hiver';
            }

            // Equinox: dayLength crosses 12h
            if (prev.dayLengthMs < TWELVE_HOURS_MS && curr.dayLengthMs >= TWELVE_HOURS_MS) {
                // Crossing 12h upward → spring equinox
                curr.solarEvent = 'Équinoxe de printemps';
            } else if (prev.dayLengthMs > TWELVE_HOURS_MS && curr.dayLengthMs <= TWELVE_HOURS_MS) {
                // Crossing 12h downward → autumn equinox
                curr.solarEvent = 'Équinoxe d\u2019automne';
            }
        }

        return days;
    };

    let hoveredDayTs = $state<number | null>(null);
    let hoveredDay = $state<ProcessedDay | null>(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let tooltipEl = $state<HTMLDivElement | null>(null);

    const isHovered = (day: ProcessedDay) => hoveredDayTs === day.date.toMillis();

    const handleMouseEnter = (day: ProcessedDay, event: MouseEvent) => {
        hoveredDayTs = day.date.toMillis();
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
    {@const days = processEphemerides(rawEphemerides)}
    <h2>Yearly ephemerides</h2>
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
                        {#if day.isToday}
                            <span class="today-marker">▸</span>
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
                                <div class="diff-half left"></div>
                                <div class="diff-half right">
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
                                <div class="diff-half right"></div>
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
            <div class="tooltip-date">
                {hoveredDay.date.toFormat('cccc dd MMMM yyyy', { locale: 'fr' })}
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Lever</span>
                <span>{hoveredDay.sunriseFormatted}</span>
                <span class="tooltip-separator">-</span>
                <span class="tooltip-label">Coucher</span>
                <span>{hoveredDay.sunsetFormatted}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Durée</span>
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
        width: 100%;
        max-width: 700px;
    }

    .time-header {
        display: flex;
        align-items: flex-end;
        margin-bottom: 4px;
        font-size: 10px;
        color: var(--nc-tx-3);

        .label-col {
            width: 40px;
            flex-shrink: 0;
        }

        .bar-col {
            flex: 1;
            position: relative;
            height: 16px;
        }

        .diff-col {
            width: 50px;
            flex-shrink: 0;
        }

        .moon-col {
            width: 20px;
            flex-shrink: 0;
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
        background-color: var(--nc-error);
    }

    .hovered-line {
        background-color: green;
    }

    .solar-event-line {
        background-color: var(--nc-lk-1);
        opacity: 0.6;
        height: 1px;
    }

    .solar-event-label {
        position: absolute;
        right: 4px;
        top: -8px;
        font-size: 9px;
        color: var(--nc-lk-1);
        line-height: 1;
        white-space: nowrap;
        z-index: 4;
    }

    .label-col {
        width: 40px;
        flex-shrink: 0;
        position: relative;
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

    .today-marker {
        position: absolute;
        right: 2px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: var(--nc-lk-1);
        line-height: 1;
    }

    .bar-col {
        flex: 1;
        display: flex;
        height: 100%;
        position: relative;
    }

    .month-tick {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 0;
        border-top: 1px solid var(--nc-tx-3);
        opacity: 0.3;
        z-index: 1;
        pointer-events: none;
    }

    .night-segment {
        height: 100%;
        background-color: var(--nc-bg-2);
    }

    .day-segment {
        height: 100%;
        background-color: var(--nc-lk-2);
    }

    .diff-col {
        width: 50px;
        flex-shrink: 0;
        height: 100%;
        padding-left: 4px;
    }

    .diff-bar {
        display: flex;
        height: 100%;
        width: 100%;
    }

    .diff-half {
        width: 50%;
        height: 100%;
        position: relative;

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

    .moon-col {
        width: 20px;
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .moon-icon {
        width: 14px;
        height: 14px;
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

    .tooltip-label {
        color: var(--nc-tx-3);
    }

    .tooltip-separator {
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
        .label-col {
            width: 30px;
        }

        .month-label {
            font-size: 8px;
        }

        .today-marker {
            font-size: 8px;
        }

        .solar-event-label {
            font-size: 7px;
        }

        .diff-col {
            width: 30px;
        }

        .moon-col {
            width: 16px;
        }

        .moon-icon {
            width: 12px;
            height: 12px;
        }

        .time-header {
            font-size: 8px;

            .label-col {
                width: 30px;
            }

            .diff-col {
                width: 30px;
            }

            .moon-col {
                width: 16px;
            }
        }
    }
</style>
