/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Accessibility module for Highcharts
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type Chart from '../Core/Chart/Chart';
import type SeriesOptions from '../Core/Series/SeriesOptions';
import ChartUtilities from './Utils/ChartUtilities.js';
import H from '../Core/Globals.js';
const {
    doc
} = H;
import KeyboardNavigationHandler from './KeyboardNavigationHandler.js';
import O from '../Core/Options.js';
const {
    defaultOptions
} = O;
import Point from '../Core/Series/Point.js';
import Series from '../Core/Series/Series.js';
import U from '../Core/Utilities.js';
const {
    addEvent,
    extend,
    fireEvent,
    merge
} = U;

declare module '../Core/Chart/ChartLike' {
    interface ChartLike {
        a11yDirty?: boolean;
        accessibility?: Highcharts.Accessibility;
        types?: Array<string>;
        /** @require modules/accessibility */
        updateA11yEnabled(): void;
    }
}

/**
 * Internal types.
 * @private
 */
declare global {
    namespace Highcharts {
        class Accessibility {
            public constructor(chart: AccessibilityChart);
            public chart: AccessibilityChart;
            public components: AccessibilityComponentsObject;
            public keyboardNavigation: KeyboardNavigation;
            public destroy(): void;
            public getChartTypes(): Array<string>;
            public init(chart: Chart): void;
            public initComponents(): void;
            public getComponentOrder(): Array<string>;
            public update(): void;
        }
        interface AccessibilityComponentsObject {
            [key: string]: AccessibilityComponent;
            container: ContainerComponent;
            infoRegions: InfoRegionsComponent;
            legend: LegendComponent;
            chartMenu: MenuComponent;
            rangeSelector: RangeSelectorComponent;
            series: SeriesComponent;
            zoom: ZoomComponent;
        }
        interface AccessibilityChart extends Chart {
            options: Required<Options>;
            series: Array<AccessibilitySeries>;
        }
        interface AccessibilityPoint extends Point {
            series: AccessibilitySeries;
        }
        interface AccessibilitySeries extends Series {
            chart: AccessibilityChart;
            options: Required<SeriesOptions>;
            points: Array<AccessibilityPoint>;
        }
        let A11yChartUtilities: A11yChartUtilities;
        let A11yHTMLUtilities: typeof HTMLUtilities;
    }
}

import AccessibilityComponent from './AccessibilityComponent.js';
import KeyboardNavigation from './KeyboardNavigation.js';
import LegendComponent from './Components/LegendComponent.js';
import MenuComponent from './Components/MenuComponent.js';
import SeriesComponent from './Components/SeriesComponent/SeriesComponent.js';
import ZoomComponent from './Components/ZoomComponent.js';
import RangeSelectorComponent from './Components/RangeSelectorComponent.js';
import InfoRegionsComponent from './Components/InfoRegionsComponent.js';
import ContainerComponent from './Components/ContainerComponent.js';
import whcm from './HighContrastMode.js';
import highContrastTheme from './HighContrastTheme.js';
import defaultOptionsA11Y from './Options/Options.js';
import defaultLangOptions from './Options/LangOptions.js';
import copyDeprecatedOptions from './Options/DeprecatedOptions.js';
import HTMLUtilities from './Utils/HTMLUtilities.js';
import './A11yI18n.js';
import './FocusBorder.js';


// Add default options
merge(
    true,
    defaultOptions,
    defaultOptionsA11Y,
    {
        accessibility: {
            highContrastTheme: highContrastTheme
        },
        lang: defaultLangOptions
    }
);


// Expose functionality on Highcharts namespace
H.A11yChartUtilities = ChartUtilities;
H.A11yHTMLUtilities = HTMLUtilities;
H.KeyboardNavigationHandler = KeyboardNavigationHandler as any;
H.AccessibilityComponent = AccessibilityComponent as any;

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * The Accessibility class
 *
 * @private
 * @requires module:modules/accessibility
 *
 * @class
 * @name Highcharts.Accessibility
 */
function Accessibility(
    this: Highcharts.Accessibility
): void {
    // Separate init function to allow for setting events on
    // itself during init
}

