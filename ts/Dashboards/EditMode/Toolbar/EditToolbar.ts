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

'use strict';

import EditMode from '../EditMode.js';
import U from '../../../Shared/Utilities.js';
const {
    createElement,
    css
} = U;
import Menu from '../Menu/Menu.js';
import { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType.js';
import GUIElement from '../../Layout/GUIElement.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { defined } = OH;


/**
 * Abstract Class of Edit Toolbar.
 * @internal
 */
abstract class EditToolbar {

    /* *
     *
     *  Constructor
     *
     * */

    constructor(
        editMode: EditMode,
        options: EditToolbar.Options
    ) {
        this.container = createElement(
            'div',
            {
                className: options.className
            },
            void 0,
            editMode.board.container
        );

        this.editMode = editMode;
        this.iconURLPrefix = editMode.iconsURLPrefix;
        this.menu = new Menu(
            this.container,
            options.menu,
            editMode,
            this
        );

        this.options = options;
        this.isVisible = false;

        if (this.options.outline) {
            this.outline = createElement(
                'div',
                {
                    className: options.outlineClassName
                },
                void 0,
                this.container
            );
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public container: HTMLDOMElement;
    public editMode: EditMode;
    public menu: Menu;
    public isVisible: boolean;
    public iconURLPrefix: string;
    public options: EditToolbar.Options;
    public outline?: HTMLDOMElement;

    /* *
     *
     *  Functions
     *
     * */

    public hide(): void {
        this.setPosition(void 0, void 0);
    }

    public refreshOutline(
        x: number,
        y: number,
        guiElement?: GUIElement,
        offset: number = 0
    ): void {
        const toolbar = this,
            guiElemCnt = (guiElement || {}).container;

        if (toolbar.outline && guiElemCnt) {
            css(toolbar.outline, {
                display: 'block',
                left: x - offset + 'px',
                top: y - offset + 'px',
                width: guiElemCnt.offsetWidth + offset * 2 + 'px',
                height: guiElemCnt.offsetHeight + offset * 2 + 'px'
            });
        }
    }

    public hideOutline(): void {
        if (this.outline) {
            this.outline.style.display = 'none';
        }
    }

    public setPosition(x?: number, y?: number): void {
        const toolbar = this;

        if (toolbar.container) {
            css(toolbar.container, {
                left: (x || '-9999') + 'px',
                top: (y || '-9999') + 'px'
            });
        }

        toolbar.isVisible = defined(x) && defined(y);
    }
}

namespace EditToolbar {
    export interface Options {
        /**
         * Class name for the toolbar.
         */
        className: string;
        /**
         * Whether or not the toolbar is enabled.
         */
        enabled: boolean;
        /**
         * Options for the toolbar menu.
         */
        menu: Menu.Options;
        /**
         * Whether or not to show the outline.
         */
        outline: boolean;
        /**
         * Class name for the outline.
         */
        outlineClassName: string;
    }
}

export default EditToolbar;
