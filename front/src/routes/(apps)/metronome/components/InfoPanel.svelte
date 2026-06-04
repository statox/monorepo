<div role="dialog" class="container">
    <div>
        This is a simple metronome:
        <ul>
            <li>Use the play/pause button or the space bar to start and stop the metronome</li>
            <li>You can change the tempo by:</li>
            <ul>
                <li>Entering a number directly in the input</li>
                <li>Using the -5, -1, +1 and +5 buttons</li>
                <li>
                    Taping a tempo on the tap button. When taping the tempo each tap counts for a
                    subdivision if subdivisions are enabled. Stop taping for approx. 3 seconds to
                    restart the tap counter.
                </li>
            </ul>
            <li>
                The "Beats in bar" setting change the number of beats counted by the metronome. The
                first beat is accented with a higher frequency tone.
            </li>
            <li>
                The "Subdivisions in beat" setting allow to change how the beats are divided. The
                subdivisions after the first one are played with a lower frequency tone.
            </li>
            <li>The visualization at the bottom follow the beats and their subdivisions.</li>
        </ul>
    </div>

    <br />
    <h5>Bugs</h5>
    <ul>
        <li>
            While it goes against my opinion on what the web should look like, this page works
            better with Chrome-based browsers.
        </li>
        <li>
            For some reason the display of the tempo settings is broken on Firefox, the input
            doesn't resize properly.
        </li>
        <li>The sound doesn't work on Safari on iOS (and maybe on MacOS too).</li>
    </ul>
</div>

<style>
    .container {
        width: 600px;
    }
</style>
