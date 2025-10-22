import p5 from "p5";
import { VectorObject } from "./vector-object.js";

/**
 * Creates a new Line class.
 *
 * @param {number} x - The x-coordinate of the starting point.
 * @param {number} y - The y-coordinate of the starting point.
 * @param {number} x2 - The x-coordinate of the ending point.
 * @param {number} y2 - The y-coordinate of the ending point.
 * @param {string} name - The name of the line.
 */
class Line extends VectorObject {
  public _unsupportedModifiers: string[] = ['Fill'];
  x2: Number;
  y2: Number;
  constructor(
    x: Number = 0,
    y: Number = 0,
    x2: Number = 0,
    y2: Number = 0,
    name: String = "",
    parent?: VectorObject,
  ) {
    super(x, y, name, parent);
    this.x2 = x2;
    this.y2 = y2;
  }

  protected _onlyIncludeParamters: string[] = ["x", "y", "x2", "y2"];

  draw(p: p5 | p5.Graphics) {
    let x = this.parent ? this.x.valueOf() + this.parent.x.valueOf() : this.x;
    let y = this.parent ? this.y.valueOf() + this.parent.y.valueOf() : this.y;
    let x2 = this.parent
      ? this.x2.valueOf() + this.parent.x.valueOf()
      : this.x2;
    let y2 = this.parent
      ? this.y2.valueOf() + this.parent.y.valueOf()
      : this.y2;

    //@ts-ignore
    p.line(x, y, x2, y2);
  }

  flip(direction: "horizontal" | "vertical"): void {
    const cx = (this.x.valueOf() + this.x2.valueOf()) / 2;
    const cy = (this.y.valueOf() + this.y2.valueOf()) / 2;

    if (direction === "horizontal") {
      this.x = cx - (this.x.valueOf() - cx);
      this.x2 = cx - (this.x2.valueOf() - cx);
    } else {
      this.y = cy - (this.y.valueOf() - cy);
      this.y2 = cy - (this.y2.valueOf() - cy);
    }
  }

  cloneAndReflect(origin: { x: number; y: number; }, axis: 'horizontal' | 'vertical'): VectorObject {
    const clone = super.cloneAndReflect(origin, axis) as Line;
    if (axis === 'vertical') {
        clone.x2 = 2 * origin.x - this.x2.valueOf();
    } else { // horizontal
        clone.y2 = 2 * origin.y - this.y2.valueOf();
    }
    return clone;
  }
}

export { Line };
