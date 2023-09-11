/* *
 *
 *  Copyright (c) 2019-2021 Highsoft AS
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

import type BubbleSeries from '../../Series/Bubble/BubbleSeries';
import U from '../../Shared/Utilities.js';
import error from '../../Shared/Helpers/Error.js';
const {
    clamp,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

type WGLProgramType = ('fragment'|'vertex');

/* *
 *
 *  Constants
 *
 * */

const fragmentShader = [
    /* eslint-disable max-len, @typescript-eslint/indent */
    'precision highp float;',
    'uniform vec4 fillColor;',
    'varying highp vec2 position;',
    'varying highp vec4 vColor;',
    'uniform sampler2D uSampler;',
    'uniform bool isCircle;',
    'uniform bool hasColor;',

    // 'vec4 toColor(float value, vec2 point) {',
    //     'return vec4(0.0, 0.0, 0.0, 0.0);',
    // '}',

    'void main(void) {',
        'vec4 col = fillColor;',
        'vec4 tcol = texture2D(uSampler, gl_PointCoord.st);',

        'if (hasColor) {',
            'col = vColor;',
        '}',

        'if (isCircle) {',
            'col *= tcol;',
            'if (tcol.r < 0.0) {',
                'discard;',
            '} else {',
                'gl_FragColor = col;',
            '}',
        '} else {',
            'gl_FragColor = col;',
        '}',
    '}'
    /* eslint-enable max-len, @typescript-eslint/indent */
].join('\n');

