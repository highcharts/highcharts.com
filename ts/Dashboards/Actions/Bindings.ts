/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    ComponentType,
    ComponentTypeRegistry
} from '../Components/ComponentType';
import type Board from '../Board';
import type GUIElement from '../Layout/GUIElement';
import type Cell from '../Layout/Cell';
import type Layout from '../Layout/Layout';
import type Row from '../Layout/Row';
import type Component from '../Components/Component.js';

import ComponentRegistry from '../Components/ComponentRegistry.js';
import CellHTML from '../Layout/CellHTML.js';
import Globals from '../Globals.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    fireEvent
} = U;

/* *
 *
 *  Namespace
 *
 * */

namespace Bindings {

    /* *
     *
     *  Declarations
     *
     * */

    export interface MountedComponent {
        cell: Cell|CellHTML;
        component: ComponentType;
        options: Partial<Component.Options>;
    }

    /* *
     *
     *  Functions
     *
     * */

    function getGUIElement(
        idOrElement: string,
        parentElement?: HTMLElement
    ): Cell|Row|Layout|undefined {
        let guiElement;

        if (
            typeof idOrElement === 'string' &&
            document.querySelectorAll('#' + idOrElement).length > 1
        ) {
            // eslint-disable-next-line no-console
            console.warn(
                `Multiple cells have identical ID %c${idOrElement}%c, potentially leading to unexpected behavior. \nEnsure that each cell has a unique ID on the page.`,
                'font-weight: bold',
                ''
            );
        }

        const container = parentElement ?
            parentElement.querySelector('#' + idOrElement) :
            document.getElementById(idOrElement);

        if (container !== null) {
            fireEvent(container, 'bindedGUIElement', {}, function (
                e: GUIElement.BindedGUIElementEvent
            ): void {
                guiElement = e.guiElement;
            });
        }

        return guiElement;
    }

    export async function addComponent(
        options: Partial<ComponentType['options']>,
        board: Board,
        cell?: Cell
    ): Promise<(Component|void)> {
        const optionsStates = options.states;
        const optionsEvents = options.events;
        const renderTo = options.renderTo || options.cell;

        if (!renderTo) {
            // eslint-disable-next-line no-console
            console.error(
                'The%c renderTo%c option is required to render the component.',
                'font-weight: bold',
                ''
            );
            return;
        }

        if (
            board.mountedComponents.filter(
                (el): boolean => (
                    (el.options.renderTo || el.options.cell) === renderTo)
            ).length > 0
        ) {
            // eslint-disable-next-line no-console
            console.error(
                `A component has already been declared in the cell %c${renderTo}%c use a different cell.`,
                'font-weight: bold',
                ''
            );
            return;
        }

        cell = cell || Bindings.getCell(renderTo, board.container);

        const componentContainer =
            cell?.container || document.querySelector('#' + renderTo);

        if (!componentContainer || !options.type) {
            // eslint-disable-next-line no-console
            console.error(
                `The component is unable to find the HTML cell element %c${renderTo}%c to render the content.`,
                'font-weight: bold',
                ''
            );
            return;
        }

        let ComponentClass =
            ComponentRegistry.types[options.type] as Class<ComponentType>;

        if (!ComponentClass) {
            // eslint-disable-next-line no-console
            console.error(
                `The component's type %c${options.type}%c does not exist.`,
                'font-weight: bold',
                ''
            );

            if (cell) {
                ComponentClass =
                    ComponentRegistry.types['HTML'] as Class<ComponentType>;

                options.title = {
                    text: board.editMode?.lang.errorMessage ||
                        'Something went wrong',
                    className:
                        Globals.classNamePrefix + 'component-title-error ' +
                        Globals.classNamePrefix + 'component-title'
                };
            }
        }

        const component = new ComponentClass(cell, options, board);
        const promise = component.load()['catch']((e): void => {
            // eslint-disable-next-line no-console
            console.error(e);
            component.update({
                connector: {
                    id: ''
                },
                title: {
                    text: board.editMode?.lang.errorMessage ||
                        'Something went wrong',
                    className:
                        Globals.classNamePrefix + 'component-title-error ' +
                        Globals.classNamePrefix + 'component-title'
                }
            });
        });

        if (cell) {
            component.setCell(cell);
            cell.mountedComponent = component;
        }

        board.mountedComponents.push({
            options: options,
            component: component,
            cell: cell || new CellHTML({
                id: renderTo,
                container: componentContainer as HTMLElement,
                mountedComponent: component
            })
        });

        if (
            cell &&
            optionsStates?.active?.enabled &&
            optionsStates?.active?.isActive
        ) {
            cell.setActiveState();
            component.isActive = true;
        }

        fireEvent(component, 'mount');

        // Events
        addEvent(componentContainer, 'click', ():void => {
            const isEditMode = board.editMode?.isContextDetectionActive;
            // Call the component's click callback
            if (optionsEvents && optionsEvents.click) {
                optionsEvents.click.call(component);
            }

            // Default behavior
            if (
                cell &&
                component &&
                componentContainer &&
                optionsStates?.active?.enabled &&
                !isEditMode
            ) {
                cell.setActiveState();
                component.isActive = true;
            }
        });


        // States
        if (optionsStates?.hover?.enabled) {
            componentContainer.classList.add(Globals.classNames.cellHover);
        }

        fireEvent(component, 'afterLoad');

        return promise;
    }

    /** @internal */
    export function componentFromJSON(
        json: Component.JSON
    ): (Component|undefined) {
        const componentClass = ComponentRegistry.types[
            json.$class as keyof ComponentTypeRegistry
        ];

        if (!componentClass) {
            return;
        }

        const cell = Bindings.getCell(json.options.renderTo || '');
        if (!cell) {
            return;
        }
        const component = componentClass.fromJSON(json as any, cell);

        if (component) {
            component.render();
        }

        return component;
    }

    export function getCell(
        idOrElement: string,
        parentElement?: HTMLElement
    ): (Cell|undefined) {
        const cell = getGUIElement(idOrElement, parentElement);

        if (!(cell && cell.getType() === 'cell')) {
            return;
        }

        return (cell as Cell);
    }

    export function getRow(
        idOrElement: string,
        parentElement?: HTMLElement
    ): (Row|undefined) {
        const row = getGUIElement(idOrElement, parentElement);

        if (!(row && row.getType() === 'row')) {
            return;
        }

        return (row as Row);
    }

    export function getLayout(
        idOrElement: string,
        parentElement?: HTMLElement
    ): (Layout|undefined) {
        const layout = getGUIElement(idOrElement, parentElement);

        if (!(layout && layout.getType() === 'layout')) {
            return;
        }

        return layout as Layout;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default Bindings;
