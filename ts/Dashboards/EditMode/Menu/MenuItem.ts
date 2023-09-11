/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
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

import type CSSJSONObject from '../../CSSJSONObject';

import { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType.js';
import EditGlobals from '../EditGlobals.js';
import U from '../../../Shared/Utilities.js';
import Menu from './Menu.js';
import EditRenderer from '../EditRenderer.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

const {
    createElement
} = U;

class MenuItem {
    /* *
    *
    *  Static Properties
    *
    * */

    public static defaultOptions: Partial<MenuItem.Options> = {
        id: '',
        type: 'text'
    };

    /* *
    *
    *  Constructor
    *
    * */
    constructor(
        menu: Menu,
        options: MenuItem.Options
    ) {
        this.menu = menu;
        this.isActive = false;
        this.options = merge(MenuItem.defaultOptions, options);

        this.container = this.setContainer();
        this.innerElement = this.setInnerElement();
    }

    /* *
    *
    *  Properties
    *
    * */
    public menu: Menu;
    public options: MenuItem.Options;
    public container: HTMLDOMElement;
    public innerElement?: HTMLDOMElement;
    public isActive: boolean;

    /* *
    *
    *  Functions
    *
    * */
    private setContainer(): HTMLDOMElement {
        const item = this,
            options = item.options;

        let className = EditGlobals.classNames.menuItem;

        if (item.menu.options.itemsClassName) {
            className += ' ' + item.menu.options.itemsClassName;
        }

        if (options.className) {
            className += ' ' + options.className;
        }

        return createElement(
            'div',
            { className: className || '' },
            merge(
                this.options.style || {},
                // to remove
                this.isActive ? { display: 'block' } : {}
            ),
            this.menu.container
        );
    }

    public setInnerElement(): HTMLDOMElement|undefined {
        const item = this,
            options = item.options,
            container = item.container,
            langKey = options.langKey;


        if (options.type === 'toggle') {
            return EditRenderer.renderToggle(container, {
                id: options.id,
                name: options.id,
                title: langKey ?
                    this.menu.editMode.lang[langKey] :
                    options.text,
                value: !!(options.getValue && options.getValue(item)),
                lang: this.menu.editMode.lang,
                onchange: options.events?.click?.bind(item)
            });
        }

        if (options.type === 'text') {
            return EditRenderer.renderText(container, {
                title: langKey ?
                    this.menu.editMode.lang[langKey] :
                    options.text || '',
                className: options.className || ''
            });
        }

        if (options.type === 'icon') {
            return EditRenderer.renderIcon(container, {
                icon: options.icon || '',
                mousedown: options.events?.onmousedown?.bind(item),
                click: options.events?.click?.bind(item)
            });
        }
        if (options.type === 'button') {
            return EditRenderer.renderButton(container, {
                callback: options.events?.click?.bind(item),
                className: options.className || '',
                style: options.style || {},
                text: langKey ?
                    this.menu.editMode.lang[langKey] :
                    (options.text || '')
            });

        }
    }

    public update(): void {
        const item = this,
            options = item.options;

        if (options.events && options.events.update) {
            options.events.update.apply(item, arguments);
        }
    }

    public activate(): void {
        const item = this;

        item.update();

        // Temp.
        if (item.container) {
            item.isActive = true;
            item.container.style.display = 'block';
        }
    }

    public deactivate(): void {
        const item = this;

        // Temp.
        if (item.container) {
            item.isActive = false;
            item.container.style.display = 'none';
        }
    }
}

namespace MenuItem {
    export interface ItemOptions {
        id: string;
        name?: string;
        type: 'icon'|'toggle'|'text'|'button';
        className?: string;
        text?: string;
        langKey?: string;
        style?: CSSJSONObject;
        events?: {
            update?: Function;
        }
    }

    export interface ButtonOptions extends ItemOptions {
        type: 'button';
        text?: string;
        events?: {
            update?: Function;
            click?: Function;
        }
    }

    export interface IconOptions extends ItemOptions {
        type: 'icon';
        icon: string;
        events: {
            update?: Function;
            onmousedown?: Function;
            click?: Function;
        }

    }

    export interface ToggleOptions extends ItemOptions {
        type: 'toggle';
        getValue?: (item: MenuItem) => boolean;
        events: {
            update?: Function;
            click: Function;
        }

    }

    export interface TextOptions extends ItemOptions {
        type: 'text';
    }

    export type Type = 'icon'|'toggle'|'text'|'button';

    export type Options =
        | ButtonOptions
        | IconOptions
        | ToggleOptions
        | TextOptions;
}

export default MenuItem;
