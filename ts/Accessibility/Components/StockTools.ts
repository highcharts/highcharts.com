'use strict';


/* *
 *
 *  Imports
 *
 * */
import type { StockToolsButtonEventType } from '../../Stock/StockTools/StockToolsGui.js';

import AccessibilityComponent from '../AccessibilityComponent.js';
import KeyboardNavigationHandler from '../KeyboardNavigationHandler.js';
import Announcer from '../Utils/Announcer.js';
import U from '../../Core/Utilities.js';
const {
    attr,
    addEvent,
    fireEvent
} = U;

class StockToolsComponent extends AccessibilityComponent {

    /* *
     *
     *  Functions
     *
     * */

    public buttons: HTMLElement[] = [];
    public focusedButtonIndex: number = 0;
    public submenuParentIndex: number | null = null;
    public focusInPopup: boolean = false;
    public eventCallbacks: Function[] = [];

    public popupContainer: HTMLElement | undefined;
    public popupMutationObserver: MutationObserver | undefined;

    public announcer!: Announcer;

    public keyboardNavigationHandler!: KeyboardNavigationHandler;
    /**
     * Initialize the component
     */
    public init(): void {
        this.announcer = new Announcer(this.chart, 'polite');


        if (this.chart.stockTools && this.chart.stockTools.wrapper) {
            this.chart.stockTools?.wrapper.setAttribute(
                'aria-hidden',
                'false'
            );
        }
    }

    // Test, this should give warnings
    private setButtons(): void {
        const chart = this.chart,
            stockTools = chart.stockTools;

        if (!stockTools || !stockTools.visible || !stockTools?.toolbar) {
            return;
        }

        const buttons = stockTools.toolbar.querySelectorAll<HTMLElement>(
            'div > ul > li > button'
        );

        if (!buttons || !buttons.length) {
            return;
        }

        this.buttons = Array.from(buttons);

        const setButtonAsFocused = (i: number): void => {
            this.focusedButtonIndex = i;
        };

        this.buttons.forEach((button, i): void => {
            attr(button, {
                tabindex: -1
            });

            const boundFunction = setButtonAsFocused.bind(this, i);
            button.addEventListener('focus', boundFunction);
            this.eventCallbacks.push(
                (): void => button.removeEventListener('focus', boundFunction)
            );

        });
    }


    public onChartUpdate(): void {
    }

    public focusButton(): void {
        const button = this.buttons[this.focusedButtonIndex];

        if (button) {
            button.focus();
        }
    }

    private setPopupButtons(): void {
        if (this.popupContainer) {
            const popupButtons = this.popupContainer
                .querySelectorAll<HTMLElement>('button, .highcharts-popup-field');

            this.buttons = Array.from(popupButtons);
            this.buttons.forEach((button: HTMLElement): void => {
                attr(button, {
                    tabindex: -1
                });
            });
        }
    }


