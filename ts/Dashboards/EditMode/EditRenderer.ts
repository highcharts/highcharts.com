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

/* *
 *
 *  Imports
 *
 * */

import type MenuItem from './Menu/MenuItem.js';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type EditMode from './EditMode.js';

import EditGlobals from './EditGlobals.js';
import U from '../Utilities.js';
const {
    merge,
    createElement,
    defined,
    find
} = U;


/* *
 *
 *  Functions
 *
 * */

/**
 * Function to create a context button.
 * @internal
 *
 * @param parentElement
 * The element to which the new element should be appended.
 *
 * @param editMode
 * EditMode instance.
 *
 * @returns
 * Context button element.
 */
function renderContextButton(
    parentNode: HTMLElement,
    editMode: EditMode
): HTMLElement|undefined {
    let ctxBtnElement : HTMLElement|undefined;

    if (editMode.options.contextMenu) {
        ctxBtnElement = createElement(
            'button', {
                className: EditGlobals.classNames.contextMenuBtn,
                onclick: function (): void {
                    editMode.onContextBtnClick();
                }
            },
            {
                'background-image': 'url(' +
                    editMode.options.contextMenu.icon +
                ')'
            } as any,
            parentNode
        );

        ctxBtnElement.setAttribute(
            'aria-label',
            editMode.lang.accessibility.contextMenu.button
        );
    }

    return ctxBtnElement;
}

/**
 * Creates the collapsable header element.
 * @internal
 *
 * @param parentElement
 * The HTMLElement to which the element should be rendered to.
 *
 * @param options
 * Nested header options.
 *
 * @returns the outer element and content in the collapsable div.
 */
function renderCollapseHeader(
    parentElement: HTMLElement,
    options: NestedHeaderFormFieldOptions
): { outerElement: HTMLElement; content: HTMLElement } {

    const {
        name,
        showToggle,
        onchange,
        isEnabled,
        isNested,
        iconsURLPrefix,
        lang
    } = options;

    const accordion = createElement(
        'div',
        {
            className:
                EditGlobals.classNames[
                    isNested ? 'accordionNestedWrapper' : 'accordionContainer'
                ] + ' ' + EditGlobals.classNames.collapsableContentHeader
        },
        {},
        parentElement
    );
    const header = createElement(
        'div',
        {
            className: EditGlobals.classNames.accordionHeader
        },
        {},
        accordion
    );

    const headerBtn = createElement(
        'button',
        { className: EditGlobals.classNames.accordionHeaderBtn },
        {},
        header
    );

    createElement(
        'span',
        {
            textContent: lang[name] || name
        },
        {},
        headerBtn
    );

    if (showToggle) {
        renderToggle(header, {
            enabledOnOffLabels: true,
            id: name,
            name: '',
            onchange: onchange,
            value: isEnabled || false,
            lang
        });
    }

    const headerIcon = createElement(
        'span',
        {
            className:
                EditGlobals.classNames.accordionHeaderIcon + ' ' +
                EditGlobals.classNames.collapsedElement
        },
        {},
        headerBtn
    );

    const content = createElement(
        'div',
        {
            className:
                EditGlobals.classNames.accordionContent + ' ' +
                EditGlobals.classNames.hiddenElement
        },
        {},
        accordion
    );

    headerBtn.addEventListener('click', function (): void {
        content.classList.toggle(EditGlobals.classNames.hiddenElement);
        headerIcon.classList.toggle(EditGlobals.classNames.collapsedElement);
    });

    return { outerElement: accordion, content: content };
}

/**
 * Function to create select element.
 *
 * @param parentElement
 * The element to which the new element should be appended.
 *
 * @param options
 * Select form field options.
 *
 * @returns
 * Select element
 */
