/**
 * @license Highcharts Dashboards v@product.version@ (@product.date@)
 * @module datagrid/datagrid
 *
 * (c) 2009-2024 Highsoft AS
 *
 * License: www.highcharts.com/license
 */


'use strict';


/* *
 *
 *  Imports
 *
 * */


import AST from '../Core/Renderer/HTML/AST.js';
import DataConnector from '../Data/Connectors/DataConnector.js';
import DataConverter from '../Data/Converters/DataConverter.js';
import DataCursor from '../Data/DataCursor.js';
import _DataGrid from '../DataGrid/DataGrid.js';
import DataModifier from '../Data/Modifiers/DataModifier.js';
import DataPool from '../Data/DataPool.js';
import DataTable from '../Data/DataTable.js';
import Defaults from '../DataGrid/Defaults.js';
import Globals from '../DataGrid/Globals.js';
import whcm from '../Accessibility/HighContrastMode.js';
import _Validator from '../DataGrid/Table/ColumnTypes/Validator.js';

// Fill registries
import '../Data/Connectors/CSVConnector.js';
import '../Data/Connectors/GoogleSheetsConnector.js';
import '../Data/Connectors/HTMLTableConnector.js';
import '../Data/Connectors/JSONConnector.js';
import '../Data/Modifiers/ChainModifier.js';
import '../Data/Modifiers/InvertModifier.js';
import '../Data/Modifiers/RangeModifier.js';
import '../Data/Modifiers/SortModifier.js';

/* *
 *
 *  Declarations
 *
 * */


type GlobalsType = typeof Globals;

declare global {
    interface DataGridNamespace extends GlobalsType {
        AST: typeof AST;
        DataGrid: typeof _DataGrid;
        dataGrid: typeof _DataGrid.dataGrid;
        dataGrids: Array<(_DataGrid|undefined)>;
        DataConverter: typeof DataConverter;
        DataCursor: typeof DataCursor;
        DataModifier: typeof DataModifier;
        DataConnector: typeof DataConnector;
        DataPool: typeof DataPool;
        DataTable: typeof DataTable;
        isHighContrastModeActive: typeof whcm.isHighContrastModeActive;
        defaultOptions: typeof Defaults.defaultOptions;
        setOptions: typeof Defaults.setOptions;
        validator: typeof _Validator;
    }
    interface Window {
        DataGrid: DataGridNamespace;
    }
    let DataGrid: DataGridNamespace;
}


/* *
 *
 *  Namespace
 *
 * */


const G = Globals as DataGridNamespace;

G.AST = AST;
G.DataConnector = DataConnector;
G.DataCursor = DataCursor;
G.DataConverter = DataConverter;
G.DataGrid = _DataGrid;
G.dataGrid = _DataGrid.dataGrid;
G.dataGrids = _DataGrid.dataGrids;
G.DataModifier = DataModifier;
G.DataPool = DataPool;
G.DataTable = DataTable;
G.defaultOptions = Defaults.defaultOptions;
G.setOptions = Defaults.setOptions;
G.isHighContrastModeActive = whcm.isHighContrastModeActive;
G.validator = _Validator;


/* *
 *
 *  Classic Export
 *
 * */


if (!G.win.DataGrid) {
    G.win.DataGrid = G;
}


/* *
 *
 *  Default Export
 *
 * */


export default G;
