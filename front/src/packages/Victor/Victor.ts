/**
 * MIT License
 *
 * Copyright (c) 2011 Max Kueng, George Crabtree
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * # Victor - A JavaScript 2D vector class with methods for common vector operations
 *
 * Taken from https://github.com/maxkueng/victor
 *
 * My plan is to temporarily use this package to port victor to typescript and when
 * it's ready redistribute the package properly. Depending how it goes, that might
 * never happen.
 */

/**
 * Constructor.
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = Victor(42, 1337);
 *
 * @param {Number} x Value of the x axis
 * @param {Number} y Value of the y axis
 * @return {Victor}
 * @api public
 */
export class Victor {
    x: number = 0;
    y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Adds another vector's X axis to this one
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.addX(vec2);
     *     vec1.toString();
     *     // => x:30, y:10
     *
     * @api public
     */
    addX(vec: Victor) {
        this.x += vec.x;
        return this;
    }

    /**
     * Adds another vector's Y axis to this one
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.addY(vec2);
     *     vec1.toString();
     *     // => x:10, y:40
     *
     * @api public
     */
    addY(vec: Victor) {
        this.y += vec.y;
        return this;
    }

    /**
     * Adds another vector to this one
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.add(vec2);
     *     vec1.toString();
     *     // => x:30, y:40
     *
     * @api public
     */
    add(vec: Victor) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    /**
     * Adds the given scalar to both vector axis
     *
     * ### Examples:
     *     var vec = new Victor(1, 2);
     *
     *     vec.addScalar(2);
     *     vec.toString();
     *     // => x: 3, y: 4
     *
     * @api public
     */
    addScalar(scalar: number) {
        this.x += scalar;
        this.y += scalar;
        return this;
    }

    /**
     * Adds the given scalar to the X axis
     *
     * ### Examples:
     *     var vec = new Victor(1, 2);
     *
     *     vec.addScalarX(2);
     *     vec.toString();
     *     // => x: 3, y: 2
     *
     * @api public
     */
    addScalarX(scalar: number) {
        this.x += scalar;
        return this;
    }

    /**
     * Adds the given scalar to the Y axis
     *
     * ### Examples:
     *     var vec = new Victor(1, 2);
     *
     *     vec.addScalarY(2);
     *     vec.toString();
     *     // => x: 1, y: 4
     *
     * @api public
     */
    addScalarY(scalar: number) {
        this.y += scalar;
        return this;
    }

    /**
     * Subtracts the X axis of another vector from this one
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.subtractX(vec2);
     *     vec1.toString();
     *     // => x:80, y:50
     *
     * @api public
     */
    subtractX(vec: Victor) {
        this.x -= vec.x;
        return this;
    }

    /**
     * Subtracts the Y axis of another vector from this one
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.subtractY(vec2);
     *     vec1.toString();
     *     // => x:100, y:20
     *
     * @api public
     */
    subtractY(vec: Victor) {
        this.y -= vec.y;
        return this;
    }

