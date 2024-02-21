<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { onMount } from 'svelte';

    let video, photo;
    const takePicture = () => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('canvas not available');
        }
        const context = canvas.getContext('2d');
        video = document.getElementById('video') as HTMLVideoElement;
        photo = document.getElementById('photo');

        if (!context) {
            throw new Error('no context available');
        }
        if (!photo || !video) {
            throw new Error('no photo or video available');
        }

        // Draw the current frame from the video stream to the canvas
        context.drawImage(
            video,
            0,
            0,
            video.videoWidth,
            video.videoHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Convert the canvas content to a data URL
        var dataUrl = canvas.toDataURL('image/png');

        // Set the captured image source to the data URL
        photo.setAttribute('src', dataUrl);
    };

    let hideVideoSrc = true;
    const toggleHideVideoSrc = () => (hideVideoSrc = !hideVideoSrc);

    onMount(() => {
        // Request access to the user's camera
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' } })
            .then(function (stream) {
                video = document.getElementById('video') as HTMLVideoElement;
                video.srcObject = stream;
            })
            .catch(function (error) {
                console.error('Error accessing media devices.', error);
            });
    });
</script>

<HeadIOS title="Pot" description="A WIP honey pot" iconPath="/pot.png" />

<!-- svelte-ignore a11y-media-has-caption -->
<video class:hidden={hideVideoSrc} id="video" autoplay playsinline></video>

<button on:click={toggleHideVideoSrc}>{hideVideoSrc ? 'show src' : 'hide src'}</button>
<button id="capture" on:click={takePicture}>Capture</button>

<canvas id="canvas" style="display:none;"></canvas>
<img alt="The captured camera" />

<style>
    .hidden {
        display: none;
    }
</style>