function renderSelect(
    parentElement: HTMLElement,
    options: SelectFormFieldOptions
): HTMLElement|undefined {
    if (!parentElement) {
        return;
    }

    if (options.name) {
        renderText(parentElement, { title: options.name, isLabel: true });
    }

    const iconsURLPrefix = options.iconsURLPrefix || '';
    const customSelect = createElement(
        'div',
        {
            className: EditGlobals.classNames.dropdown +
                ' ' +
                EditGlobals.classNames.collapsableContentHeader
        },
        {},
        parentElement
    );

    const btn = createElement(
        'button',
        {
            className: EditGlobals.classNames.dropdownButton
        },
        {},
        customSelect
    );

    const btnContent = createElement(
        'div',
        {
            className: EditGlobals.classNames.dropdownButtonContent
        },
        {},
        btn
    );

    const iconURL = (
        find(
            options.selectOptions,
            (item): boolean => item.name === options.value
        ) || {}
    ).iconURL;

    let headerIcon;

    if (iconURL) {
        headerIcon = createElement(
            'img',
            {
                src: iconsURLPrefix + iconURL,
                className: EditGlobals.classNames.icon
            },
            {},
            btnContent
        );
    }
    const placeholder = createElement(
        'span',
        {
            textContent: options.value,
            id: options.id || ''
        },
        {},
        btnContent
    );
    const dropdownPointer = createElement(
        'img',
        {
            className:
                EditGlobals.classNames.dropdownIcon +
                ' ' +
                EditGlobals.classNames.collapsedElement,
            src: iconsURLPrefix + 'dropdown-pointer.svg'
        },
        {},
        btn
    );

    const dropdown = createElement(
        'ul',
        {
            className:
                EditGlobals.classNames.dropdownContent +
                ' ' +
                EditGlobals.classNames.hiddenElement
        },
        {},
        customSelect
    );
    btn.addEventListener('click', function (): void {
        dropdown.classList.toggle(EditGlobals.classNames.hiddenElement);
        dropdownPointer.classList.toggle(
            EditGlobals.classNames.collapsedElement
        );
    });

    for (let i = 0, iEnd = options.selectOptions.length; i < iEnd; ++i) {
        renderSelectElement(
            merge(options.selectOptions[i] || {}, { iconsURLPrefix }),
            dropdown,
            placeholder,
            options.id,
            dropdownPointer,
            headerIcon,
            options.onchange
        );
    }

    return customSelect;
}

/**
 * @internal
 */
function renderSelectElement(
    option: SelectFormFieldItemOptions,
    dropdown: HTMLElement,
    placeholder: HTMLElement,
    id: string,
    dropdownPointer: HTMLElement,
    headerIcon?: HTMLElement,
    callback?: Function
): void {
    const iconURL = option.iconsURLPrefix + option.iconURL;
    const selectOption = createElement('li', {}, {}, dropdown);
    const selectOptionBtn = createElement(
        'button',
        { className: EditGlobals.classNames.customSelectButton },
        {},
        selectOption
    );

    let icon: HTMLElement|undefined;

    if (option.iconURL) {
        icon = createElement(
            'img',
            {
                src: iconURL
            },
            {},
            selectOptionBtn
        );
    }
    createElement(
        'span',
        { textContent: option.name || '' },
        {},
        selectOptionBtn
    );

    selectOptionBtn.addEventListener('click', function (): void {
        dropdown.classList.add(EditGlobals.classNames.hiddenElement);
        dropdownPointer.classList.toggle(
            EditGlobals.classNames.collapsedElement
        );
        placeholder.textContent = option.name || '';

        if (headerIcon && option.iconURL) {
            (headerIcon as HTMLImageElement).src = iconURL;
        }

        if (callback) {
            return callback(option.name);
        }
    });
}

/**
 * Function to create toggle element.
 *
 * @param parentElement
 * The element to which the new element should be appended.
 *
 * @param options
 * Form field options
 *
 * @returns
 * Toggle element
 */