    /**
     * Subtracts another vector from this one
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(20, 30);
     *
     *     vec1.subtract(vec2);
     *     vec1.toString();
     *     // => x:80, y:20
     *
     * @api public
     */
    subtract(vec: Victor) {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    /**
     * Subtracts the given scalar from both axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 200);
     *
     *     vec.subtractScalar(20);
     *     vec.toString();
     *     // => x: 80, y: 180
     *
     * @api public
     */
    subtractScalar(scalar: number) {
        this.x -= scalar;
        this.y -= scalar;
        return this;
    }

    /**
     * Subtracts the given scalar from the X axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 200);
     *
     *     vec.subtractScalarX(20);
     *     vec.toString();
     *     // => x: 80, y: 200
     *
     * @api public
     */
    subtractScalarX(scalar: number) {
        this.x -= scalar;
        return this;
    }

    /**
     * Subtracts the given scalar from the Y axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 200);
     *
     *     vec.subtractScalarY(20);
     *     vec.toString();
     *     // => x: 100, y: 180
     *
     * @api public
     */
    subtractScalarY(scalar: number) {
        this.y -= scalar;
        return this;
    }

    /**
     * Divides the X axis by the x component of given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(2, 0);
     *
     *     vec.divideX(vec2);
     *     vec.toString();
     *     // => x:50, y:50
     *
     * @api public
     */
    divideX(vector: Victor) {
        this.x /= vector.x;
        return this;
    }

    /**
     * Divides the Y axis by the y component of given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(0, 2);
     *
     *     vec.divideY(vec2);
     *     vec.toString();
     *     // => x:100, y:25
     *
     * @api public
     */
    divideY(vector: Victor) {
        this.y /= vector.y;
        return this;
    }

    /**
     * Divides both vector axis by a axis values of given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(2, 2);
     *
     *     vec.divide(vec2);
     *     vec.toString();
     *     // => x:50, y:25
     *
     * @api public
     */
    divide(vector: Victor) {
        this.x /= vector.x;
        this.y /= vector.y;
        return this;
    }

    /**
     * Divides both vector axis by the given scalar value
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.divideScalar(2);
     *     vec.toString();
     *     // => x:50, y:25
     *
     * @api public
     */
    divideScalar(scalar: number) {
        // Original code as special case for scalar == 0 which
        // is inconsistent with the other methods
        //
        // if (scalar !== 0) {
        //     this.x /= scalar;
        //     this.y /= scalar;
        // } else {
        //     this.x = 0;
        //     this.y = 0;
        // }

        this.x /= scalar;
        this.y /= scalar;

        return this;
    }

    /**
     * Divides the X axis by the given scalar value
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.divideScalarX(2);
     *     vec.toString();
     *     // => x:50, y:50
     *
     * @api public
     */
    divideScalarX(scalar: number) {
        // if (scalar !== 0) {
        //     this.x /= scalar;
        // } else {
        //     this.x = 0;
        // }

        this.x /= scalar;
        return this;
    }

    /**
     * Divides the Y axis by the given scalar value
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.divideScalarY(2);
     *     vec.toString();
     *     // => x:100, y:25
     *
     * @api public
     */
    divideScalarY(scalar: number) {
        // if (scalar !== 0) {
        //     this.y /= scalar;
        // } else {
        //     this.y = 0;
        // }

        this.y /= scalar;
        return this;
    }

    /**
     * Inverts the X axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.invertX();
     *     vec.toString();
     *     // => x:-100, y:50
     *
     * @api public
     */
    invertX() {
        this.x *= -1;
        return this;
    }

    /**
     * Inverts the Y axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.invertY();
     *     vec.toString();
     *     // => x:100, y:-50
     *
     * @api public
     */
    invertY() {
        this.y *= -1;
        return this;
    }

    /**
     * Inverts both axis
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.invert();
     *     vec.toString();
     *     // => x:-100, y:-50
     *
     * @api public
     */
    invert() {
        this.invertX();
        this.invertY();
        return this;
    }

    /**
     * Multiplies the X axis by X component of given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(2, 0);
     *
     *     vec.multiplyX(vec2);
     *     vec.toString();
     *     // => x:200, y:50
     *
     * @api public
     */
    multiplyX(vector: Victor) {
        this.x *= vector.x;
        return this;
    }

    /**
     * Multiplies the Y axis by Y component of given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(0, 2);
     *
     *     vec.multiplyX(vec2);
     *     vec.toString();
     *     // => x:100, y:100
     *
     * @api public
     */
    multiplyY(vector: Victor) {
        this.y *= vector.y;
        return this;
    }

    /**
     * Multiplies both vector axis by values from a given vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     var vec2 = new Victor(2, 2);
     *
     *     vec.multiply(vec2);
     *     vec.toString();
     *     // => x:200, y:100
     *
     * @api public
     */
    multiply(vector: Victor) {
        this.x *= vector.x;
        this.y *= vector.y;
        return this;
    }

    /**
     * Multiplies both vector axis by the given scalar value
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.multiplyScalar(2);
     *     vec.toString();
     *     // => x:200, y:100
     *
     * @api public
     */
    multiplyScalar(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Multiplies the X axis by the given scalar
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.multiplyScalarX(2);
     *     vec.toString();
     *     // => x:200, y:50
     *
     * @api public
     */
    multiplyScalarX(scalar: number) {
        this.x *= scalar;
        return this;
    }

    /**
     * Multiplies the Y axis by the given scalar
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.multiplyScalarY(2);
     *     vec.toString();
     *     // => x:100, y:100
     *
     * @api public
     */
    multiplyScalarY(scalar: number) {
        this.y *= scalar;
        return this;
    }

    /**
     * Normalize
     *
     * @api public
     */
    normalize() {
        const length = this.length();

        if (length === 0) {
            this.x = 1;
            this.y = 0;
        } else {
            this.divide(new Victor(length, length));
        }
        return this;
    }

    norm = this.normalize;

    /**
     * If the absolute vector axis is greater than `max`, multiplies the axis by `factor`
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.limit(80, 0.9);
     *     vec.toString();
     *     // => x:90, y:50
     *
     * @param {Number} max The maximum value for both x and y axis
     * @param {Number} factor Factor by which the axis are to be multiplied with
     * @api public
     */
    limit(max: number, factor: number) {
        if (Math.abs(this.x) > max) {
            this.x *= factor;
        }
        if (Math.abs(this.y) > max) {
            this.y *= factor;
        }
        return this;
    }

    /**
     * Randomizes both vector axis with a value between 2 vectors
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.randomize(new Victor(50, 60), new Victor(70, 80`));
     *     vec.toString();
     *     // => x:67, y:73
     *
     * @param {Victor} topLeft first vector
     * @param {Victor} bottomRight second vector
     * @api public
     */
    randomize(topLeft: Victor, bottomRight: Victor) {
        this.randomizeX(topLeft, bottomRight);
        this.randomizeY(topLeft, bottomRight);

        return this;
    }

    /**
     * Randomizes the y axis with a value between 2 vectors
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.randomizeX(new Victor(50, 60), new Victor(70, 80`));
     *     vec.toString();
     *     // => x:55, y:50
     *
     * @param {Victor} topLeft first vector
     * @param {Victor} bottomRight second vector
     * @api public
     */
    randomizeX(topLeft: Victor, bottomRight: Victor) {
        const min = Math.min(topLeft.x, bottomRight.x);
        const max = Math.max(topLeft.x, bottomRight.x);
        this.x = random(min, max);
        return this;
    }

    /**
     * Randomizes the y axis with a value between 2 vectors
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.randomizeY(new Victor(50, 60), new Victor(70, 80`));
     *     vec.toString();
     *     // => x:100, y:66
     *
     * @param {Victor} topLeft first vector
     * @param {Victor} bottomRight second vector
     * @api public
     */
    randomizeY(topLeft: Victor, bottomRight: Victor) {
        const min = Math.min(topLeft.y, bottomRight.y);
        const max = Math.max(topLeft.y, bottomRight.y);
        this.y = random(min, max);
        return this;
    }

    /**
     * Randomly randomizes either axis between 2 vectors
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.randomizeAny(new Victor(50, 60), new Victor(70, 80));
     *     vec.toString();
     *     // => x:100, y:77
     *
     * @param {Victor} topLeft first vector
     * @param {Victor} bottomRight second vector
     * @api public
     */
    randomizeAny(topLeft: Victor, bottomRight: Victor) {
        if (Math.random() < 0.5) {
            this.randomizeX(topLeft, bottomRight);
        } else {
            this.randomizeY(topLeft, bottomRight);
        }
        return this;
    }

    /**
     * Rounds both axis to an integer value
     *
     * ### Examples:
     *     var vec = new Victor(100.2, 50.9);
     *
     *     vec.unfloat();
     *     vec.toString();
     *     // => x:100, y:51
     *
     * @api public
     */
    unfloat() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /**
     * Rounds both axis to a certain precision
     *
     * ### Examples:
     *     var vec = new Victor(100.2345, 50.9876);
     *
     *     vec.toFixed(2);
     *     vec.toString();
     *     // => x:100.23, y:51.98
     *
     * @param {Number} precision (default: 8)
     * @api public
     */
    toFixed(precision: number = 8) {
        this.x = Number(this.x.toFixed(precision));
        this.y = Number(this.y.toFixed(precision));
        return this;
    }

    /**
     * Performs a linear blend / interpolation of the X axis towards another vector
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 100);
     *     var vec2 = new Victor(200, 200);
     *
     *     vec1.mixX(vec2, 0.5);
     *     vec.toString();
     *     // => x:150, y:100
     *
     * @param {Victor} vec The other vector
     * @param {Number} amount The blend amount (optional, default: 0.5)
     * @api public
     */
    mixX(vec: Victor, amount: number = 0.5) {
        this.x = (1 - amount) * this.x + amount * vec.x;
        return this;
    }

    /**
     * Performs a linear blend / interpolation of the Y axis towards another vector
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 100);
     *     var vec2 = new Victor(200, 200);
     *
     *     vec1.mixY(vec2, 0.5);
     *     vec.toString();
     *     // => x:100, y:150
     *
     * @param {Victor} vec The other vector
     * @param {Number} amount The blend amount (optional, default: 0.5)
     * @api public
     */
    mixY(vec: Victor, amount: number = 0.5) {
        this.y = (1 - amount) * this.y + amount * vec.y;
        return this;
    }

    /**
     * Performs a linear blend / interpolation towards another vector
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 100);
     *     var vec2 = new Victor(200, 200);
     *
     *     vec1.mix(vec2, 0.5);
     *     vec.toString();
     *     // => x:150, y:150
     *
     * @param {Victor} vec The other vector
     * @param {Number} amount The blend amount (optional, default: 0.5)
     * @api public
     */
    mix(vec: Victor, amount: number = 0.5) {
        this.mixX(vec, amount);
        this.mixY(vec, amount);
        return this;
    }

    /**
     * Creates a clone of this vector
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = vec1.clone();
     *
     *     vec2.toString();
     *     // => x:10, y:10
     *
     * @api public
     */
    clone() {
        return new Victor(this.x, this.y);
    }

    /**
     * Copies another vector's X component in to its own
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 20);
     *     var vec2 = vec1.copyX(vec1);
     *
     *     vec2.toString();
     *     // => x:20, y:10
     *
     * @api public
     */
    copyX(vec: Victor) {
        this.x = vec.x;
        return this;
    }

    /**
     * Copies another vector's Y component in to its own
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 20);
     *     var vec2 = vec1.copyY(vec1);
     *
     *     vec2.toString();
     *     // => x:10, y:20
     *
     * @api public
     */
    copyY(vec: Victor) {
        this.y = vec.y;
        return this;
    }

    /**
     * Copies another vector's X and Y components in to its own
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *     var vec2 = new Victor(20, 20);
     *     var vec2 = vec1.copy(vec1);
     *
     *     vec2.toString();
     *     // => x:20, y:20
     *
     * @api public
     */
    copy(vec: Victor) {
        this.copyX(vec);
        this.copyY(vec);
        return this;
    }

    /**
     * Sets the vector to zero (0,0)
     *
     * ### Examples:
     *     var vec1 = new Victor(10, 10);
     *		 var1.zero();
     *     vec1.toString();
     *     // => x:0, y:0
     *
     * @api public
     */
    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    /**
     * Calculates the dot product of this vector and another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.dot(vec2);
     *     // => 23000
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    dot(vec: Victor) {
        return this.x * vec.x + this.y * vec.y;
    }

    /**
     * Calculates the cross product of this vector and another
     *
     * ### Examples:
     * var vec1 = new Victor(100, 100);
     * var vec2 = new Victor(500, 200);
     *
     * vec1.cross(vec2);
     * // => -30000
     *
     * @api public
     */
    cross(vec: Victor) {
        return this.x * vec.y - this.y * vec.x;
    }

    /**
     * Projects a vector onto another vector, setting itself to the result.
     *
     * ### Examples:
     *     var vec = new Victor(100, 0);
     *     var vec2 = new Victor(100, 100);
     *
     *     vec.projectOnto(vec2);
     *     vec.toString();
     *     // => x:50, y:50
     *
     * @api public
     */
    projectOnto(vec: Victor) {
        const coeff = (this.x * vec.x + this.y * vec.y) / (vec.x * vec.x + vec.y * vec.y);
        this.x = coeff * vec.x;
        this.y = coeff * vec.y;
        return this;
    }

    horizontalAngle() {
        return Math.atan2(this.y, this.x);
    }

    horizontalAngleDeg() {
        return radian2degrees(this.horizontalAngle());
    }

    verticalAngle() {
        return Math.atan2(this.x, this.y);
    }

    verticalAngleDeg() {
        return radian2degrees(this.verticalAngle());
    }

    angle = this.horizontalAngle;
    angleDeg = this.horizontalAngleDeg;
    direction = this.horizontalAngle;

    rotate(angle: number) {
        const nx = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        const ny = this.x * Math.sin(angle) + this.y * Math.cos(angle);

        this.x = nx;
        this.y = ny;

        return this;
    }

    rotateDeg(angle: number) {
        const radAngle = degrees2radian(angle);
        return this.rotate(radAngle);
    }

    rotateTo(rotation: number) {
        return this.rotate(rotation - this.angle());
    }

    rotateToDeg(rotation: number) {
        const radRotation = degrees2radian(rotation);
        return this.rotateTo(radRotation);
    }

    rotateBy(rotation: number) {
        const angle = this.angle() + rotation;

        return this.rotate(angle);
    }

    rotateByDeg(rotation: number) {
        const radRotation = degrees2radian(rotation);
        return this.rotateBy(radRotation);
    }

    /**
     * Calculates the distance of the X axis between this vector and another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.distanceX(vec2);
     *     // => -100
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    distanceX(vec: Victor) {
        return this.x - vec.x;
    }

    /**
     * Same as `distanceX()` but always returns an absolute number
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.absDistanceX(vec2);
     *     // => 100
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    absDistanceX(vec: Victor) {
        return Math.abs(this.distanceX(vec));
    }

    /**
     * Calculates the distance of the Y axis between this vector and another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.distanceY(vec2);
     *     // => -10
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    distanceY(vec: Victor) {
        return this.y - vec.y;
    }

    /**
     * Same as `distanceY()` but always returns an absolute number
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.distanceY(vec2);
     *     // => 10
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    absDistanceY(vec: Victor) {
        return Math.abs(this.distanceY(vec));
    }

    /**
     * Calculates the euclidean distance between this vector and another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.distance(vec2);
     *     // => 100.4987562112089
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    distance(vec: Victor) {
        return Math.sqrt(this.distanceSq(vec));
    }

    /**
     * Calculates the squared euclidean distance between this vector and another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(200, 60);
     *
     *     vec1.distanceSq(vec2);
     *     // => 10100
     *
     * @param {Victor} vec The second vector
     * @api public
     */
    distanceSq(vec: Victor) {
        const dx = this.distanceX(vec);
        const dy = this.distanceY(vec);

        return dx * dx + dy * dy;
    }

    /**
     * Calculates the length or magnitude of the vector
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.length();
     *     // => 111.80339887498948
     *
     * @return Length / Magnitude
     * @api public
     */
    length() {
        return Math.sqrt(this.lengthSq());
    }

    /**
     * Squared length / magnitude
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *
     *     vec.lengthSq();
     *     // => 12500
     *
     * @return  Length / Magnitude
     * @api public
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    magnitude = this.length;

    /**
     * Returns true if vector is (0, 0)
     *
     * ### Examples:
     *     var vec = new Victor(100, 50);
     *     vec.zero();
     *
     *     // => true
     *
     * @api public
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }

    /**
     * Returns true if this vector is the same as another
     *
     * ### Examples:
     *     var vec1 = new Victor(100, 50);
     *     var vec2 = new Victor(100, 50);
     *     vec1.isEqualTo(vec2);
     *
     *     // => true
     *
     * @api public
     */
    isEqualTo(vec: Victor) {
        return this.x === vec.x && this.y === vec.y;
    }

    /**
     * # Utility Methods
     */

    /**
     * Returns an string representation of the vector
     *
     * ### Examples:
     *     var vec = new Victor(10, 20);
     *
     *     vec.toString();
     *     // => x:10, y:20
     *
     * @return
     * @api public
     */
    toString() {
        return `x: ${this.x}, y: ${this.y}`;
    }

    /**
     * Returns an array representation of the vector
     *
     * ### Examples:
     *     var vec = new Victor(10, 20);
     *
     *     vec.toArray();
     *     // => [10, 20]
     *
     * @return
     * @api public
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Returns an object representation of the vector
     *
     * ### Examples:
     *     var vec = new Victor(10, 20);
     *
     *     vec.toObject();
     *     // => { x: 10, y: 20 }
     *
     * @return
     * @api public
     */
    toObject() {
        return { x: this.x, y: this.y };
    }
}

/**
 * # Static
 */

/**
 * Creates a new instance from an array
 *
 * ### Examples:
 *     var vec = Victor.fromArray([42, 21]);
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromArray
 * @param {Array} arr Array with the x and y values at index 0 and 1 respectively
 * @return The new instance
 * @api public
 */
export const fromArray = (arr: [number, number]) => {
    return new Victor(arr[0] || 0, arr[1] || 0);
};

/**
 * Creates a new instance from an object
 *
 * ### Examples:
 *     var vec = Victor.fromObject({ x: 42, y: 21 });
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromObject
 * @param {Object} obj Object with the values for x and y
 * @return The new instance
 * @api public
 */
export const fromObject = (obj: { x?: number; y?: number }) => {
    return new Victor(obj.x || 0, obj.y || 0);
};

const degrees = 180 / Math.PI;

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function radian2degrees(rad: number) {
    return rad * degrees;
}

function degrees2radian(deg: number) {
    return deg / degrees;
}
