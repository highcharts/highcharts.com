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

import Board from '../Board.js';
import U from '../Utilities.js';
import Globals from '../Globals.js';

const { addEvent } = U;

class Fullscreen {

    /* *
    *
    *  Constructor
    *
    * */
    constructor(DashboardClass: Board) {
        this.isOpen = false;
        this.board = DashboardClass;

        // add class to allow scroll element
        this.board.boardWrapper.classList.add(
            Globals.classNamePrefix + '-fullscreen'
        );
    }

    /* *
    *
    *  Properties
    *
    * */

    public board: Board;
    public isOpen: boolean;
    private unbindFullscreenEvent?: Function;


    /* *
    *
    *  Functions
    *
    * */

    /**
     * Toggles displaying the board in fullscreen mode.
     */
    public toggle(): void {
        const fullscreen = this,
            isOpen = this.isOpen;

        fullscreen[isOpen ? 'close' : 'open']();
    }

    /**
     * Display board in fullscreen.
     */
    public open(): void {
        if (this.isOpen) {
            return;
        }
        const fullscreen = this,
            board = fullscreen.board;

        // Handle exitFullscreen() method when user clicks 'Escape' button.
        const unbindChange = addEvent(
            board.boardWrapper.ownerDocument, // dashboard's document
            'fullscreenchange',
            function (): void {
                if (fullscreen.isOpen) {
                    fullscreen.isOpen = false;
                    fullscreen.close();
                } else {
                    fullscreen.isOpen = true;
                    fullscreen.setButtonText();
                }
            }
        );

        fullscreen.unbindFullscreenEvent = (): void => {
            unbindChange();
        };

        const promise = board.boardWrapper.requestFullscreen();

        // eslint-disable-next-line highcharts/quote-members
        promise.catch((): void => {
            throw new Error('Full screen is not supported.');
        });
    }

    /**
     * Stops displaying the dashboard in fullscreen mode.
     */
    public close(): void {
        const fullscreen = this,
            board = fullscreen.board;

        // Don't fire exitFullscreen() when user exited using 'Escape' button.
        if (
            fullscreen.isOpen &&
            board.boardWrapper.ownerDocument instanceof Document
        ) {
            void board.boardWrapper.ownerDocument.exitFullscreen();
        }

        // Unbind event as it's necessary only before exiting from fullscreen.
        if (fullscreen.unbindFullscreenEvent) {
            fullscreen.unbindFullscreenEvent =
                fullscreen.unbindFullscreenEvent();
        }

        fullscreen.isOpen = false;
        this.setButtonText();
    }

    /**
     * Set the correct text depending of the fullscreen is on or of.
     */
    public setButtonText(): void {
        const editMode = this.board.editMode,
            contextMenu = editMode && editMode.tools.contextMenu,
            button = contextMenu && contextMenu.items.viewFullscreen;

        if (button && button.innerElement) {
            const lang = editMode.lang;

            button.innerElement.innerHTML =
                (this.isOpen ? lang.exitFullscreen : lang.viewFullscreen) || '';
        }
    }
}

namespace Fullscreen {

}

export default Fullscreen;
