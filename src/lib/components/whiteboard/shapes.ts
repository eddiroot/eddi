import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { MIN_TEXT_WIDTH } from './constants';
import {
    configureArrowControls,
    configureCircleControls,
    configureLineControls,
    configureRectangleControls,
    configureTextControls,
    configureTriangleControls
} from './object-controls';
import type { LineArrowOptions, ShapeOptions, TextOptions } from './types';

/**
 * Calculate arrowhead points for a line
 */
export const createArrowHead = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    arrowLength = 15,
    arrowAngle = Math.PI / 6
) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Calculate the two points of the arrowhead
    const arrowPoint1 = {
        x: x2 - arrowLength * Math.cos(angle - arrowAngle),
        y: y2 - arrowLength * Math.sin(angle - arrowAngle)
    };

    const arrowPoint2 = {
        x: x2 - arrowLength * Math.cos(angle + arrowAngle),
        y: y2 - arrowLength * Math.sin(angle + arrowAngle)
    };

    return [arrowPoint1, arrowPoint2];
};

/**
 * Create a line object with the given options
 */
export const createLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: LineArrowOptions
) => {
    const line = new fabric.Line([x1, y1, x2, y2], {
        id: uuidv4(),
        stroke: options.strokeColour,
        strokeWidth: options.strokeWidth,
        strokeDashArray: options.strokeDashArray,
        opacity: options.opacity,
        selectable: true,
        originX: 'center',
        originY: 'center'
    });

    // Override toObject to ensure all coordinate properties are serialized
    const originalToObject = line.toObject.bind(line);
    // @ts-expect-error - Custom toObject override for proper line serialization
    line.toObject = (propertiesToInclude) => {
        // @ts-expect-error - Type mismatch in toObject parameters
        const obj = originalToObject(propertiesToInclude);
        return {
            ...obj,
            // Ensure these critical properties are always included
            x1: line.x1,
            y1: line.y1,
            x2: line.x2,
            y2: line.y2,
            left: line.left,
            top: line.top,
            originX: line.originX,
            originY: line.originY
        };
    };

    // Configure line-specific controls
    configureLineControls(line);

    return line;
};

/**
 * Create an arrow object (line with arrowhead) with the given options
 */
export const createArrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: LineArrowOptions
) => {
    const line = createLine(x1, y1, x2, y2, options);
    const arrowHeadPoints = createArrowHead(x1, y1, x2, y2);

    const arrowHead1 = new fabric.Line([x2, y2, arrowHeadPoints[0].x, arrowHeadPoints[0].y], {
        stroke: options.strokeColour,
        strokeWidth: options.strokeWidth,
        strokeDashArray: options.strokeDashArray,
        opacity: options.opacity,
        selectable: false
    });

    const arrowHead2 = new fabric.Line([x2, y2, arrowHeadPoints[1].x, arrowHeadPoints[1].y], {
        stroke: options.strokeColour,
        strokeWidth: options.strokeWidth,
        strokeDashArray: options.strokeDashArray,
        opacity: options.opacity,
        selectable: false
    });

    // Group the line and arrowhead together
    const arrowGroup = new fabric.Group([line, arrowHead1, arrowHead2], {
        selectable: true
    });

    // Assign ID to the group
    // @ts-expect-error - Custom id property
    arrowGroup.id = uuidv4();

    // Configure arrow-specific controls
    configureArrowControls(arrowGroup);

    return arrowGroup;
};

/**
 * Create a shape (circle, rectangle, or triangle) from two points
 */
export const createShapeFromPoints = (
    shapeType: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: ShapeOptions
) => {
    // Calculate dimensions from the two points
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    switch (shapeType) {
        case 'circle': {
            // For circles, use the larger dimension as diameter
            const radius = Math.max(width, height) / 2;
            const circle = new fabric.Circle({
                id: uuidv4(),
                radius: radius,
                fill: options.fillColour,
                stroke: options.strokeColour,
                strokeWidth: options.strokeWidth,
                strokeDashArray: options.strokeDashArray,
                opacity: options.opacity,
                left: left,
                top: top
            });
            configureCircleControls(circle);
            return circle;
        }
        case 'rectangle': {
            const rect = new fabric.Rect({
                id: uuidv4(),
                width: width,
                height: height,
                fill: options.fillColour,
                stroke: options.strokeColour,
                strokeWidth: options.strokeWidth,
                strokeDashArray: options.strokeDashArray,
                opacity: options.opacity,
                left: left,
                top: top
            });
            configureRectangleControls(rect);
            return rect;
        }
        case 'triangle': {
            const triangle = new fabric.Triangle({
                id: uuidv4(),
                width: width,
                height: height,
                fill: options.fillColour,
                stroke: options.strokeColour,
                strokeWidth: options.strokeWidth,
                strokeDashArray: options.strokeDashArray,
                opacity: options.opacity,
                left: left,
                top: top
            });
            configureTriangleControls(triangle);
            return triangle;
        }
        default:
            return null;
    }
};

/**
 * Create a text box from two points
 */
export const createTextFromPoints = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: TextOptions
) => {
    // Calculate dimensions from the two points
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.max(Math.abs(x2 - x1), MIN_TEXT_WIDTH);

    const text = new fabric.Textbox('Click to edit text', {
        id: uuidv4(),
        left: left,
        top: top,
        width: width,
        fontSize: options.fontSize,
        fontFamily: options.fontFamily,
        fontWeight: options.fontWeight,
        fill: options.colour,
        opacity: options.opacity,
        // Text wrapping settings
        splitByGrapheme: false, // Split by words, not characters
        // Fixed height behavior - let text wrap and expand vertically naturally
        // but constrain width
        textAlign: options.textAlign
    });

    // Configure text-specific controls
    configureTextControls(text);

    return text;
};
