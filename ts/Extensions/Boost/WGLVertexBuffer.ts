/* *
 *
 *  (c) 2019-2024 Highsoft AS
 *
 *  Boost module: stripped-down renderer for higher performance
 *
 *  License: highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type { WGLDrawModeValue } from './WGLDrawMode';
import type WGLShader from './WGLShader';

/* *
 *
 *  Class
 *
 * */

/**
 * Vertex Buffer abstraction.
 * A vertex buffer is a set of vertices which are passed to the GPU
 * in a single call.
 *
 * @private
 * @class
 * @name WGLVertexBuffer
 *
 * @param {WebGLContext} gl
 * Context in which to create the buffer.
 * @param {WGLShader} shader
 * Shader to use.
 */
class WGLVertexBuffer {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        gl: WebGLRenderingContext,
        shader: WGLShader,
        dataComponents?: number
        /* , type */
    ) {
        this.components = dataComponents || 2;
        this.dataComponents = dataComponents;
        this.gl = gl;
        this.shader = shader;
    }

    /* *
     *
     *  Properties
     *
     * */

    private buffer: (false|WebGLBuffer|null) = false;

    private components: number;

    public data: (Array<number>|undefined);

    private dataComponents?: number;

    private iterator = 0;

    private gl: WebGLRenderingContext;

    private preAllocated: (false|Float32Array) = false;

    private shader: WGLShader;

    private vertAttribute: (false|number) = false;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Note about pre-allocated buffers:
     *     - This is slower for charts with many series
     * @private
     */
    public allocate(
        size: number
    ): void {
        this.iterator = -1;
        this.preAllocated = new Float32Array(size * 4);
    }

    /**
     * Bind the buffer
     * @private
     */
    public bind(): (boolean|undefined) {
        if (!this.buffer) {
            return false;
        }

        /// gl.bindAttribLocation(shader.program(), 0, 'aVertexPosition');
        // gl.enableVertexAttribArray(vertAttribute);
        // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(
            this.vertAttribute as any,
            this.components,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        /// gl.enableVertexAttribArray(vertAttribute);
    }

    /**
     * Build the buffer
     * @private
     * @param {Array<number>} dataIn
     * Zero padded array of indices
     * @param {string} attrib
     * Name of the Attribute to bind the buffer to
     * @param {number} dataComponents
     * Number of components per. indice
     */
    public build(
        dataIn: Array<number>,
        attrib: string,
        dataComponents?: number
    ): boolean {
        let farray: (false|Float32Array|undefined);

        this.data = dataIn || [];

        if ((!this.data || this.data.length === 0) && !this.preAllocated) {
            /// console.error('trying to render empty vbuffer');
            this.destroy();
            return false;
        }

        this.components = dataComponents || this.components;

        if (this.buffer) {
            this.gl.deleteBuffer(this.buffer);
        }

        if (!this.preAllocated) {
            farray = new Float32Array(this.data);
        }

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            (this.preAllocated as any) || (farray as any),
            this.gl.STATIC_DRAW
        );

        /// gl.bindAttribLocation(shader.program(), 0, 'aVertexPosition');
        this.vertAttribute = this.gl
            .getAttribLocation(this.shader.getProgram() as any, attrib);
        this.gl.enableVertexAttribArray(this.vertAttribute);

        // Trigger cleanup
        farray = false;

        return true;
    }

    /**
     * @private
     */
    public destroy(): void {
        if (this.buffer) {
            this.gl.deleteBuffer(this.buffer);
            this.buffer = false;
            this.vertAttribute = false;
        }

        this.iterator = 0;
        this.components = this.dataComponents || 2;
        this.data = [];
    }

    /**
     * Adds data to the pre-allocated buffer.
     * @private
     * @param {number} x
     * X data
     * @param {number} y
     * Y data
     * @param {number} a
     * A data
     * @param {number} b
     * B data
     */
    public push(x: number, y: number, a: number, b: number): void {
        if (this.preAllocated) { // && iterator <= preAllocated.length - 4) {
            this.preAllocated[++this.iterator] = x;
            this.preAllocated[++this.iterator] = y;
            this.preAllocated[++this.iterator] = a;
            this.preAllocated[++this.iterator] = b;
        }
    }

    /**
     * Render the buffer
     *
     * @private
     * @param {number} from
     * Start indice.
     * @param {number} to
     * End indice.
     * @param {WGLDrawModeValue} drawMode
     * Draw mode.
     */
    public render(
        from: number,
        to: number,
        drawMode: WGLDrawModeValue
    ): boolean {
        const length = this.preAllocated ?
            this.preAllocated.length : this.data?.length || 0;

        if (!this.buffer) {
            return false;
        }

        if (!length) {
            return false;
        }

        if (!from || from > length || from < 0) {
            from = 0;
        }

        if (!to || to > length) {
            to = length;
        }

        if (from >= to) {
            return false;
        }

        drawMode = drawMode || 'POINTS';

        this.gl.drawArrays(
            this.gl[drawMode],
            from / this.components,
            (to - from) / this.components
        );

        return true;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default WGLVertexBuffer;