const vertexShader = [
    /* eslint-disable max-len, @typescript-eslint/indent */
    '#version 100',
    '#define LN10 2.302585092994046',
    'precision highp float;',

    'attribute vec4 aVertexPosition;',
    'attribute vec4 aColor;',

    'varying highp vec2 position;',
    'varying highp vec4 vColor;',

    'uniform mat4 uPMatrix;',
    'uniform float pSize;',

    'uniform float translatedThreshold;',
    'uniform bool hasThreshold;',

    'uniform bool skipTranslation;',

    'uniform float xAxisTrans;',
    'uniform float xAxisMin;',
    'uniform float xAxisMinPad;',
    'uniform float xAxisPointRange;',
    'uniform float xAxisLen;',
    'uniform bool  xAxisPostTranslate;',
    'uniform float xAxisOrdinalSlope;',
    'uniform float xAxisOrdinalOffset;',
    'uniform float xAxisPos;',
    'uniform bool  xAxisCVSCoord;',
    'uniform bool  xAxisIsLog;',
    'uniform bool  xAxisReversed;',

    'uniform float yAxisTrans;',
    'uniform float yAxisMin;',
    'uniform float yAxisMinPad;',
    'uniform float yAxisPointRange;',
    'uniform float yAxisLen;',
    'uniform bool  yAxisPostTranslate;',
    'uniform float yAxisOrdinalSlope;',
    'uniform float yAxisOrdinalOffset;',
    'uniform float yAxisPos;',
    'uniform bool  yAxisCVSCoord;',
    'uniform bool  yAxisIsLog;',
    'uniform bool  yAxisReversed;',

    'uniform bool  isBubble;',
    'uniform bool  bubbleSizeByArea;',
    'uniform float bubbleZMin;',
    'uniform float bubbleZMax;',
    'uniform float bubbleZThreshold;',
    'uniform float bubbleMinSize;',
    'uniform float bubbleMaxSize;',
    'uniform bool  bubbleSizeAbs;',
    'uniform bool  isInverted;',

    'float bubbleRadius(){',
        'float value = aVertexPosition.w;',
        'float zMax = bubbleZMax;',
        'float zMin = bubbleZMin;',
        'float radius = 0.0;',
        'float pos = 0.0;',
        'float zRange = zMax - zMin;',

        'if (bubbleSizeAbs){',
            'value = value - bubbleZThreshold;',
            'zMax = max(zMax - bubbleZThreshold, zMin - bubbleZThreshold);',
            'zMin = 0.0;',
        '}',

        'if (value < zMin){',
            'radius = bubbleZMin / 2.0 - 1.0;',
        '} else {',
            'pos = zRange > 0.0 ? (value - zMin) / zRange : 0.5;',
            'if (bubbleSizeByArea && pos > 0.0){',
                'pos = sqrt(pos);',
            '}',
            'radius = ceil(bubbleMinSize + pos * (bubbleMaxSize - bubbleMinSize)) / 2.0;',
        '}',

        'return radius * 2.0;',
    '}',

    'float translate(float val,',
                    'float pointPlacement,',
                    'float localA,',
                    'float localMin,',
                    'float minPixelPadding,',
                    'float pointRange,',
                    'float len,',
                    'bool  cvsCoord,',
                    'bool  isLog,',
                    'bool  reversed',
                    '){',

        'float sign = 1.0;',
        'float cvsOffset = 0.0;',

        'if (cvsCoord) {',
            'sign *= -1.0;',
            'cvsOffset = len;',
        '}',

        'if (isLog) {',
            'val = log(val) / LN10;',
        '}',

        'if (reversed) {',
            'sign *= -1.0;',
            'cvsOffset -= sign * len;',
        '}',

        'return sign * (val - localMin) * localA + cvsOffset + ',
            '(sign * minPixelPadding);', // ' + localA * pointPlacement * pointRange;',
    '}',

    'float xToPixels(float value) {',
        'if (skipTranslation){',
            'return value;// + xAxisPos;',
        '}',

        'return translate(value, 0.0, xAxisTrans, xAxisMin, xAxisMinPad, xAxisPointRange, xAxisLen, xAxisCVSCoord, xAxisIsLog, xAxisReversed);// + xAxisPos;',
    '}',

    'float yToPixels(float value, float checkTreshold) {',
        'float v;',
        'if (skipTranslation){',
            'v = value;// + yAxisPos;',
        '} else {',
            'v = translate(value, 0.0, yAxisTrans, yAxisMin, yAxisMinPad, yAxisPointRange, yAxisLen, yAxisCVSCoord, yAxisIsLog, yAxisReversed);// + yAxisPos;',

            'if (v > yAxisLen) {',
                'v = yAxisLen;',
            '}',
        '}',
        'if (checkTreshold > 0.0 && hasThreshold) {',
            'v = min(v, translatedThreshold);',
        '}',
        'return v;',
    '}',

    'void main(void) {',
        'if (isBubble){',
            'gl_PointSize = bubbleRadius();',
        '} else {',
            'gl_PointSize = pSize;',
        '}',
        // 'gl_PointSize = 10.0;',
        'vColor = aColor;',

        'if (skipTranslation && isInverted) {',
            // If we get translated values from JS, just swap them (x, y)
            'gl_Position = uPMatrix * vec4(aVertexPosition.y + yAxisPos, aVertexPosition.x + xAxisPos, 0.0, 1.0);',
        '} else if (isInverted) {',
            // But when calculating pixel positions directly,
            // swap axes and values (x, y)
            'gl_Position = uPMatrix * vec4(yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, xToPixels(aVertexPosition.x) + xAxisPos, 0.0, 1.0);',
        '} else {',
            'gl_Position = uPMatrix * vec4(xToPixels(aVertexPosition.x) + xAxisPos, yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, 0.0, 1.0);',
        '}',
        // 'gl_Position = uPMatrix * vec4(aVertexPosition.x, aVertexPosition.y, 0.0, 1.0);',
    '}'
    /* eslint-enable max-len, @typescript-eslint/indent */
].join('\n');

/* *
 *
 *  Class
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * A static shader mimicing axis translation functions found in Core/Axis
 *
 * @private
 *
 * @param {WebGLContext} gl
 * the context in which the shader is active
 */
