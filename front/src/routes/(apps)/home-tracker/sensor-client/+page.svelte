<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import {
        FormGrid,
        FormSubmitButton,
        handleFormError,
        showSuccessToast
    } from '$lib/components/FormLayout';
    import { uploadSensorData } from '$lib/HomeTracker';

    const pageMetadata = {
        name: 'Sensor Client',
        description: 'Manually call the HomeTracker upload API',
        iconPath: '/hometracker.png',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);

    let apiKey = $state('foo-key');
    let hostname = $state('http://localhost:3000');

    let sensorName = $state('dev');
    let tempCelsius: number | undefined = $state(20.3);
    let humidity: number | undefined = $state(50.5);
    let pressurePa: number | undefined = $state(1019);
    let internalTempCelsius: number | undefined = $state(20.1);
    let internalHumidity: number | undefined = $state(48.3);
    let batteryCharge: number | undefined = $state(2.12);
    let batteryPercent: number | undefined = $state(60);
    let timeToSendMs: number | undefined = $state(1203);
    let detectedLowBattery = $state(false);
    let detectedForcedReset = $state(false);
    let detectedInternalSensorFailure = $state(false);
    let detectedSensorFailure = $state(false);

    let uploading = $state(false);

    const upload = async () => {
        try {
            uploading = true;
            const { instructSleepSec } = await uploadSensorData(
                { apiKey, hostname },
                {
                    sensorName,
                    tempCelsius,
                    humidity,
                    pressurePa,
                    internalTempCelsius,
                    internalHumidity,
                    batteryCharge,
                    batteryPercent,
                    timeToSendMs,
                    detectedLowBattery,
                    detectedForcedReset,
                    detectedInternalSensorFailure,
                    detectedSensorFailure
                }
            );
            showSuccessToast(`Uploaded, instructed sleep time: ${instructSleepSec}s`);
        } catch (error) {
            handleFormError(error, 'uploaded');
        } finally {
            uploading = false;
        }
    };
</script>

<div class="container">
    <h2>Sensor client</h2>

    <FormGrid onsubmit={() => upload()}>
        <label for="hostname">API hostname</label>
        <input
            id="hostname"
            type="text"
            bind:value={hostname}
            placeholder="https://api.example.com"
        />

        <label for="api-key">API key</label>
        <input id="api-key" type="text" bind:value={apiKey} />

        <label for="sensor-name">Sensor name</label>
        <input id="sensor-name" type="text" bind:value={sensorName} />

        <label for="temp-celsius">Temperature (C)</label>
        <input id="temp-celsius" type="number" step="any" bind:value={tempCelsius} />

        <label for="humidity">Humidity (%)</label>
        <input id="humidity" type="number" step="any" bind:value={humidity} />

        <label for="pressure-pa">Pressure (Pa)</label>
        <input id="pressure-pa" type="number" step="any" bind:value={pressurePa} />

        <label for="internal-temp-celsius">Internal temperature (C)</label>
        <input
            id="internal-temp-celsius"
            type="number"
            step="any"
            bind:value={internalTempCelsius}
        />

        <label for="internal-humidity">Internal humidity (%)</label>
        <input id="internal-humidity" type="number" step="any" bind:value={internalHumidity} />

        <label for="battery-charge">Battery charge (V)</label>
        <input id="battery-charge" type="number" step="any" bind:value={batteryCharge} />

        <label for="battery-percent">Battery (%)</label>
        <input id="battery-percent" type="number" step="any" bind:value={batteryPercent} />

        <label for="time-to-send-ms">Time to send (ms)</label>
        <input id="time-to-send-ms" type="number" step="any" bind:value={timeToSendMs} />

        <label for="detected-low-battery">Detected low battery</label>
        <input id="detected-low-battery" type="checkbox" bind:checked={detectedLowBattery} />

        <label for="detected-forced-reset">Detected forced reset</label>
        <input id="detected-forced-reset" type="checkbox" bind:checked={detectedForcedReset} />

        <label for="detected-internal-sensor-failure">Detected internal sensor failure</label>
        <input
            id="detected-internal-sensor-failure"
            type="checkbox"
            bind:checked={detectedInternalSensorFailure}
        />

        <label for="detected-sensor-failure">Detected sensor failure</label>
        <input id="detected-sensor-failure" type="checkbox" bind:checked={detectedSensorFailure} />

        <FormSubmitButton loading={uploading} label="Upload" />
    </FormGrid>
</div>

<style>
    .container {
        min-width: 240px;
        max-width: 600px;
        margin: 0 auto;
        padding: 16px;
        background: var(--nc-bg-1);
        border-radius: 26px;
    }
</style>
