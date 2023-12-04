<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import { wheel } from './wheel-config';
    import type { WheelTiles } from './types';
    import { drawShape, drawShapeInformation, drawTile, makeWheelTiles, modulo, rotateWheel } from './wheel-service';

    let _p5: p5;
    let wheelTiles: WheelTiles;
    let shapePosition = 0;

    const rotateWheelClockwise = () => {
        rotateWheel(wheel, true);
        wheelTiles = makeWheelTiles(_p5, wheel);
    };
    const rotateWheelCounterClockwise = () => {
        rotateWheel(wheel, false);
        wheelTiles = makeWheelTiles(_p5, wheel);
    };

    const sketch: Sketch = (p5) => {
        function customResizeCanvas() {
            const minDimension = Math.min(p5.windowWidth, p5.windowHeight);
            p5.resizeCanvas(minDimension * 0.8, minDimension * 0.8);
            wheel.scale = (minDimension / 2) * 0.75;
            wheelTiles = makeWheelTiles(p5, wheel);
        }

        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(100, 100);
            customResizeCanvas();
            p5.colorMode(p5.HSB);
        };
        p5.draw = () => {
            p5.background(50);
            p5.translate(p5.width / 2, p5.height / 2);
            wheelTiles.tilesInnerRing.forEach((tile) => drawTile(tile, p5));
            wheelTiles.tilesMiddleRing.forEach((tile) => drawTile(tile, p5));
            wheelTiles.tilesOuterRing.forEach((tile) => drawTile(tile, p5));
            drawShape(
                shapePosition,
                wheelTiles.tilesInnerRing,
                wheelTiles.tilesMiddleRing,
                wheelTiles.tilesOuterRing,
                p5
            );
            drawShapeInformation(shapePosition, wheel, p5);
        };

        p5.keyPressed = () => {
            if (p5.keyCode === p5.LEFT_ARROW) {
                shapePosition = modulo(shapePosition - 1, wheelTiles.tilesInnerRing.length);
            }
            if (p5.keyCode === p5.RIGHT_ARROW) {
                shapePosition = modulo(shapePosition + 1, wheelTiles.tilesInnerRing.length);
            }
            if (p5.keyCode === p5.UP_ARROW) {
                rotateWheelCounterClockwise();
            }
            if (p5.keyCode === p5.DOWN_ARROW) {
                rotateWheelClockwise();
            }
        };

        let swipeBeginX: number;
        p5.touchStarted = (event) => {
            swipeBeginX = p5.mouseX;
        };
        p5.touchEnded = (event) => {
            if (!swipeBeginX) {
                return;
            }
            if (Math.abs(p5.mouseX - swipeBeginX) < 100) {
                return;
            }
            const clockwise = p5.mouseX > swipeBeginX;
            if (clockwise) {
                shapePosition = modulo(shapePosition + 1, wheelTiles.tilesInnerRing.length);
            } else {
                shapePosition = modulo(shapePosition - 1, wheelTiles.tilesInnerRing.length);
            }
        };

        p5.windowResized = () => {
            customResizeCanvas();
        };
    };

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<h3>Chord wheel</h3>

<div class="d-flex justify-content-center">
    <P5 {sketch} />
</div>

<div class="justify-content-center">
    <p>
        <button class="fa fa-undo" on:click={() => shapePosition -= 1}></button>
        Shape rotation
        <button class="fa fa-repeat" on:click={() => shapePosition += 1}></button>
    </p>
    <p>
        <button class="fa fa-undo" on:click={rotateWheelCounterClockwise}></button>
        Wheel rotation
        <button class="fa fa-repeat" on:click={rotateWheelClockwise}></button>
    </p>
    <p>On mobile you can also swipe left and right to rotate the shape</p>
</div>

<div>
    This page is an implementation of <a href="https://chordwheel.com/" target="_blank" rel="noopener noreferrer">Jim Fleser's Chord Wheel</a>
    it is intended for my personal use. If you are using this implementation you should definitely
    <a href="https://chordwheel.com/index.php?option=com_content&view=article&id=16&Itemid=4" target="_blank" rel="noopener noreferrer">buy his book</a> or
    <a href="https://apps.apple.com/us/app/the-chord-wheel/id444931977" target="_blank" rel="noopener noreferrer">buy his app</a> (which is much more complete than this page).
</div>

<div>
    This tool only works for songs in major keys. 
    <ul>
        <li><a href="https://chordwheel.com/index.php?option=com_content&view=article&id=5&Itemid=17" target="_blank" rel="noopener noreferrer">Analyzing songs and compositional styles</a></li>
        <li><a href="https://chordwheel.com/index.php?option=com_content&view=article&id=8:soloing-and-improvisation&catid=8:using-the-chordwheel&Itemid=8" target="_blank" rel="noopener noreferrer">Soloing and improvisation</a></li>
        <li><a href="https://chordwheel.com/index.php?option=com_content&view=article&id=9&Itemid=5" target="_blank" rel="noopener noreferrer">Transpositions</a></li>
    </ul>
</div>

<style>
.justify-content-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
</style>