class WGLShader {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        gl: WebGLRenderingContext
    ) {
        this.gl = gl;

        if (gl && !this.createShader()) {
            return void 0 as any;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    // Uniform for bubble abs sizing
    private bubbleSizeAbsUniform: (WebGLUniformLocation|null|undefined);

    private bubbleSizeAreaUniform: (WebGLUniformLocation|null|undefined);

    // Error stack
    private errors: Array<(string|null)> = [];

    // Uniform for fill color
    private fcUniform?: (WebGLUniformLocation|null);

    private gl: WebGLRenderingContext;

    // Uniform for isBubble
    private isBubbleUniform?: (WebGLUniformLocation|null);

    // Set to 1 if circle
    private isCircleUniform: (WebGLUniformLocation|null|undefined);

    // Uniform for invertion
    private isInverted: (WebGLUniformLocation|null|undefined);

    // Uniform for point size
    private psUniform?: (WebGLUniformLocation|null);

    // Uniform handle to the perspective matrix
    private pUniform?: (WebGLUniformLocation|null);

    // The shader program
    private shaderProgram?: (WebGLProgram|null);

    // Skip translation uniform
    private skipTranslationUniform: (WebGLUniformLocation|null|undefined);

    private uLocations: Record<string, WebGLUniformLocation> = {};

    // Texture uniform
    private uSamplerUniform: (WebGLUniformLocation|null|undefined);

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Bind the shader.
     * This makes the shader the active one until another one is bound,
     * or until 0 is bound.
     * @private
     */
    public bind(): void {
        if (this.gl && this.shaderProgram) {
            this.gl.useProgram(this.shaderProgram);
        }
    }

    /**
     * Create the shader.
     * Loads the shader program statically defined above
     * @private
     */
    public createShader(): boolean {
        const v = this.stringToProgram(vertexShader, 'vertex'),
            f = this.stringToProgram(fragmentShader, 'fragment'),
            uloc = (n: string): (WebGLUniformLocation|null) => (
                this.gl.getUniformLocation(this.shaderProgram as any, n)
            );

        if (!v || !f) {
            this.shaderProgram = false;
            this.handleErrors();
            return false;
        }

        this.shaderProgram = this.gl.createProgram();

        this.gl.attachShader(this.shaderProgram as any, v);
        this.gl.attachShader(this.shaderProgram as any, f);

        this.gl.linkProgram(this.shaderProgram as any);

        if (!this.gl.getProgramParameter(
            this.shaderProgram as any,
            this.gl.LINK_STATUS
        )) {
            this.errors.push(
                this.gl.getProgramInfoLog(this.shaderProgram as any)
            );
            this.handleErrors();
            this.shaderProgram = false;
            return false;
        }

        this.gl.useProgram(this.shaderProgram);

        this.gl.bindAttribLocation(
            this.shaderProgram as any, 0, 'aVertexPosition'
        );

        this.pUniform = uloc('uPMatrix');
        this.psUniform = uloc('pSize');
        this.fcUniform = uloc('fillColor');
        this.isBubbleUniform = uloc('isBubble');
        this.bubbleSizeAbsUniform = uloc('bubbleSizeAbs');
        this.bubbleSizeAreaUniform = uloc('bubbleSizeByArea');
        this.uSamplerUniform = uloc('uSampler');
        this.skipTranslationUniform = uloc('skipTranslation');
        this.isCircleUniform = uloc('isCircle');
        this.isInverted = uloc('isInverted');

        return true;
    }

    /**
     * Handle errors accumulated in errors stack
     * @private
     */
    public handleErrors(): void {
        if (this.errors.length) {
            error(
                '[highcharts boost] shader error - ' +
                this.errors.join('\n')
            );
        }
    }

    /**
     * String to shader program
     * @private
     * @param {string} str
     * Program source
     * @param {string} type
     * Program type: either `vertex` or `fragment`
     */
    public stringToProgram(
        str: string,
        type: WGLProgramType
    ): (false|WebGLShader|null) {
        const shader = this.gl.createShader(
            type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER
        );

        this.gl.shaderSource(shader as any, str);
        this.gl.compileShader(shader as any);

        if (!this.gl.getShaderParameter(
            shader as any,
            this.gl.COMPILE_STATUS
        )) {
            this.errors.push(
                'when compiling ' +
                type +
                ' shader:\n' +
                this.gl.getShaderInfoLog(shader as any)
            );

            return false;
        }
        return shader;
    }

    /**
     * Destroy the shader
     * @private
     */
    public destroy(): void {
        if (this.gl && this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = false;
        }
    }

    public fillColorUniform(): (WebGLUniformLocation|null) {
        return this.fcUniform as any;
    }

    /**
     * Get the shader program handle
     * @private
     * @return {WebGLProgram}
     * The handle for the program
     */
    public getProgram(): (WebGLProgram|null|undefined) {
        return this.shaderProgram;
    }

    public pointSizeUniform(): (WebGLUniformLocation|null) {
        return this.psUniform as any;
    }

    public perspectiveUniform(): (WebGLUniformLocation|null) {
        return this.pUniform as any;
    }

    /**
     * Flush
     * @private
     */
    public reset(): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1i(this.isBubbleUniform as any, 0);
            this.gl.uniform1i(this.isCircleUniform as any, 0);
        }
    }

    /**
     * Set bubble uniforms
     * @private
     * @param {Highcharts.Series} series
     * Series to use
     */
    public setBubbleUniforms(
        series: BubbleSeries,
        zCalcMin: number,
        zCalcMax: number,
        pixelRatio = 1
    ): void {
        const seriesOptions = series.options;

        let zMin = Number.MAX_VALUE,
            zMax = -Number.MAX_VALUE;

        if (this.gl && this.shaderProgram && series.is('bubble')) {

            const pxSizes = series.getPxExtremes();

            zMin = pick(seriesOptions.zMin, clamp(
                zCalcMin,
                seriesOptions.displayNegative === false ?
                    (seriesOptions.zThreshold as any) : -Number.MAX_VALUE,
                zMin
            ));

            zMax = pick(seriesOptions.zMax, Math.max(zMax, zCalcMax));

            this.gl.uniform1i(this.isBubbleUniform as any, 1);
            this.gl.uniform1i(this.isCircleUniform as any, 1);
            this.gl.uniform1i(
                this.bubbleSizeAreaUniform as any,
                (series.options.sizeBy !== 'width') as any
            );
            this.gl.uniform1i(
                this.bubbleSizeAbsUniform as any,
                (series as BubbleSeries).options
                    .sizeByAbsoluteValue as any
            );

            this.setUniform('bubbleMinSize', pxSizes.minPxSize * pixelRatio);
            this.setUniform('bubbleMaxSize', pxSizes.maxPxSize * pixelRatio);
            this.setUniform('bubbleZMin', zMin);
            this.setUniform('bubbleZMax', zMax);
            this.setUniform(
                'bubbleZThreshold',
                series.options.zThreshold as any
            );
        }
    }

    /**
     * Set the Color uniform.
     * @private
     * @param {Array<number>} color
     * Array with RGBA values.
     */
    public setColor(color: Array<number>): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform4f(
                this.fcUniform as any,
                color[0] / 255.0,
                color[1] / 255.0,
                color[2] / 255.0,
                color[3]
            );
        }
    }

    /**
     * Enable/disable circle drawing
     * @private
     */
    public setDrawAsCircle(flag?: boolean): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1i(this.isCircleUniform as any, flag ? 1 : 0);
        }
    }

    /**
     * Set if inversion state
     * @private
     * @param {number} flag
     * Inversion flag
     */
    public setInverted(flag: number): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1i(this.isInverted as any, flag);
        }
    }

    /**
     * Set the perspective matrix
     * @private
     * @param {Float32List} m
     * Matrix 4 x 4
     */
    public setPMatrix(m: Float32List): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniformMatrix4fv(this.pUniform as any, false, m);
        }
    }

    /**
     * Set the point size.
     * @private
     * @param {number} p
     * Point size
     */
    public setPointSize(p: number): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1f(this.psUniform as any, p);
        }
    }

    /**
     * Set skip translation
     * @private
     */
    public setSkipTranslation(flag?: boolean): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1i(
                this.skipTranslationUniform as any, flag === true ? 1 : 0
            );
        }
    }

    /**
     * Set the active texture
     * @private
     * @param {number} texture
     * Texture to activate
     */
    public setTexture(texture: number): void {
        if (this.gl && this.shaderProgram) {
            this.gl.uniform1i(this.uSamplerUniform as any, texture);
        }
    }

    /**
     * Set a uniform value.
     * This uses a hash map to cache uniform locations.
     * @private
     * @param {string} name
     * Name of the uniform to set.
     * @param {number} val
     * Value to set
     */
    public setUniform(name: string, val: number): void {
        if (this.gl && this.shaderProgram) {
            const u = this.uLocations[name] = (
                this.uLocations[name] ||
                this.gl.getUniformLocation(
                    this.shaderProgram,
                    name
                )
            );

            this.gl.uniform1f(u, val);
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default WGLShader;
