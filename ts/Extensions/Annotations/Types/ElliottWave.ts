/* *
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

import type {
    ControllableLabelOptions
} from '../Controllables/ControllableOptions';
import type ColorType from '../../../Core/Color/ColorType';

import Annotation from '../Annotation.js';
import CrookedLine from './CrookedLine.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

class ElliottWave extends CrookedLine {

    /* *
     *
     * Functions
     *
     * */

    public addLabels(): void {
        this.getPointsOptions().forEach((point, i): void => {
            const typeOptions = (
                    this.options.typeOptions as ElliottWave.TypeOptions
                ),
                label = this.initLabel(merge(
                    point.label, {
                        text: typeOptions.labels[i],
                        point: function (target: any): any {
                            return target.annotation.points[i];
                        }
                    }
                ), false as any);

            point.label = label.options;
        });
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface ElliottWave {
    defaultOptions: CrookedLine['defaultOptions'];
}

ElliottWave.prototype.defaultOptions = merge(
    CrookedLine.prototype.defaultOptions,
    /**
     * An elliott wave annotation.
     *
     * @sample highcharts/annotations-advanced/elliott-wave/
     *         Elliott wave
     *
     * @extends      annotations.crookedLine
     * @product      highstock
     * @optionparent annotations.elliottWave
     */
    {
        typeOptions: {

            /**
             * @extends   annotations.crookedLine.labelOptions
             * @apioption annotations.elliottWave.typeOptions.points.label
             */

            /**
             * @ignore-option
             */
            labels: ['(0)', '(A)', '(B)', '(C)', '(D)', '(E)'],
            line: {
                strokeWidth: 1
            }
        },

        labelOptions: {
            align: 'center',
            allowOverlap: true,
            crop: true,
            overflow: 'none' as any,
            type: 'rect',
            backgroundColor: 'none',
            borderWidth: 0,
            y: -5
        }
    }
);

/* *
 *
 *  Class Namespace
 *
 * */

namespace ElliottWave {
    export interface LabelOptions extends ControllableLabelOptions {
        backgroundColor: ColorType;
        borderWidth: number;
        y: number;
    }
    export interface Options extends CrookedLine.Options {
        labelOptions: LabelOptions;
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends CrookedLine.TypeOptions {
        labels: Array<string>;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType' {
    interface AnnotationTypeRegistry {
        elliottWave: typeof ElliottWave;
    }
}

Annotation.types.elliottWave = ElliottWave;

/* *
 *
 *  Default Export
 *
 * */

export default ElliottWave;
