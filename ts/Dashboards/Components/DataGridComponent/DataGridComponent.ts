/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Karol Kolodziej
 *  - Dawid Dragula
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Board from '../../Board';
import type Cell from '../../Layout/Cell';
import type { DataGrid, DataGridNamespace } from '../../Plugins/DataGridTypes';
import type Options from './DataGridComponentOptions';

import Component from '../Component.js';
import DataGridSyncs from './DataGridSyncs/DataGridSyncs.js';
import DataGridComponentDefaults from './DataGridComponentDefaults.js';
import U from '../../../Core/Utilities.js';
import DU from '../../Utilities.js';
import SidebarPopup from '../../EditMode/SidebarPopup';
const {
    merge,
    diffObjects,
    getStyle
} = U;
const { deepClone } = DU;

/* *
 *
 *  Class
 *
 * */

/**
 * DataGrid component for Highcharts Dashboards.
 * @private
 */
class DataGridComponent extends Component {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Predefined sync config for the DataGrid component.
     */
    public static predefinedSyncConfig = DataGridSyncs;

    /**
     * The namespace of the DataGrid component.
     */
    public static DataGridNamespace?: DataGridNamespace;

    /**
     * The default options for the DataGrid component.
     */
    public static defaultOptions = merge(
        Component.defaultOptions,
        DataGridComponentDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Function to create a DataGrid component from JSON.
     *
     * @param json
     * The JSON to create the DataGrid component from.
     *
     * @param cell
     * The cell to create the DataGrid component in.
     *
     * @returns
     * The DataGrid component created from the JSON.
     */
    public static fromJSON(
        json: DataGridComponent.ClassJSON,
        cell: Cell
    ): DataGridComponent {
        const options = json.options;
        const dataGridOptions = JSON.parse(json.options.dataGridOptions || '');

        const component = new DataGridComponent(
            cell,
            merge<Options>(options as any, { dataGridOptions })
        );

        component.emit({
            type: 'fromJSON',
            json
        });

        return component;
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * The DataGrid that is rendered in the DataGrid component.
     */
    public dataGrid?: DataGrid;

    /**
     * The options of the DataGrid component.
     */
    public options: Options;


    /* *
     *
     *  Constructor
     *
     * */

    constructor(
        cell: Cell,
        options: Partial<Options>,
        board?: Board
    ) {
        options = merge(DataGridComponent.defaultOptions, options);
        super(cell, options, board);

        this.options = options as Options;
        this.type = 'DataGrid';

        this.setOptions();
    }

    /* *
     *
     *  Functions
     *
     * */

    public override async update(options: Partial<Options>): Promise<void> {
        await super.update(options);
        this.setOptions();

        if (this.dataGrid) {
            this.dataGrid.update(this.options.dataGridOptions ?? {}, false);

            if (
                this.dataGrid?.viewport?.dataTable?.id !==
                this.getFirstConnector()?.table?.id
            ) {
                this.dataGrid.update({
                    dataTable: this.getFirstConnector()?.table?.modified
                }, false);
            }

            this.dataGrid.renderViewport();
        }

        this.emit({ type: 'afterUpdate' });
    }

    public override render(): this {
        super.render();
        if (!this.dataGrid) {
            this.dataGrid = this.constructDataGrid();
        } else {
            this.dataGrid.renderViewport();
        }

        if (this.dataGrid) {
            this.dataGrid.initContainerHeight =
                getStyle(
                    this.parentElement,
                    'height',
                    true
                ) || 0;
        }

        this.sync.start();
        this.emit({ type: 'afterRender' });
        return this;
    }

    public override resize(
        width?: number | string | null,
        height?: number | string | null
    ): void {
        if (height) {
            this.contentElement.style.minHeight = '0';
        } else if (height === null) {
            this.contentElement.style.removeProperty('min-height');
        }

        this.resizeDynamicContent(width, height);
        this.dataGrid?.viewport?.reflow();
    }

    public override onTableChanged(): void {
        this.dataGrid?.update({
            dataTable: this.getFirstConnector()?.table?.modified
        });
    }

    public getEditableOptions(): Options {
        const componentOptions = this.options;
        const dataGridOptions = this.dataGrid?.options;

        return deepClone(
            merge(
                {
                    dataGridOptions: dataGridOptions
                },
                componentOptions
            ),
            ['editableOptions', 'dataTable']
        );
    }

    public override getOptionsOnDrop(sidebar: SidebarPopup): Partial<Options> {
        const connectorsIds = sidebar.editMode.board.dataPool.getConnectorIds();
        let options: Partial<Options> = {
            cell: '',
            type: 'DataGrid'
        };

        if (connectorsIds.length) {
            options = {
                ...options,
                connector: {
                    id: connectorsIds[0]
                }
            };
        }

        return options;
    }

    /**
     * Get the DataGrid component's options.
     *
     * @returns
     * The JSON of DataGrid component's options.
     *
     * @internal
     */
    public override getOptions(): Partial<Options> {

        // Remove the table from the options copy if the connector is set.
        const optionsCopy = merge(this.options);
        if (optionsCopy.connector?.id) {
            delete optionsCopy.dataGridOptions?.dataTable;
        } else if (optionsCopy.dataGridOptions?.dataTable?.id) {
            optionsCopy.dataGridOptions.dataTable = {
                columns: optionsCopy.dataGridOptions.dataTable.columns
            };
        }

        return {
            ...diffObjects(optionsCopy, DataGridComponent.defaultOptions),
            type: 'DataGrid'
        };
    }


    /**
     * Destroys the data grid component.
     */
    public override destroy(): void {
        this.sync.stop();
        this.dataGrid?.destroy();
        super.destroy();
    }

    /**
     * Sets the options for the data grid component content container.
     */
    private setOptions(): void {
        if (this.options.dataGridClassName) {
            this.contentElement.classList.value =
                DataGridComponentDefaults.className + ' ' +
                this.options.dataGridClassName;
        }

        if (this.options.dataGridID) {
            this.contentElement.id = this.options.dataGridID;
        }
    }

    /**
     * Function to create the DataGrid.
     *
     * @returns The DataGrid.
     */
    private constructDataGrid(): DataGrid {
        const DGN = DataGridComponent.DataGridNamespace;
        if (!DGN) {
            throw new Error('DataGrid not connected.');
        }

        const dataTable = this.getFirstConnector()?.table;
        const dataGridOptions = this.options.dataGridOptions ?? {};
        if (dataTable) {
            dataGridOptions.dataTable = dataTable.modified;
        }

        const dataGridInstance =
            new DGN.DataGrid(this.contentElement, dataGridOptions);

        this.options.dataGridOptions = dataGridInstance.options;

        return dataGridInstance;
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace DataGridComponent {

    /* *
     *
     *  Declarations
     *
     * */

    /** @private */
    export type ComponentType = DataGridComponent;

    /** @private */
    export type ChartComponentEvents = JSONEvent | Component.EventTypes;

    /** @private */
    export type JSONEvent = Component.Event<
    'toJSON' | 'fromJSON',
    {
        json: ClassJSON;
    }
    >;

    /** @private */
    export interface ComponentJSONOptions
        extends Component.ComponentOptionsJSON {

        /** @private */
        dataGridOptions?: string;

        /** @private */
        dataGridClassName?: string;

        /** @private */
        chartID?: string;
    }

    /** @private */
    export interface ClassJSON extends Component.JSON {
        /** @private */
        options: ComponentJSONOptions;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default DataGridComponent;