function renderToggle(
    parentElement: HTMLElement,
    options: ToggleFormFieldOptions
): HTMLElement|undefined {

    if (!parentElement) {
        return;
    }

    const { value, lang } = options;
    const title = options.title || options.name;
    const toggleContainer = createElement(
        'div',
        { className: EditGlobals.classNames.toggleContainer },
        {},
        parentElement
    );
    if (title) {
        renderText(toggleContainer, { title });
    }

    if (options.enabledOnOffLabels) {
        EditRenderer.renderText(toggleContainer, {
            title: lang.off,
            className: EditGlobals.classNames.toggleLabels
        });
    }

    const toggle = createElement(
        'label',
        {
            className: EditGlobals.classNames.toggleWrapper +
            ' ' + (options.className || '')
        },
        {},
        toggleContainer
    );

    const input = renderCheckbox(toggle, value) as HTMLInputElement;
    const callbackFn = options.onchange;

    if (input && callbackFn) {
        toggleContainer.addEventListener('click', (e: any): void => {
            callbackFn(!input.checked);
            input.checked = !input.checked;
        });
    }

    const slider = createElement(
        'span',
        {
            className: EditGlobals.classNames.toggleSlider
        },
        {},
        toggle
    );

    callbackFn && slider.addEventListener('click', (e): void => {
        e.preventDefault();
    });

    if (options.enabledOnOffLabels) {
        EditRenderer.renderText(toggleContainer, {
            title: lang.on,
            className: EditGlobals.classNames.toggleLabels
        });
    }


    return toggleContainer;
}

/**
 * Function to create text element.
 *
 * @param parentElement
 * The element to which the new element should be appended
 *
 * @param text
 * Text to be displayed
 *
 * @param callback
 * Callback function to be fired on the click
 *
 * @returns text Element
 */
function renderText(
    parentElement: HTMLElement,
    options: TextOptions
): HTMLElement | undefined {
    let textElem;

    const { title: text, className, isLabel } = options;
    if (parentElement) {
        const labelFor = isLabel ? { htmlFor: text } : {};
        textElem = createElement(
            isLabel ? 'label' : 'div',
            {
                className:
                    EditGlobals.classNames.labelText + ' ' + (className || ''),
                textContent: text,
                ...labelFor
            },
            {},
            parentElement
        );
    }

    return textElem;
}

/**
 * Function to create Icon element.
 *
 * @param parentElement
 * The element to which the new element should be appended.
 *
 * @param icon
 * Icon URL
 *
 * @param callback
 * Callback function
 *
 * @returns
 * Icon Element
 */
function renderIcon(
    parentElement: HTMLElement,
    options: IconFormFieldOptions
): HTMLElement|undefined {
    const { icon, callback } = options;

    if (!parentElement) {
        return;
    }

    const iconElem = createElement(
        'div', {
            onclick: callback,
            className: options.className || ''
        }, {},
        parentElement
    );

    (iconElem.style as any)['background-image'] = 'url(' + icon + ')';

    const mousedown = options.mousedown;
    const click = options.click;
    if (mousedown) {
        iconElem.onmousedown = function (): void {
            mousedown.apply(this, arguments);
        };
    }

    if (click) {
        iconElem.addEventListener('click', function (): void {
            click.apply(this, arguments);
        });
    }
    return iconElem;
}

/**
 * Function to create input element.
 *
 * @param parentElement
 * the element to which the new element should be appended
 *
 * @param options
 * Form field options
 *
 * @returns
 * Input Element
 */
