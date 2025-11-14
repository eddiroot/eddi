import * as fabric from 'fabric';

/**
 * Configure control appearance and behavior for all objects
 */
export const CONTROL_STYLES = {
    cornerSize: 12,
    cornerColor: 'oklch(0.6171 0.1375 39.0427)',
    cornerStrokeColor: '#ffffff',
    cornerStyle: 'circle' as const,
    transparentCorners: false,
    borderColor: 'oklch(0.6171 0.1375 39.0427)',
    borderScaleFactor: 2,
    padding: 0
};

/**
 * Apply control styles to an object
 */
export function applyControlStyles(obj: fabric.Object): void {
    obj.set({
        cornerSize: CONTROL_STYLES.cornerSize,
        cornerColor: CONTROL_STYLES.cornerColor,
        cornerStrokeColor: CONTROL_STYLES.cornerStrokeColor,
        cornerStyle: CONTROL_STYLES.cornerStyle,
        transparentCorners: CONTROL_STYLES.transparentCorners,
        borderColor: CONTROL_STYLES.borderColor,
        borderScaleFactor: CONTROL_STYLES.borderScaleFactor,
        padding: CONTROL_STYLES.padding
    });
}

/**
 * Configure controls for line objects
 * Lines have two endpoint controls that can be freely moved to resize and rotate
 */
export function configureLineControls(line: fabric.Line): void {
    applyControlStyles(line);

    // Only show the two endpoint controls
    line.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        tl: true, // start point
        tr: false,
        bl: false,
        br: true, // end point
        mtr: false // no rotation control point
    });

    // Hide the border box, show only endpoint controls
    line.set({
        hasBorders: false,
        hasRotatingPoint: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        lockMovementX: false,
        lockMovementY: false
    });

    // Customize the controls to act as moveable endpoints
    // This allows the endpoints to be dragged freely, naturally handling rotation and length
    if (line.controls) {
        // Top-left control (start point of line)
        line.controls.tl = new fabric.Control({
            x: -0.5,
            y: -0.5,
            actionHandler: fabric.controlsUtils.changeWidth,
            cursorStyle: 'pointer',
            actionName: 'modifying line',
            mouseUpHandler: () => true
        });

        // Bottom-right control (end point of line)
        line.controls.br = new fabric.Control({
            x: 0.5,
            y: 0.5,
            actionHandler: fabric.controlsUtils.changeWidth,
            cursorStyle: 'pointer',
            actionName: 'modifying line',
            mouseUpHandler: () => true
        });
    }
}

/**
 * Configure controls for circle objects
 * Circles should maintain aspect ratio (uniform scaling only)
 */
export function configureCircleControls(circle: fabric.Circle): void {
    applyControlStyles(circle);

    // Hide middle controls, only show corners
    circle.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        mtr: true // keep rotation
    });

    // Lock aspect ratio to keep it circular
    circle.set({
        lockScalingFlip: true
    });
}

/**
 * Configure controls for rectangle objects
 */
export function configureRectangleControls(rect: fabric.Rect): void {
    applyControlStyles(rect);

    // Show all controls for free resizing
    rect.setControlsVisibility({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        mtr: true
    });
}

/**
 * Configure controls for triangle objects
 */
export function configureTriangleControls(triangle: fabric.Triangle): void {
    applyControlStyles(triangle);

    // Show corner controls only
    triangle.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        mtr: true
    });
}

/**
 * Configure controls for text objects
 * Text should only resize horizontally, height adjusts automatically
 */
export function configureTextControls(text: fabric.Textbox): void {
    applyControlStyles(text);

    // Only allow horizontal resizing (width adjustment)
    text.setControlsVisibility({
        mt: false,
        mb: false,
        ml: true,
        mr: true,
        tl: false,
        tr: false,
        bl: false,
        br: false,
        mtr: true // keep rotation
    });

    // Lock vertical scaling
    text.set({
        lockScalingY: true,
        lockScalingFlip: true
    });
}

/**
 * Configure controls for image objects
 */
export function configureImageControls(image: fabric.FabricImage): void {
    applyControlStyles(image);

    // Show all corner controls
    image.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        mtr: true
    });

    // Optionally maintain aspect ratio for images
    image.set({
        lockScalingFlip: true
    });
}

/**
 * Configure controls for path (drawing) objects
 */
export function configurePathControls(path: fabric.Path): void {
    applyControlStyles(path);

    // Show all controls
    path.setControlsVisibility({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        mtr: true
    });
}

/**
 * Configure controls for arrow groups
 * Arrows should maintain their shape when resized
 */
export function configureArrowControls(group: fabric.Group): void {
    applyControlStyles(group);

    // Only allow endpoints to move, similar to lines
    group.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        tl: true, // start point
        tr: false,
        bl: false,
        br: true, // end point
        mtr: false // no rotation
    });

    // Lock scaling and rotation
    group.set({
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasRotatingPoint: false
    });
}

/**
 * Auto-detect object type and apply appropriate controls
 */
export function configureObjectControls(obj: fabric.Object): void {
    if (obj instanceof fabric.Line) {
        configureLineControls(obj);
    } else if (obj instanceof fabric.Circle) {
        configureCircleControls(obj);
    } else if (obj instanceof fabric.Rect) {
        configureRectangleControls(obj);
    } else if (obj instanceof fabric.Triangle) {
        configureTriangleControls(obj);
    } else if (obj instanceof fabric.Textbox) {
        configureTextControls(obj);
    } else if (obj instanceof fabric.FabricImage) {
        configureImageControls(obj);
    } else if (obj instanceof fabric.Path) {
        configurePathControls(obj);
    } else if (obj instanceof fabric.Group) {
        // Check if it's an arrow group by checking for line children
        const hasLines = obj.getObjects().some((child) => child instanceof fabric.Line);
        if (hasLines) {
            configureArrowControls(obj);
        } else {
            applyControlStyles(obj);
        }
    } else {
        // Default controls for unknown types
        applyControlStyles(obj);
    }
}
