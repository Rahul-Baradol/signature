let gl: WebGLRenderingContext;
let program: WebGLProgram;

let texture: WebGLTexture;
let resolutionLoc: WebGLUniformLocation | null;
let countLoc: WebGLUniformLocation | null;
let samplerLoc: WebGLUniformLocation | null;

export function initWebGLGradient() {
    const canvas = document.getElementById("gradientCanvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl")!;

    resize();
    window.addEventListener("resize", resize);

    const vertexSrc = `
        attribute vec2 a_pos;
        void main() {
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    `;

    const fragmentSrc = `
        precision highp float;

        uniform sampler2D u_tex;
        uniform float u_count;
        uniform vec2 u_resolution;

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            float d = distance(uv, vec2(0.5));

            float index = d * u_count;
            index = clamp(index, 0.0, u_count - 1.0);

            float texX = index / u_count;

            float amp = texture2D(u_tex, vec2(texX, 0.0)).r;

            float r = 140.0 * amp;
            float g = 100.0 * amp;
            float b = 1.0;

            float alpha = log(1.0 + 10.0 * amp) / log(11.0);

            gl_FragColor = vec4(r, g, b, alpha);
        }
    `;

    program = createProgram(vertexSrc, fragmentSrc);
    gl.useProgram(program);

    const pos = gl.getAttribLocation(program, "a_pos");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]),
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    countLoc = gl.getUniformLocation(program, "u_count");
    samplerLoc = gl.getUniformLocation(program, "u_tex");

    texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(samplerLoc, 0);
}

export function renderGradient(amps: number[]) {
    if (!gl) return;

    gl.useProgram(program);

    const arr = new Uint8Array(amps); // [0..255]

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        arr.length,
        1,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        arr
    );

    gl.uniform1f(countLoc, amps.length);
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function resize() {
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function createShader(type: number, src: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram(vsSrc: string, fsSrc: string) {
    const vs = createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
    }

    return program;
}
