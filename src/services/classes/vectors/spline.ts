import p5 from "p5";
import { VectorObject } from "./vector-object.js";
// @ts-ignore
import * as brush from "p5.brush";

class Spline extends VectorObject {
  public _unsupportedModifiers: string[] = ['Fill'];
  static description: string =
    "Draws a curved line through a series of two or more points.";

  static variadicParameters = {
    groupName: "point",
    min: 2,
    params: [
      {
        name: "x",
        type: "Number",
        description: "The x-coordinate of a point on the spline.",
      },
      {
        name: "y",
        type: "Number",
        description: "The y-coordinate of a point on the spline.",
      },
      {
        name: "p",
        type: "Number",
        description: "The pressure at this point (optional).",
        optional: true,
      },
    ],
    storeIn: "points", // Property on the instance to store the array of points
  };

  public points: { x: number; y: number; p?: number }[] = [];
  public color: string = "black";
  public weight: number = 1;
  public curvature: number = 0.5;

  protected _onlyIncludeParamters: string[] = ["color", "weight", "curvature"];

  constructor(
    color: string = "black",
    weight: number = 1,
    curvature: number = 0.5,
    points: { x: number; y: number; p?: number }[] = [],
  ) {
    super(0, 0, ""); // Splines don't have a single x/y position
    this.color = color;
    this.weight = weight;
    this.curvature = curvature;
    this.points = points;
  }

  setup(p?: p5): void {
    super.setup(p);

    if (Boolean(this.layer && this.useBrushes)) {
      console.log("Brush loaded");
      brush.load(this.layer.p);
    }
  }

  draw() {
    if (this.points.length < 2) {
      return; // Not enough points to draw
    }

    console.log("Drawing spline now");

    console.log(this.points);

    brush.strokeWeight(this.weight);

    brush.beginShape(this.curvature);

    // Duplicate the first point for the curve calculation
    const firstPoint = this.points[0];
    if (firstPoint.p !== undefined) {
      brush.vertex(firstPoint.x, firstPoint.y, firstPoint.p);
    } else {
      brush.vertex(firstPoint.x, firstPoint.y);
    }

    // Add all the points
    for (const point of this.points) {
      if (point.p !== undefined) {
        brush.vertex(point.x, point.y, point.p);
      } else {
        brush.vertex(point.x, point.y);
      }
    }

    // Duplicate the last point for the curve calculation
    const lastPoint = this.points[this.points.length - 1];
    if (lastPoint.p !== undefined) {
      brush.vertex(lastPoint.x, lastPoint.y, lastPoint.p);
    } else {
      brush.vertex(lastPoint.x, lastPoint.y);
    }

    brush.endShape();
  }

  flip(direction: "horizontal" | "vertical"): void {
    if (this.points.length === 0) return;

    const xs = this.points.map(p => p.x);
    const ys = this.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const cx = minX + (maxX - minX) / 2;
    const cy = minY + (maxY - minY) / 2;

    this.points = this.points.map(point => {
      if (direction === "horizontal") {
        return { ...point, x: cx - (point.x - cx) };
      } else { // vertical
        return { ...point, y: cy - (point.y - cy) };
      }
    });
  }

  cloneAndReflect(origin: { x: number; y: number; }, axis: 'horizontal' | 'vertical'): VectorObject {
    const clone = super.cloneAndReflect(origin, axis) as Spline;
    clone.points = this.points.map(point => {
        if (axis === 'vertical') {
            return { ...point, x: 2 * origin.x - point.x };
        } else { // horizontal
            return { ...point, y: 2 * origin.y - point.y };
        }
    });
    return clone;
  }
}

export { Spline };
