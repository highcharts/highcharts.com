/**
 *
 *  (c) 2010-2021 Wojciech Chmiel
 *
 *  License: www.highcharts.com/license
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

import type LinePoint from '../../Series/Line/LinePoint';
import type Point from '../../Core/Series/Point';
import type SMAIndicator from './SMA/SMAIndicator';
import type SMAOptions from './SMA/SMAOptions';
import type SMAPoint from './SMA/SMAPoint';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    sma: { prototype: smaProto }
} = SeriesRegistry.seriesTypes;
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
import error from '../../Shared/Helpers/Error.js';
const {
    pushUnique
} = AH;
const { defined, merge } = OH;

/* *
 *
 *  Composition
 *
 * */

namespace MultipleLinesComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class IndicatorComposition extends SMAIndicator {
        areaLinesNames: Array<string>;
        linesApiNames: Array<string>;
        nextPoints?: Array<SMAPoint>;
        options: IndicatorOptions;
        pointArrayMap: Array<keyof this['pointClass']['prototype']>;
        pointValKey: string;
    }

    export interface IndicatorOptions extends SMAOptions {
        fillColor?: SVGAttributes['fill'];
        gapSize?: number;
    }

    /* *
    *
    *  Constants
    *
    * */

    const composedMembers: Array<unknown> = [];

    /**
     * Additional lines DOCS names. Elements of linesApiNames array should
     * be consistent with DOCS line names defined in your implementation.
     * Notice that linesApiNames should have decreased amount of elements
     * relative to pointArrayMap (without pointValKey).
     *
     * @private
     * @type {Array<string>}
     */
    const linesApiNames = ['bottomLine'];

    /**
     * Lines ids. Required to plot appropriate amount of lines.
     * Notice that pointArrayMap should have more elements than
     * linesApiNames, because it contains main line and additional lines ids.
     * Also it should be consistent with amount of lines calculated in
     * getValues method from your implementation.
     *
     * @private
     * @type {Array<string>}
     */
    const pointArrayMap = ['top', 'bottom'];

    /**
     * Names of the lines, bewteen which the area should be plotted.
     * If the drawing of the area should
     * be disabled for some indicators, leave this option as an empty array.
     * Names should be the same as the names in the pointArrayMap.
     *
     * @private
     * @type {Array<string>}
     */
    const areaLinesNames: Array<string> = ['top'];

    /**
     * Main line id.
     *
     * @private
     * @type {string}
     */
    const pointValKey = 'top';

    /* *
    *
    *  Functions
    *
    * */

    /**
     * Composition useful for all indicators that have more than one line.
     * Compose it with your implementation where you will provide the
     * `getValues` method appropriate to your indicator and `pointArrayMap`,
     * `pointValKey`, `linesApiNames` properties. Notice that `pointArrayMap`
     * should be consistent with the amount of lines calculated in the
     * `getValues` method.
     *
     * @private
     */
    export function compose<T extends typeof SMAIndicator>(
        IndicatorClass: T
    ): (T&typeof IndicatorComposition) {

        if (pushUnique(composedMembers, IndicatorClass)) {
            const proto = IndicatorClass.prototype as IndicatorComposition;

            proto.linesApiNames = (
                proto.linesApiNames ||
                linesApiNames.slice()
            );
            proto.pointArrayMap = (
                proto.pointArrayMap ||
                pointArrayMap.slice()
            );
            proto.pointValKey = (
                proto.pointValKey ||
                pointValKey
            );

            proto.areaLinesNames = (
                proto.areaLinesNames ||
                areaLinesNames.slice()
            );

            proto.drawGraph = indicatorDrawGraph;
            proto.getGraphPath = indicatorGetGraphPath;
            proto.toYData = indicatorToYData;
            proto.translate = indicatorTranslate;
        }

        return IndicatorClass as (T&typeof IndicatorComposition);
    }

    /**
     * Generate the API name of the line
     *
     * @private
     * @param propertyName name of the line
     */
    function getLineName(
        propertyName: string
    ): keyof Point {
        return (
            'plot' +
            propertyName.charAt(0).toUpperCase() +
            propertyName.slice(1)
        ) as keyof Point;
    }

    /**
     * Create translatedLines Collection based on pointArrayMap.
     *
     * @private
     * @param {string} [excludedValue]
     *        Main line id
     * @return {Array<string>}
     *         Returns translated lines names without excluded value.
     */
    function getTranslatedLinesNames(
        indicator: SMAIndicator,
        excludedValue?: string
    ): Array<keyof Point> {
        const translatedLines: Array<keyof Point> = [];

        (indicator.pointArrayMap || []).forEach((propertyName): void => {
            if (propertyName !== excludedValue) {
                translatedLines.push(getLineName(propertyName));
            }
        });

        return translatedLines;
    }

    /**
     * Draw main and additional lines.
     *
     * @private
     */
    function indicatorDrawGraph(
        this: SMAIndicator
    ): void {
        const indicator = this as IndicatorComposition,
            pointValKey = indicator.pointValKey,
            linesApiNames = indicator.linesApiNames,
            areaLinesNames = indicator.areaLinesNames,
            mainLinePoints = indicator.points,
            mainLineOptions = indicator.options,
            mainLinePath = indicator.graph,
            gappedExtend = {
                options: {
                    gapSize: mainLineOptions.gapSize
                }
            },
            // additional lines point place holders:
            secondaryLines = [] as Array<Array<SMAPoint>>,
            secondaryLinesNames = getTranslatedLinesNames(
                indicator,
                pointValKey
            );

        let pointsLength = mainLinePoints.length,
            point;


        // Generate points for additional lines:
        secondaryLinesNames.forEach((plotLine, index): void => {

            // create additional lines point place holders
            secondaryLines[index] = [];

            while (pointsLength--) {
                point = mainLinePoints[pointsLength];
                secondaryLines[index].push({
                    x: point.x,
                    plotX: point.plotX,
                    plotY: point[plotLine] as number,
                    isNull: !defined(point[plotLine])
                } as any);
            }

            pointsLength = mainLinePoints.length;
        });

        // Modify options and generate area fill:
        if (indicator.userOptions.fillColor && areaLinesNames.length) {
            const index = secondaryLinesNames.indexOf(
                    getLineName(areaLinesNames[0])
                ),
                secondLinePoints = secondaryLines[index],
                firstLinePoints =
                    areaLinesNames.length === 1 ?
                        mainLinePoints :
                        secondaryLines[
                            secondaryLinesNames.indexOf(
                                getLineName(areaLinesNames[1])
                            )
                        ],
                originalColor = indicator.color;
            indicator.points = firstLinePoints;
            indicator.nextPoints = secondLinePoints;
            indicator.color = (
                indicator.userOptions.fillColor as SVGAttributes['fill']
            );
            indicator.options = merge(
                mainLinePoints,
                gappedExtend
            ) as any;
            indicator.graph = indicator.area;
            indicator.fillGraph = true;
            smaProto.drawGraph.call(indicator);

            indicator.area = indicator.graph;
            // Clean temporary properties:
            delete indicator.nextPoints;
            delete indicator.fillGraph;
            indicator.color = originalColor;
        }

        // Modify options and generate additional lines:
        linesApiNames.forEach((lineName, i): void => {
            if (secondaryLines[i]) {
                indicator.points = secondaryLines[i];
                if ((mainLineOptions as any)[lineName]) {
                    indicator.options = merge(
                        (mainLineOptions as any)[lineName].styles,
                        gappedExtend
                    );
                } else {
                    error(
                        'Error: "There is no ' + lineName +
                        ' in DOCS options declared. Check if linesApiNames' +
                        ' are consistent with your DOCS line names."'
                    );
                }
                indicator.graph = (indicator as any)['graph' + lineName];
                smaProto.drawGraph.call(indicator);

                // Now save lines:
                (indicator as any)['graph' + lineName] = indicator.graph;
            } else {
                error(
                    'Error: "' + lineName + ' doesn\'t have equivalent ' +
                    'in pointArrayMap. To many elements in linesApiNames ' +
                    'relative to pointArrayMap."'
                );
            }
        });

        // Restore options and draw a main line:
        indicator.points = mainLinePoints;
        indicator.options = mainLineOptions;
        indicator.graph = mainLinePath;
        smaProto.drawGraph.call(indicator);
    }

    /**
     * Create the path based on points provided as argument.
     * If indicator.nextPoints option is defined, create the areaFill.
     *
     * @private
     * @param points Points on which the path should be created
     */
    function indicatorGetGraphPath(
        this: IndicatorComposition,
        points: Array<LinePoint>
    ): SVGPath {
        let areaPath: SVGPath,
            path: SVGPath = [],
            higherAreaPath: SVGPath = [];

        points = points || this.points;

        // Render Span
        if (this.fillGraph && this.nextPoints) {
            areaPath = smaProto.getGraphPath.call(this, this.nextPoints);

            if (areaPath && areaPath.length) {
                areaPath[0][0] = 'L';

                path = smaProto.getGraphPath.call(this, points);

                higherAreaPath = areaPath.slice(0, path.length);

                // Reverse points, so that the areaFill will start from the end:
                for (let i = higherAreaPath.length - 1; i >= 0; i--) {
                    path.push(higherAreaPath[i]);
                }
            }
        } else {
            path = smaProto.getGraphPath.apply(this, arguments);
        }
        return path;
    }

    /**
     * @private
     * @param {Highcharts.Point} point
     *        Indicator point
     * @return {Array<number>}
     *         Returns point Y value for all lines
     */
    function indicatorToYData(
        this: IndicatorComposition,
        point: Point
    ): Array<number> {
        const pointColl: Array<number> = [];

        (this.pointArrayMap || []).forEach((propertyName): void => {
            pointColl.push(point[propertyName] as number);
        });

        return pointColl;
    }

    /**
     * Add lines plot pixel values.
     *
     * @private
     */
    function indicatorTranslate(
        this: IndicatorComposition
    ): void {
        const pointArrayMap = this.pointArrayMap;

        let LinesNames: Array<keyof Point> = [],
            value: number;

        LinesNames = getTranslatedLinesNames(this);

        smaProto.translate.apply(this, arguments);

        this.points.forEach((point): void => {
            pointArrayMap.forEach((propertyName, i): void => {
                value = point[propertyName] as number;

                // If the modifier, like for example compare exists,
                // modified the original value by that method, #15867.
                if (this.dataModify) {
                    value = this.dataModify.modifyValue(value);
                }

                if (value !== null) {
                    (point as any)[LinesNames[i]] = this.yAxis.toPixels(
                        value,
                        true
                    );
                }
            });
        });
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default MultipleLinesComposition;