Accessibility.prototype = {

    /**
     * Initialize the accessibility class
     * @private
     * @param {Highcharts.Chart} chart
     *        Chart object
     */
    init: function (
        this: Highcharts.Accessibility,
        chart: Chart
    ): void {
        this.chart = chart as any;

        // Abort on old browsers
        if (!doc.addEventListener || !chart.renderer.isSVG) {
            chart.renderTo.setAttribute('aria-hidden', true);
            return;
        }

        // Copy over any deprecated options that are used. We could do this on
        // every update, but it is probably not needed.
        copyDeprecatedOptions(chart);

        this.initComponents();
        this.keyboardNavigation = new (KeyboardNavigation as any)(
            chart, this.components
        );
        this.update();
    },


    /**
     * @private
     */
    initComponents: function (this: Highcharts.Accessibility): void {
        const chart = this.chart,
            a11yOptions = chart.options.accessibility;

        this.components = {
            container: new ContainerComponent(),
            infoRegions: new InfoRegionsComponent(),
            legend: new LegendComponent(),
            chartMenu: new MenuComponent(),
            rangeSelector: new RangeSelectorComponent(),
            series: new SeriesComponent(),
            zoom: new ZoomComponent()
        };

        if (a11yOptions.customComponents) {
            extend(this.components, a11yOptions.customComponents);
        }

        const components = this.components;
        this.getComponentOrder().forEach(function (componentName: string): void {
            components[componentName].initBase(chart);
            components[componentName].init();
        });
    },


    /**
     * Get order to update components in.
     * @private
     */
    getComponentOrder: function (this: Highcharts.Accessibility): string[] {
        if (!this.components) {
            return []; // For zombie accessibility object on old browsers
        }

        if (!this.components.series) {
            return Object.keys(this.components);
        }

        const componentsExceptSeries = Object.keys(this.components)
            .filter((c): boolean => c !== 'series');

        // Update series first, so that other components can read accessibility
        // info on points.
        return ['series'].concat(componentsExceptSeries);
    },


    /**
     * Update all components.
     */
    update: function (this: Highcharts.Accessibility): void {
        var components = this.components,
            chart = this.chart,
            a11yOptions = chart.options.accessibility;

        fireEvent(chart, 'beforeA11yUpdate');

        // Update the chart type list as this is used by multiple modules
        chart.types = this.getChartTypes();

        // Update markup
        this.getComponentOrder().forEach(function (componentName: string): void {
            components[componentName].onChartUpdate();

            fireEvent(chart, 'afterA11yComponentUpdate', {
                name: componentName,
                component: components[componentName]
            });
        });

        // Update keyboard navigation
        this.keyboardNavigation.update(
            (a11yOptions.keyboardNavigation as any).order
        );

        // Handle high contrast mode
        if (
            !chart.highContrastModeActive && // Only do this once
            whcm.isHighContrastModeActive()
        ) {
            whcm.setHighContrastTheme(chart);
        }

        fireEvent(chart, 'afterA11yUpdate', {
            accessibility: this
        });
    },


    /**
     * Destroy all elements.
     */
    destroy: function (): void {
        var chart: Chart = this.chart || {};

        // Destroy components
        var components = this.components;
        Object.keys(components).forEach(function (componentName: string): void {
            components[componentName].destroy();
            components[componentName].destroyBase();
        });

        // Kill keyboard nav
        if (this.keyboardNavigation) {
            this.keyboardNavigation.destroy();
        }

        // Hide container from screen readers if it exists
        if (chart.renderTo) {
            chart.renderTo.setAttribute('aria-hidden', true);
        }

        // Remove focus border if it exists
        if (chart.focusElement) {
            chart.focusElement.removeFocusBorder();
        }
    },


    /**
     * Return a list of the types of series we have in the chart.
     * @private
     */
    getChartTypes: function (this: Highcharts.Accessibility): Array<string> {
        var types: Record<string, number> = {};
        this.chart.series.forEach(function (series): void {
            types[series.type] = 1;
        });
        return Object.keys(types);
    }
};


/**
 * @private
 */
H.Chart.prototype.updateA11yEnabled = function (): void {
    var a11y = this.accessibility,
        accessibilityOptions = this.options.accessibility;
    if (accessibilityOptions && accessibilityOptions.enabled) {
        if (a11y) {
            a11y.update();
        } else {
            this.accessibility = a11y = new (Accessibility as any)();
            (a11y as Highcharts.Accessibility).init(this);
        }
    } else if (a11y) {
        // Destroy if after update we have a11y and it is disabled
        if (a11y.destroy) {
            a11y.destroy();
        }
        delete this.accessibility;
    } else {
        // Just hide container
        this.renderTo.setAttribute('aria-hidden', true);
    }
};

// Handle updates to the module and send render updates to components
addEvent(H.Chart, 'render', function (e: Event): void {
    // Update/destroy
    if (this.a11yDirty && this.renderTo) {
        delete this.a11yDirty;
        this.updateA11yEnabled();
    }

    const a11y = this.accessibility;
    if (a11y) {
        a11y.getComponentOrder().forEach(function (
            componentName: string
        ): void {
            a11y.components[componentName].onChartRender();
        });
    }
});

// Update with chart/series/point updates
addEvent(H.Chart as any, 'update', function (
    this: Highcharts.AccessibilityChart,
    e: { options: Highcharts.Options }
): void {
    // Merge new options
    var newOptions = e.options.accessibility;
    if (newOptions) {
        // Handle custom component updating specifically
        if (newOptions.customComponents) {
            this.options.accessibility.customComponents =
                newOptions.customComponents;
            delete newOptions.customComponents;
        }
        merge(true, this.options.accessibility, newOptions);
        // Recreate from scratch
        if (this.accessibility && this.accessibility.destroy) {
            this.accessibility.destroy();
            delete this.accessibility;
        }
    }

    // Mark dirty for update
    this.a11yDirty = true;
});

// Mark dirty for update
addEvent(Point, 'update', function (): void {
    if (this.series.chart.accessibility) {
        this.series.chart.a11yDirty = true;
    }
});
['addSeries', 'init'].forEach(function (event: string): void {
    addEvent(H.Chart, event, function (): void {
        this.a11yDirty = true;
    });
});
['update', 'updatedData', 'remove'].forEach(function (event: string): void {
    addEvent(Series, event, function (): void {
        if (this.chart.accessibility) {
            this.chart.a11yDirty = true;
        }
    });
});

// Direct updates (events happen after render)
[
    'afterDrilldown', 'drillupall'
].forEach(function (event: string): void {
    addEvent(H.Chart, event, function (): void {
        if (this.accessibility) {
            this.accessibility.update();
        }
    });
});

// Destroy with chart
addEvent(H.Chart, 'destroy', function (): void {
    if (this.accessibility) {
        this.accessibility.destroy();
    }
});
