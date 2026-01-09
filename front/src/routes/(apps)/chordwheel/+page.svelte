<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import InfoModal from './components/InfoModal.svelte';
    import { wheel } from '$lib/ChordWheel/wheel-config';
    import type { WheelTiles } from '$lib/ChordWheel/types';
    import {
        drawShape,
        drawShapeInformation,
        drawTile,
        makeWheelTiles,
        rotateWheel
    } from '$lib/ChordWheel/wheel-service';
    import { pageMetadataStore } from '$lib/components/Header';

    pageMetadataStore.set({
        name: 'Chord Wheel',
        description: 'Find chords in a scale',
        iconPath: '/chord_wheel.png'
    });

    let _p5: p5;
    let wheelTiles: WheelTiles;
    let shapePosition = $state(0);
    let rotationProgress = $state(0);
    let rotationInterval: ReturnType<typeof setInterval> | undefined = $state();

    const triggerRotation = (clockwise: boolean) => {
        if (rotationInterval) {
            return;
        }

        rotationInterval = setInterval(() => {
            if (rotationProgress >= 1 || rotationProgress <= -1) {
                rotateWheel(wheel, clockwise);
                rotationProgress = 0;
                clearInterval(rotationInterval);
                rotationInterval = undefined;
                return;
            }

            rotationProgress += clockwise ? 0.05 : -0.05;
        }, 1);
    };
    const rotateWheelClockwise = () => {
        triggerRotation(true);
    };
    const rotateWheelCounterClockwise = () => {
        triggerRotation(false);
    };

    const sketch: Sketch = (p5) => {
        function customResizeCanvas() {
            const minDimension = Math.max(Math.min(p5.windowWidth, p5.windowHeight), 560);

            p5.resizeCanvas(minDimension * 0.8, minDimension * 0.8);
            wheel.scale = (minDimension / 2) * 0.75;
            wheelTiles = makeWheelTiles(p5, wheel, 0);
        }

        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(100, 100);
            customResizeCanvas();
            p5.colorMode(p5.HSB);
        };
        p5.draw = () => {
            wheelTiles = makeWheelTiles(_p5, wheel, rotationProgress);

            p5.translate(p5.width / 2, p5.height / 2);
            const bodyStyle = getComputedStyle(document.body);
            const backgroundColor = bodyStyle.getPropertyValue('--nc-bg-1');
            const backgroundCircleColor = bodyStyle.getPropertyValue('--nc-bg-2');
            p5.background(backgroundColor);
            p5.fill(backgroundCircleColor);
            p5.circle(0, 0, p5.width);
            wheelTiles.tilesInnerRing.forEach((tile) => drawTile(p5, tile));
            wheelTiles.tilesMiddleRing.forEach((tile) => drawTile(p5, tile));
            wheelTiles.tilesOuterRing.forEach((tile) => drawTile(p5, tile));
            drawShape(
                p5,
                shapePosition,
                wheelTiles.tilesInnerRing,
                wheelTiles.tilesMiddleRing,
                wheelTiles.tilesOuterRing
            );
            drawShapeInformation(p5, shapePosition, wheel);
        };

        p5.keyPressed = (e: KeyboardEvent) => {
            const validEvents: string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
            if (!validEvents.includes(p5.key)) {
                return;
            }
            e.preventDefault();

            if (p5.key === 'ArrowLeft') {
                shapePosition--;
            }
            if (p5.key === 'ArrowRight') {
                shapePosition++;
            }
            if (p5.key === 'ArrowUp') {
                rotateWheelCounterClockwise();
            }
            if (p5.key === 'ArrowDown') {
                rotateWheelClockwise();
            }
        };

        let swipeStartPosition: {
            x: number;
            y: number;
        };
        p5.mouseDragged = (e: MouseEvent) => {
            // TODO fix typing
            // @ts-expect-error property className doesn't exists on EventTarget
            if (e.target?.className !== 'p5Canvas') {
                return;
            }
            e.preventDefault();
            if (!swipeStartPosition) {
                swipeStartPosition = {
                    x: p5.mouseX,
                    y: p5.mouseY
                };
                return;
            }
            const swipeX = p5.mouseX - swipeStartPosition.x;
            const swipeY = p5.mouseY - swipeStartPosition.y;
            const absSwipeX = Math.abs(swipeX);
            const absSwipeY = Math.abs(swipeY);

            if (absSwipeX < 50 && absSwipeY < 50) {
                return;
            }

            if (absSwipeX > absSwipeY) {
                const clockwise = swipeX < 0;
                if (clockwise) {
                    shapePosition--;
                } else {
                    shapePosition++;
                }
            } else {
                const clockwise = swipeY > 0;
                if (clockwise) {
                    rotateWheelClockwise();
                } else {
                    rotateWheelCounterClockwise();
                }
            }

            // Reset start position so that next touchMoved event has
            // the right info eventhough touchStarted isn't triggered again
            swipeStartPosition = {
                x: p5.mouseX,
                y: p5.mouseY
            };
        };

        p5.windowResized = () => {
            customResizeCanvas();
        };
    };

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<div class="d-flex justify-content-center">
    <P5 {sketch} />
</div>

<div class="justify-content-center">
    <p>
        <button
            aria-label="rotate shape counter clockwise"
            class="fa fa-undo"
            onclick={() => (shapePosition -= 1)}
        ></button>
        Shape rotation
        <button
            aria-label="rotate shape clockwise"
            class="fa fa-repeat"
            onclick={() => (shapePosition += 1)}
        ></button>
    </p>
    <p>
        <button
            aria-label="rotate wheel counter clockwise"
            class="fa fa-undo"
            onclick={rotateWheelCounterClockwise}
        ></button>
        Wheel rotation
        <button
            aria-label="rotate wheel clockwise"
            class="fa fa-repeat"
            onclick={rotateWheelClockwise}
        ></button>
    </p>
    <p>
        On mobile swipe left/right to rotate the shape and up/down to rotate the wheel. On the
        browser you can drag the mouse left/right and up/down.
    </p>
    <InfoModal />
</div>

<style>
    .justify-content-center {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>
