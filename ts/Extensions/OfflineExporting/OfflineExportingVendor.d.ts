/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type G from '../../Core/Globals';

/* *
 *
 *  Declarations
 *
 * */

declare global {
    interface Canvg {
        fromString(
            ctx: CanvasRenderingContext2D,
            svg: string
        ): Canvg;
        start(): void;
    }
    interface CanvgNamespace {
        Canvg: Canvg;
    }
    interface Window {
        canvg: CanvgNamespace;
        jspdf: jspdf;
        svg2pdf: Function;
    }

    interface jspdf {
        jsPDF: typeof jsPDF;
    }

    interface JsPDFEventFunction {
        (
            this: jsPDF
        ): void
    }

    interface JsPDFEvent {
        0: string;
        1: JsPDFEventFunction;
    }

    interface JsPDFAPI {
        events: JsPDFEvent[];
    }
    class jsPDF {
        static API: JsPDFAPI;
        constructor(a: string, b: string, c: Array<number>);
        addFileToVFS(
            filename: string,
            data: string
        ): void;
        addFont(
            postScriptName: string,
            id: string,
            fontStyle: 'bold'|'bolditalic'|'italic'|'normal',
            fontWeight?: number|string
        ): void;
        output: Function;
        setFont(fontFamily: string): void;
        svg(
            svgElement: SVGElement,
            options: AnyRecord
        ): Promise<jsPDF>;
    }
}
