class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
}

function Shuffle(arrayToShuffle) {
    for (let e = arrayToShuffle.length - 1; e > 0; e--) {
        const index = Math.round(Math.random() * (e - 1));
        const temp = arrayToShuffle[e];

        arrayToShuffle[e] = arrayToShuffle[index];
        arrayToShuffle[index] = temp;
    }
}

function MakePermutation() {
    const permutation = [];
    for (let i = 0; i < 256; i++) {
        permutation.push(i);
    }

    Shuffle(permutation);

    for (let i = 0; i < 256; i++) {
        permutation.push(permutation[i]);
    }

    return permutation;
}
const Permutation = MakePermutation();

function GetConstantVector(v) {
    // v is the value from the permutation table
    const h = v & 3;
    if (h == 0)
        return new Vector2(1.0, 1.0);
    else if (h == 1)
        return new Vector2(-1.0, 1.0);
    else if (h == 2)
        return new Vector2(-1.0, -1.0);
    else
        return new Vector2(1.0, -1.0);
}

function Fade(t) {
    return ((6 * t - 15) * t + 10) * t * t * t;
}

function Lerp(t, a1, a2) {
    return a1 + t * (a2 - a1);
}

function Noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = new Vector2(xf - 1.0, yf - 1.0);
    const topLeft = new Vector2(xf, yf - 1.0);
    const bottomRight = new Vector2(xf - 1.0, yf);
    const bottomLeft = new Vector2(xf, yf);

    // Select a value from the permutation array for each of the 4 corners
    const valueTopRight = Permutation[Permutation[X + 1] + Y + 1];
    const valueTopLeft = Permutation[Permutation[X] + Y + 1];
    const valueBottomRight = Permutation[Permutation[X + 1] + Y];
    const valueBottomLeft = Permutation[Permutation[X] + Y];

    const dotTopRight = topRight.dot(GetConstantVector(valueTopRight));
    const dotTopLeft = topLeft.dot(GetConstantVector(valueTopLeft));
    const dotBottomRight = bottomRight.dot(GetConstantVector(valueBottomRight));
    const dotBottomLeft = bottomLeft.dot(GetConstantVector(valueBottomLeft));

    const u = Fade(xf);
    const v = Fade(yf);

    return Lerp(u,
        Lerp(v, dotBottomLeft, dotTopLeft),
        Lerp(v, dotBottomRight, dotTopRight)
    );
}


function foobar(frameBuffer) {
    for (let y = 0; y < 500; y++) {
        for (let x = 0; x < 500; x++) {
            // Noise2D generally returns a value approximately in the range [-1.0, 1.0]
            let n = Noise2D(x * 0.01, y * 0.01);

            // Transform the range to [0.0, 1.0], supposing that the range of Noise2D is [-1.0, 1.0]
            n += 1.0;
            n /= 2.0;

            let c = Math.round(255 * n);
            if (n < 0.5) { // sea
                frameBuffer[y][x] = 0 | c << 8 | c << 16 | 255 << 24;
            } else if (n >= 0.5 && n <= 0.75) { // land
                frameBuffer[y][x] = 0 | c << 8 | (c / 1.75) << 16 | 255 << 24;
            } else { // mountain
                frameBuffer[y][x] = c | c << 8 | (c / 2) << 16 | 255 << 24;
            }
        }
    }
}

function outputFrame(frameBuffer, canvas, container) {
    const context = canvas.getContext('2d');
    const data = context.createImageData(canvas.width, canvas.height);
    const buf = new Uint32Array(data.data.buffer);

    for (let i = 0; i < frameBuffer.length; i++) {
        for (let j = 0; j < frameBuffer[0].length; j++) {
            if (frameBuffer[i][j]) {
                buf[i * canvas.height + j] = frameBuffer[i][j];
            }
        }
    }

    context.putImageData(data, 0, 0);
    container.append(canvas);
}

function main() {
    const canvas = document.createElement('canvas');
    const container = document.getElementById('canvas-container');

    let pixels = [];
    for (let i = 0; i < 500; i++) {
        pixels.push(new Array(500));
    }

    foobar(pixels);

    canvas.height = pixels.length;
    canvas.width = pixels[0].length;
    outputFrame(pixels, canvas, container);
}


window.addEventListener("load", main);