/* *
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import BaseSeries from '../../Core/Series/Series.js';
var SMAIndicator = BaseSeries.seriesTypes.sma;
import U from '../../Core/Utilities.js';
var isArray = U.isArray, merge = U.merge;
// im port './SMAIndicator.js';
/* eslint-enable valid-jsdoc */
/* *
 *
 * Class
 *
 * */
/**
 * The ATR series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.atr
 *
 * @augments Highcharts.Series
 */
var ATRIndicator = /** @class */ (function (_super) {
    __extends(ATRIndicator, _super);
    function ATRIndicator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /* *
         *
         *  Properties
         *
         * */
        _this.data = void 0;
        _this.pointClass = void 0;
        _this.points = void 0;
        return _this;
    }
    /* *
     *
     *  Functions
     *
     * */
    ATRIndicator.prototype.accumulateAverage = function (points, xVal, yVal, i) {
        var xValue = xVal[i], yValue = yVal[i];
        points.push([xValue, yValue]);
    };
    ATRIndicator.prototype.getTR = function (currentPoint, prevPoint) {
        var pointY = currentPoint, prevY = prevPoint, HL = pointY[1] - pointY[2], HCp = typeof prevY === 'undefined' ? 0 : Math.abs(pointY[1] - prevY[3]), LCp = typeof prevY === 'undefined' ? 0 : Math.abs(pointY[2] - prevY[3]), TR = Math.max(HL, HCp, LCp);
        return TR;
    };
    ATRIndicator.prototype.populateAverage = function (points, xVal, yVal, i, period, prevATR) {
        var x = xVal[i - 1], TR = this.getTR(yVal[i - 1], yVal[i - 2]), y;
        y = (((prevATR * (period - 1)) + TR) / period);
        return [x, y];
    };
    ATRIndicator.prototype.getValues = function (series, params) {
        var period = params.period, xVal = series.xData, yVal = series.yData, yValLen = yVal ? yVal.length : 0, xValue = xVal[0], yValue = yVal[0], range = 1, prevATR = 0, TR = 0, ATR = [], xData = [], yData = [], point, i, points;
        points = [[xValue, yValue]];
        if ((xVal.length <= period) ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4) {
            return;
        }
        for (i = 1; i <= yValLen; i++) {
            this.accumulateAverage(points, xVal, yVal, i);
            if (period < range) {
                point = this.populateAverage(points, xVal, yVal, i, period, prevATR);
                prevATR = point[1];
                ATR.push(point);
                xData.push(point[0]);
                yData.push(point[1]);
            }
            else if (period === range) {
                prevATR = TR / (i - 1);
                ATR.push([xVal[i - 1], prevATR]);
                xData.push(xVal[i - 1]);
                yData.push(prevATR);
                range++;
            }
            else {
                TR += this.getTR(yVal[i - 1], yVal[i - 2]);
                range++;
            }
        }
        return {
            values: ATR,
            xData: xData,
            yData: yData
        };
    };
    /**
     * Average true range indicator (ATR). This series requires `linkedTo`
     * option to be set.
     *
     * @sample stock/indicators/atr
     *         ATR indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/atr
     * @optionparent plotOptions.atr
     */
    ATRIndicator.defaultOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            period: 14
        }
    });
    return ATRIndicator;
}(SMAIndicator));
;
BaseSeries.registerSeriesType('atr', ATRIndicator);
/* *
 *
 *  Default Export
 *
 * */
export default ATRIndicator;
/**
 * A `ATR` series. If the [type](#series.atr.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.atr
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/atr
 * @apioption series.atr
 */
''; // to include the above in the js output
