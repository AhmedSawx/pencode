import p5, { Color } from "p5";
import { VectorObject } from "./vector-object.js";
import type { IToken } from "chevrotain";
// @ts-ignore
import * as brush from "p5.brush";

class Triangle extends VectorObject {
  static description: string = "Draws a triangle on the canvas.";
  static parameter_descriptions: { [key: string]: string } = {
    x1: "The x-coordinate of the first vertex.",
    y1: "The y-coordinate of the first vertex.",
    x2: "The x-coordinate of the second vertex.",
    y2: "The y-coordinate of the second vertex.",
    x3: "The x-coordinate of the third vertex.",
    y3: "The y-coordinate of the third vertex.",
    color: "The stroke color of the triangle.",
  };

  color: any | IToken;
  x1: Number;
  y1: Number;
  x2: Number;
  y2: Number;
  x3: Number;
  y3: Number;
  public fill = { color: null, opacity: 255, bleed: 0.1, bleedDir: 'out' };

  protected _onlyIncludeParamters: string[] = ["color", "x1", "y1", "x2", "y2", "x3", "y3"];

  public useBrushes: boolean = true;

  constructor(
    x1: Number = 0,
    y1: Number = 0,
    x2: Number = 50,
    y2: Number = 50,
    x3: Number = 0,
    y3: Number = 50,
    color: any = "",
    name: String = "",
    parent?: VectorObject,
  ) {
    super(0, 0, name, parent);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.color = color;
  }

  //@ts-ignore
  setup(p: p5): void {
    super.setup(p);

    if (Boolean(this.layer && this.useBrushes)) {
      console.log("Brush loaded");
      brush.load(this.layer.p);
    }
  }

  draw(p: p5) {
    let parentX = this.parent ? this.parent.x.valueOf() : 0;
    let parentY = this.parent ? this.parent.y.valueOf() : 0;

    let strokeColor: Color | null;

    if (Boolean(this.color.tokenType)) {
      strokeColor = p.color(this.color.image);
    } else if (Boolean(this.color)) {
      strokeColor = p.color(this.color);
    } else {
      strokeColor = null;
    }

    if (this.fill && this.fill.color) {
        brush.fill(this.fill.color, this.fill.opacity);
        if (this.fill.bleed !== null && this.fill.bleed !== undefined) {
            brush.bleed(this.fill.bleed, this.fill.bleedDir);
        }
    }

    if (Boolean(strokeColor)) {
      brush.stroke(strokeColor);
    }

    if (this.useBrushes) {
      brush.beginShape();
      brush.vertex(this.x1.valueOf() + parentX, this.y1.valueOf() + parentY);
      brush.vertex(this.x2.valueOf() + parentX, this.y2.valueOf() + parentY);
      brush.vertex(this.x3.valueOf() + parentX, this.y3.valueOf() + parentY);
      brush.endShape(p.CLOSE);
    } else {
      // @ts-ignore
      p.triangle(this.x1.valueOf() + parentX, this.y1.valueOf() + parentY, this.x2.valueOf() + parentX, this.y2.valueOf() + parentY, this.x3.valueOf() + parentX, this.y3.valueOf() + parentY);
    }

    // Cleanup
    brush.noFill();
  }

  flip(direction: "horizontal" | "vertical"): void {
    const points = [
        {x: this.x1.valueOf(), y: this.y1.valueOf()},
        {x: this.x2.valueOf(), y: this.y2.valueOf()},
        {x: this.x3.valueOf(), y: this.y3.valueOf()},
    ];

    const centerX = (this.x1.valueOf() + this.x2.valueOf() + this.x3.valueOf()) / 3;
    const centerY = (this.y1.valueOf() + this.y2.valueOf() + this.y3.valueOf()) / 3;

    const flippedPoints = points.map(p => {
        if (direction === 'horizontal') {
            return { x: 2 * centerX - p.x, y: p.y };
        } else {
            return { x: p.x, y: 2 * centerY - p.y };
        }
    });

    this.x1 = flippedPoints[0].x;
    this.y1 = flippedPoints[0].y;
    this.x2 = flippedPoints[1].x;
    this.y2 = flippedPoints[1].y;
    this.x3 = flippedPoints[2].x;
    this.y3 = flippedPoints[2].y;
  }
}

export { Triangle };