    private onShowPopup(e: any): void {
        this.focusInPopup = true;
        this.popupContainer = e.target.popup.container;

        this.setPopupButtons();
        this.focusButton();

        this.focusedButtonIndex = 0;

        if (this.popupMutationObserver) {
            this.popupMutationObserver.disconnect();
        }

        if (this.popupContainer) {
            this.popupMutationObserver =
                new MutationObserver(this.setPopupButtons.bind(this));

            this.popupMutationObserver.observe(this.popupContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    private onHidePopup(): void {
        if (this.focusInPopup) {
            this.focusInPopup = false;

            this.popupContainer = void 0;

            if (this.popupMutationObserver) {
                this.popupMutationObserver.disconnect();
                this.popupMutationObserver = void 0;
            }

            this.setButtons();
            this.focusButton();
        }
    }

    private incrementFocusedButtonIndex(): boolean {
        const atEnd = this.focusedButtonIndex === this.buttons.length - 1;

        if (atEnd && this.submenuParentIndex) {
            return false;
        }

        if (!atEnd) {
            this.focusedButtonIndex += 1;
            return true;
        }

        // Warp around
        this.focusedButtonIndex = 0;

        return false;
    }

    private decrementFocusedButtonIndex(): boolean {
        const atStart = this.focusedButtonIndex === 0;

        if (atStart && this.submenuParentIndex) {
            return false;
        }

        if (!atStart) {
            this.focusedButtonIndex -= 1;

            return true;
        }

        // Wrap around
        this.focusedButtonIndex = this.buttons.length - 1;

        return false;
    }

    private onTabKeyPress(
        this: StockToolsComponent,
        _keyCode: number,
        e: KeyboardEvent
    ): number {
        const component = this;
        if (component.focusInPopup) {
            if (e.shiftKey) {
                component.decrementFocusedButtonIndex();
            } else {
                component.incrementFocusedButtonIndex();
            }

            component.focusButton();

            return component.keyboardNavigationHandler.response.success;
        }

        if (e.shiftKey) {
            return component.keyboardNavigationHandler.response.prev;
        }

        return component.keyboardNavigationHandler.response.next;
    }

    private onDirectionKeyPress(
        this: StockToolsComponent,
        keyCode: number,
        e: KeyboardEvent
    ): number {
        if (!this.focusInPopup || (this.focusInPopup && e.shiftKey)) {
            const component = this;
            const keys = this.keyCodes;

            const currentButton = this.buttons[this.focusedButtonIndex];

            if (keyCode === keys.home) {
                this.focusedButtonIndex = 0;
            }

            if (keyCode === keys.end) {
                this.focusedButtonIndex = this.buttons.length - 1;
            }

            if (keyCode === keys.left && component.submenuParentIndex) {
                component.closeOpenSubmenus();
                component.focusButton();
                return component.keyboardNavigationHandler.response.success;
            }

            if (
                currentButton.getAttribute('aria-haspopup') === 'true' &&
                keyCode === keys.down
            ) {
                const submenu = currentButton.parentElement?.querySelector<HTMLElement>(
                    '#' + currentButton.getAttribute('aria-controls')
                );
                if (submenu) {
                    component.openSubmenu(submenu);
                    // TODO: Might be more proper to fire an event
                    component.chart.stockTools?.showSubmenu(
                        submenu,
                        submenu.parentElement ?? submenu
                    );

                    return component.keyboardNavigationHandler.response
                        .success;
                }
            }

            if (keyCode === keys.right) {
                // Close submenu, go to next
                component.closeOpenSubmenus();
            }

            if (keyCode === keys.left) {
                // Close submenu, go to previous
                component.closeOpenSubmenus();
            }

            if ([keys.left, keys.up].includes(keyCode)) {
                component.decrementFocusedButtonIndex();
            }
            if ([keys.right, keys.down].includes(keyCode)) {
                component.incrementFocusedButtonIndex();
            }

            component.focusButton();

            return component.keyboardNavigationHandler.response.success;
        }

        return this.keyboardNavigationHandler.response.noHandler;
    }

    private closeSubmenu(
        submenu: HTMLElement | null | undefined
    ): void {
        if (submenu && submenu.dataset.open !== 'false') {
            const wrapperElement =
                submenu.closest('li');

            if (wrapperElement) {
                this.chart.stockTools?.hideSubmenu(
                    submenu,
                    wrapperElement
                );
            }

            if (this.submenuParentIndex) {
                this.focusedButtonIndex =
                        this.submenuParentIndex;

                this.submenuParentIndex = null;
            }

            this.setButtons();
        }
    }

    private closeOpenSubmenus(): boolean {
        const submenus = this.chart.stockTools
            ?.toolbar.querySelectorAll<HTMLElement>(
            '[role="menu"][data-open="true"]'
        );

        if (submenus?.length) {
            submenus?.forEach((sub): void => this.closeSubmenu(sub));

            if (this.submenuParentIndex) {
                this.focusedButtonIndex = this.submenuParentIndex;
            }

            return true;
        }

        return false;

    }

    private announceTool(
        buttonElement: HTMLElement
    ): void {
        const toolLabel = buttonElement.dataset.label;
        if (toolLabel) {
            const submenu = buttonElement
                .closest('.highcharts-submenu-wrapper');

            // If we are in a submenu, announce change of tool
            if (submenu) {
                const toolType =
                        submenu.parentElement?.querySelector('button')
                            ?.dataset.btnName;

                this.announcer.announce(
                    this.chart.langFormat(
                        'stockTools.toolChanged',
                        { toolLabel, toolType }
                    )
                );
                return;
            }

            // Otherwise, announce that the tool is selected
            this.announcer.announce(
                this.chart.langFormat(
                    'stockTools.toolSelected',
                    {
                        toolLabel
                    }
                )
            );

        }
    }

    private onEscKeyPress(
        this: StockToolsComponent
    ): number {
        if (!this.focusInPopup) {
            const didClose = this.closeOpenSubmenus();

            if (didClose) {
                this.focusButton();
            }
        }

        return 0;
    }

    private openSubmenu(submenu: HTMLElement): void {
        const component = this;

        const button = component.buttons[component.focusedButtonIndex];
        if (submenu && submenu.dataset.open === 'false') {
            this.submenuParentIndex = this.focusedButtonIndex;

            // Make submenu traversable by keyboard
            const childButtons = submenu
                .querySelectorAll<HTMLElement>(
                'button'
            );

            if (childButtons?.length) {
                const mainButton = button
                    .parentElement
                    ?.querySelector<HTMLElement>('.highcharts-menu-item-btn');

                component.buttons = Array.from(childButtons);

                const indexToFocus =
                                Array.from(childButtons)
                                    .findIndex(
                                        (child): boolean =>
                                            mainButton?.dataset.label ===
                                                child.dataset.label
                                    );


                component.focusedButtonIndex = (
                    indexToFocus !== -1 ?
                        indexToFocus :
                        0
                );

                childButtons.forEach((childButton): void => {
                    attr(childButton, {
                        tabindex: -1
                    });
                });

                // Trigger focus after navigationHandler
                // has finished, otherwise selectButton is triggered
                setTimeout((): void => {
                    component.focusButton();
                });
            }
        }

    }

    private onEnterKeyPress(
        this: StockToolsComponent
    ): number {
        const component = this;
        if (!component.focusInPopup) {
            const button = component.buttons[component.focusedButtonIndex];
            const submenu = button.parentElement
                ?.querySelector<HTMLElement>(
                '.highcharts-submenu-wrapper'
            );

            if (button.getAttribute('aria-haspopup') === 'true' && submenu) {
                component.openSubmenu(submenu);

                return component.keyboardNavigationHandler.response.noHandler;
            }

            if (
                button.classList.contains('highcharts-menu-item-btn') &&
                button.dataset.label
            ) {
                const submenu = button
                    .closest<HTMLElement>('.highcharts-submenu-wrapper');

                // Handle submenu buttons ourselves to make
                // states less confusing for screen readers
                if (submenu) {
                    // Do the main button swaperoo
                    component.chart.stockTools?.switchSymbol(button);

                    const mainButton = submenu.parentElement
                        ?.querySelector<HTMLElement>(
                        '.highcharts-menu-item-btn'
                    );

                    if (mainButton && button.dataset.label) {
                        mainButton.dataset.label = button.dataset.label;
                        component.chart.stockTools?.setAriaLabelForParentButton(
                            button
                        );
                    }

                    // Announce here as 'selectButton' event is not fired and
                    // ctrl-option-space works otherwise

                    component.closeSubmenu(submenu);
                    component.focusButton();
                    component.announceTool(button);

                    return component.keyboardNavigationHandler.response.success;
                }

                return component.keyboardNavigationHandler.response.noHandler;
            }
        }

        if (this.focusInPopup) {
            //  TODO: Fix this in popup code, remove this workaround
            if (
                document.activeElement?.tagName === 'BUTTON' &&
                (document.activeElement as HTMLElement).innerText === 'Add'
            ) {
                fireEvent(this.chart.navigationBindings, 'closePopup');

                return component.keyboardNavigationHandler.response.success;
            }
        }

        // Return noHandler as default to not cancel the default event
        return component.keyboardNavigationHandler.response.noHandler;
    }

    public getKeyboardNavigation(): KeyboardNavigationHandler {
        const keys = this.keyCodes;
        const kbdConfig: KeyboardNavigationHandler.Options = {
            keyCodeMap: [
                [
                    [
                        keys.left,
                        keys.right,
                        keys.up,
                        keys.down,
                        keys.home,
                        keys.end
                    ],
                    this.onDirectionKeyPress.bind(this)
                ],
                [
                    [keys.tab],
                    this.onTabKeyPress.bind(this)
                ],
                [
                    [keys.enter, keys.space],
                    this.onEnterKeyPress.bind(this)
                ],
                [
                    [keys.esc],
                    this.onEscKeyPress.bind(this)
                ]
            ],
            validate: (): boolean => !!(
                this.chart.stockTools &&
                    this.chart.stockTools.visible
            ),
            init: (): void => {
                const chart = this.chart;
                chart.stockTools?.redraw();
                if (chart.navigationBindings) {
                    this.eventCallbacks.push(
                        addEvent(
                            chart.navigationBindings,
                            'showPopup',
                            this.onShowPopup.bind(this)
                        ),
                        addEvent(
                            chart.navigationBindings,
                            'closePopup',
                            this.onHidePopup.bind(this)
                        ),
                        addEvent(
                            chart.navigationBindings,
                            'selectButton',
                            (e: StockToolsButtonEventType): void => {
                                const { button: buttonListElement } = e;
                                const button = buttonListElement
                                    .querySelector('button');

                                if (button) {
                                    this.closeOpenSubmenus();

                                    this.announceTool(
                                        button
                                    );
                                }
                            }
                        )
                    );
                }

                this.setButtons();

                // Focus first button
                this.focusedButtonIndex = 0;
                this.focusButton();

                // Setup submenu buttons
                chart.stockTools?.toolbar?.querySelectorAll<HTMLElement>(
                    '.highcharts-submenu-wrapper'
                ).forEach((submenu): void => {
                    submenu.dataset.open = 'false';
                });

            },
            terminate: (): void => {
                this.focusedButtonIndex = 0;
                this.focusInPopup = false;

                while (this.eventCallbacks.length > 0) {
                    const eventCleanup = this.eventCallbacks.pop();
                    if (eventCleanup) {
                        eventCleanup();
                    }
                }

                this.closeOpenSubmenus();


            }
        };

        this.keyboardNavigationHandler = new KeyboardNavigationHandler(
            this.chart,
            kbdConfig
        );

        return this.keyboardNavigationHandler;
    }
}

export default StockToolsComponent;
