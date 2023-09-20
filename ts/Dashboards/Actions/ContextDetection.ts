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

import U from '../Utilities.js';
import type Cell from '../Layout/Cell.js';
import GUIElement from '../Layout/GUIElement.js';

const {
    defined
} = U;

class ContextDetection {
    public static isGUIElementOnParentEdge(
        mouseContext: Cell,
        side: string // right, left, top, bottom
    ): boolean {
        const visibleElements = (side === 'top' || side === 'bottom') ?
            mouseContext.row.layout.getVisibleRows() :
            (side === 'left' || side === 'right') ?
                mouseContext.row.getVisibleCells() :
                [];
        const lastElementIndex = (visibleElements.length - 1);

        return (
            (
                visibleElements[lastElementIndex] === mouseContext &&
                side === 'right'
            ) ||
            (
                visibleElements[lastElementIndex] === mouseContext.row &&
                side === 'bottom'
            ) ||
            (visibleElements[0] === mouseContext && side === 'left') ||
            (visibleElements[0] === mouseContext.row && side === 'top')
        );
    }

    public static getContextLevel(
        mouseContext: Cell,
        offset: number,
        sideOffset: number,
        side: string
    ): number {
        // Array of overlapped levels.
        const overlappedLevels =
            mouseContext.getOverlappingLevels(side, offset / 2);

        // Divide offset to level sections (eg 3 nested layouts -
        // cell edge will have 3 sections each 1/3 offset width).
        const divOffset = offset / overlappedLevels.length;

        // Overlapped nested layout level.
        const lastOverlappedLevel =
            overlappedLevels[overlappedLevels.length - 1];

        let level =
            mouseContext.row.layout.level - Math.floor(sideOffset / divOffset);
        level = level < lastOverlappedLevel ? lastOverlappedLevel : (
            level > mouseContext.row.layout.level ?
                mouseContext.row.layout.level : level
        );

        return level;
    }

    public static getContext(
        mouseCellContext: Cell,
        e: PointerEvent,
        offset: number
    ): ContextDetection.ContextDetails {
        let sideOffset;

        // get cell offsets, width, height
        const mouseCellContextOffsets = GUIElement.getOffsets(mouseCellContext);
        const { width, height } =
            GUIElement.getDimFromOffsets(mouseCellContextOffsets);

        // Correct offset when element to small.
        if (width < 2 * offset) {
            offset = width / 2;
        }

        // Get mouse position relative to the mouseContext sides.
        const leftSideX = e.clientX - mouseCellContextOffsets.left;
        const topSideY = e.clientY - mouseCellContextOffsets.top;

        // get cell side - right, left, top, bottom
        const sideY =
            topSideY >= -offset && topSideY <= offset ? 'top' :
                topSideY - height >= -offset && topSideY - height <= offset ?
                    'bottom' :
                    '';

        const sideX =
            leftSideX >= -offset && leftSideX <= offset ? 'left' :
                leftSideX - width >= -offset && leftSideX - width <= offset ?
                    'right' :
                    '';

        const side = sideX ? sideX : sideY; // X is prioritized.

        switch (side) {
            case 'right':
                sideOffset = leftSideX - width + offset;
                break;
            case 'left':
                sideOffset = offset - leftSideX;
                break;
            case 'top':
                sideOffset = offset - topSideY;
                break;
            case 'bottom':
                sideOffset = topSideY - height + offset;
                break;
        }

        const context = {
            cell: mouseCellContext,
            side: side
        };

        // Nested layouts.
        if (
            mouseCellContext.row.layout.level !== 0 &&
            side &&
            ContextDetection.isGUIElementOnParentEdge(mouseCellContext, side) &&
            defined(sideOffset)
        ) {
            const level = ContextDetection.getContextLevel(
                mouseCellContext,
                offset,
                sideOffset,
                side
            );
            const cell = mouseCellContext.getParentCell(level);

            if (cell) {
                context.cell = cell;
            }
        }

        return context;
    }
}

namespace ContextDetection {
    export interface ContextDetails {
        cell: Cell;
        side: string; // right, left, top, bottom
    }
}

export default ContextDetection;
