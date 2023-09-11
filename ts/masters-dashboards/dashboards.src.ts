/**
 * @license Highcharts Dashboards v@product.version@ (@product.date@)
 * @module dashboards/dashboards
 *
 * (c) 2009-2023 Highsoft AS
 *
 * License: www.highcharts.com/license
 */


'use strict';


/* *
 *
 *  Imports
 *
 * */


import DataConnector from '../Data/Connectors/DataConnector.js';
import Board from '../Dashboards/Board.js';
import Component from '../Dashboards/Components/Component.js';
import ComponentRegistry from '../Dashboards/Components/ComponentRegistry.js';
import DataPool from '../Data/DataPool.js';
import DataCursor from '../Data/DataCursor.js';
import DataModifier from '../Data/Modifiers/DataModifier.js';
import DataTable from '../Data/DataTable.js';
import Globals from '../Dashboards/Globals.js';
import PluginHandler from '../Dashboards/PluginHandler.js';
import Sync from '../Dashboards/Components/Sync/Sync.js';
import Utilities from '../Dashboards/Utilities.js';
import EventHelper from '../Shared/Helpers/EventHelper.js';

// Fill registries
import '../Data/Connectors/CSVConnector.js';
import '../Data/Connectors/JSONConnector.js';
import '../Data/Connectors/HTMLTableConnector.js';
import '../Data/Connectors/GoogleSheetsConnector.js';
import '../Data/Modifiers/ChainModifier.js';
import '../Data/Modifiers/InvertModifier.js';
import '../Data/Modifiers/RangeModifier.js';
import '../Data/Modifiers/SortModifier.js';


/* *
 *
 *  Declarations
 *
 * */


declare global {
    interface Dashboards {
        addEvent: typeof EventHelper.addEvent;
        board: typeof Board.board;
        boards: typeof Globals.boards;
        merge: typeof Utilities.merge;
        uniqueKey: typeof Utilities.uniqueKey;
        win: typeof Globals.win;
        Board: typeof Board;
        Component: typeof Component;
        ComponentRegistry: typeof ComponentRegistry;
        DataConnector: typeof DataConnector;
        DataCursor: typeof DataCursor;
        DataModifier: typeof DataModifier;
        DataPool: typeof DataPool;
        DataTable: typeof DataTable;
        PluginHandler: typeof PluginHandler;
        Sync: typeof Sync;
    }
    interface Window {
        Dashboards: Dashboards;
    }
    let Dashboards: Dashboards;
}


/* *
 *
 *  Namespace
 *
 * */


const G = Globals as unknown as Dashboards;

G.board = Board.board;
G.addEvent = EventHelper.addEvent;
G.merge = Utilities.merge;
G.uniqueKey = Utilities.uniqueKey;
G.Board = Board;
G.Component = Component;
G.ComponentRegistry = ComponentRegistry;
G.DataConnector = DataConnector;
G.DataCursor = DataCursor;
G.DataModifier = DataModifier;
G.DataPool = DataPool;
G.DataTable = DataTable;
G.PluginHandler = PluginHandler;
G.Sync = Sync;


/* *
 *
 *  Classic Export
 *
 * */


if (!G.win.Dashboards) {
    G.win.Dashboards = G;
}


/* *
 *
 *  Default Export
 *
 * */


export default G;