function renderInput(
    parentElement: HTMLElement,
    options: FormFieldOptions
): HTMLElement | undefined {

    if (!parentElement) {
        return;
    }

    if (options.name) {
        renderText(parentElement, { title: options.name, isLabel: true });
    }

    const input = createElement(
        'input', {
            type: 'text',
            onclick: options.callback,
            id: options.id || '',
            name: options.name || '',
            value: (
                (
                    defined(options.value) &&
                    options.value.toString().replace(/\"/g, '')
                ) || ''
            )
        },
        {},
        parentElement
    );

    const onchange = options.onchange;

    if (onchange) {
        input.addEventListener('change', function (e: any): void {
            onchange(e.target.value);
        });
    }
    return input;
}

/**
 * Function to create textarea element.
 *
 * @param parentElement
 * The element to which the new element should be appended
 *
 * @param options
 * Form field options
 *
 * @returns
 * textarea Element
 */
function renderTextarea(
    parentElement: HTMLElement,
    options: FormFieldOptions
): HTMLElement|undefined {

    if (!parentElement) {
        return;
    }

    if (options.name) {
        renderText(parentElement, { title: options.name, isLabel: true });
    }

    const textarea = createElement(
        'textarea', {
            id: options.id,
            name: options.name,
            value: options.value || ''
        }, {

        },
        parentElement
    );

    const onchange = options.onchange;

    if (onchange) {
        textarea.addEventListener('change', function (e: any): void {
            onchange(e.target.value);
        });
    }

    return textarea;
}

/**
 * Function to render the input of type checkbox.
 *
 * @param parentElement
 * An element to which render the checkbox to
 *
 * @param checked
 * Whether the checkbox should be checked or not.
 *
 * @returns
 * The checkbox element
 */
function renderCheckbox(
    parentElement: HTMLElement,
    checked?: boolean
): HTMLElement|undefined {
    let input;

    if (parentElement) {
        input = createElement(
            'input', {
                type: 'checkbox',
                checked: !!checked
            }, {

            },
            parentElement
        );
    }

    return input;
}

/**
 * Function to create button element.
 *
 * @param parentElement
 * the element to which the new element should be appended
 *
 * @param options
 * Button field options
 *
 * @returns
 * Button Element
 */
function renderButton(
    parentElement: HTMLElement,
    options: ButtonOptions
): HTMLElement|undefined {
    let button;

    if (!parentElement) {
        return;
    }

    button = createElement(
        'button', {
            className: (
                EditGlobals.classNames.button + ' ' +
                (options.className || '')
            ),
            onclick: options.callback,
            textContent: options.text
        }, options.style || {},
        parentElement
    );

    if (options.icon) {
        (button.style as any)['background-image'] =
            'url(' + options.icon + ')';
    }

    return button;
}

/**
 * Get the renderer function based on the type of the element to render.
 *
 * @param type
 * Type of the element to render
 *
 * @returns
 * function to render a specific element
 */
function getRendererFunction(type: RendererElement): Function | undefined {
    return {
        select: renderSelect,
        toggle: renderToggle,
        text: renderText,
        collapse: renderCollapseHeader,
        icon: renderIcon,
        contextButton: renderContextButton,
        input: renderInput,
        textarea: renderTextarea,
        checkbox: renderCheckbox,
        button: renderButton
    }[type];
}


const EditRenderer = {
    renderSelect,
    renderToggle,
    renderText,
    renderCollapseHeader,
    renderIcon,
    renderContextButton,
    renderInput,
    renderTextarea,
    renderCheckbox,
    renderButton,
    getRendererFunction
};

export default EditRenderer;

export interface ButtonOptions {
    callback?: Function;
    text?: string;
    className?: string;
    icon?: string;
    isDisabled?: boolean;
    style?: CSSObject;
}

export interface IconFormFieldOptions {
    className?: string;
    icon: string;
    click?: Function;
    mousedown?: Function;
    item?: MenuItem;
    callback?: Function;
}
export interface FormFieldOptions {
    propertyPath?: Array<string>;
    iconsURLPrefix?: string;
    icon?: string;
    id: string;
    name: string;
    callback?: Function;
    title?: string;
    onchange?: Function;
    value?: string;
    className?: string;
    enabledOnOffLabels?: boolean;
}

export interface SelectFormFieldOptions extends FormFieldOptions {
    title: string;
    value: string;
    selectOptions: Array<SelectFormFieldItemOptions>;
}

export interface SelectFormFieldItemOptions {
    iconsURLPrefix: string
    name: string;
    iconURL: string;
}

export interface TextOptions {
    title: string;
    className?: string;
    isLabel?: boolean;
}

export interface ToggleFormFieldOptions {
    title?: string;
    value: boolean;
    enabledOnOffLabels?: boolean;
    className?: string;
    onchange?: (value: boolean) => void;
    id: string;
    name: string;
    lang: EditGlobals.LangOptions;
}

export interface NestedHeaderFormFieldOptions {
    name: string;
    showToggle?: boolean;
    onchange?: (value: boolean) => void;
    isEnabled?: boolean;
    isNested?: boolean;
    iconsURLPrefix?: string;
    lang: EditGlobals.LangOptions;
}

export type RendererElement = (
    | 'select'
    | 'toggle'
    | 'text'
    | 'collapse'
    | 'icon'
    | 'contextButton'
    | 'input'
    | 'textarea'
    | 'checkbox'
    | 'button'
);
