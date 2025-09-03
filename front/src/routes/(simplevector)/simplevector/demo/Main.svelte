<script lang="ts">
    import { Vector } from 'simple-vector';
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5;

    let a = $state(new Vector(200, 0));
    let b = $state(new Vector(-100, 0));
    let aMixB = $derived(a.clone().resize(-a.length() / 3));
    let mouse = $state(new Vector(0, 0));

    const sketch1: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(500, 500);
            p5.strokeWeight(5);
        };

        p5.keyPressed = (event) => console.log(event);

        p5.draw = () => {
            p5.background(100);

            if (p5.keyIsDown(32)) {
                b = b.clone().rotateTowardsDeg(a, 1);
            }

            p5.stroke('green');
            p5.strokeWeight(15);
            p5.line(p5.width / 2, p5.height / 2, p5.width / 2 + a.x, p5.height / 2 + a.y);

            p5.stroke('red');
            p5.strokeWeight(5);
            p5.line(p5.width / 2, p5.height / 2, p5.width / 2 + b.x, p5.height / 2 + b.y);

            // p5.stroke('blue');
            // p5.line(p5.width / 2, p5.height / 2, p5.width / 2 + aMixB.x, p5.height / 2 + aMixB.y);

            mouse = new Vector(p5.mouseX - p5.width / 2, p5.mouseY - p5.height / 2);
            if (p5.mouseIsPressed) {
                const distA = a.distance(mouse);
                const distB = b.distance(mouse);
                if (a.distance(mouse) < 80 && distA < distB) {
                    a = mouse.clone();
                } else if (b.distance(mouse) < 80 && distB < distA) {
                    b = mouse.clone();
                }
            }
        };
    };

    onDestroy(() => {
        console.clear();
        _p5?.remove();
    });
</script>

<div class="container">
    <div>
        <P5 sketch={sketch1} />

        <div>mouse: {mouse.toString()}</div>
        <div style="color: green">a: {a.toString()}</div>
        <div style="color: red">b: {b.toString()}</div>
        <div style="color: blue">aMixB: {aMixB.toString()}</div>
    </div>

    <div class="measures">
        <div>Name</div>
        <div>Value</div>

        <div>a.dot(b)</div>
        <div>{a.dot(b)}</div>
        <div>b.dot(a)</div>
        <div>{b.dot(a)}</div>
        <div>a.cross(b)</div>
        <div>{a.cross(b)}</div>
        <div>b.cross(a)</div>
        <div>{b.cross(a)}</div>

        <div>a.angleDeg()</div>
        <div>{a.angleDeg()}</div>
        <div>a.verticalAngleDeg()</div>
        <div>{a.verticalAngleDeg()}</div>

        <div>b.angleDeg()</div>
        <div>{b.angleDeg()}</div>
        <div>b.verticalAngleDeg()</div>
        <div>{b.verticalAngleDeg()}</div>

        <div>a.angleDegWith(b)</div>
        <div>{a.angleDegWith(b)}</div>
        <div>b.angleDegWith(a)</div>
        <div>{b.angleDegWith(a)}</div>

        <div>a.orientedAngleDegWith(b)</div>
        <div>{a.orientedAngleDegWith(b)}</div>
        <div>b.orientedAngleDegWith(a)</div>
        <div>{b.orientedAngleDegWith(a)}</div>

        <div>a.distance(b)</div>
        <div>{a.distance(b)}</div>
        <div>b.distance(a)</div>
        <div>{b.distance(a)}</div>

        <div>a.distanceX(b)</div>
        <div>{a.distanceX(b)}</div>
        <div>b.distanceX(a)</div>
        <div>{b.distanceX(a)}</div>

        <div>a.distanceY(b)</div>
        <div>{a.distanceY(b)}</div>
        <div>b.distanceY(a)</div>
        <div>{b.distanceY(a)}</div>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
    }
    .measures {
        display: grid;
        grid-template-columns: 300px 300px;
    }
</style>
