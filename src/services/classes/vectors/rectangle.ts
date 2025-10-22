import p5, { Color } from "p5";
import { VectorObject } from "./vector-object.js";
import type { IToken } from "chevrotain";
// @ts-ignore
import * as brush from "p5.brush";

/**
 * Specific vector classes that inherit from the base class
 */
class Rectangle extends VectorObject {
  static description: string = "Draws a rectangle on the canvas.";
  static parameter_descriptions: { [key: string]: string } = {
    x: "The x-coordinate of the rectangle's top-left corner.",
    y: "The y-coordinate of the rectangle's top-left corner.",
    width: "The width of the rectangle.",
    height: "The height of the rectangle.",
    color: "The stroke color of the rectangle.",
  };

  color: any | IToken;
  width: Number;
  height: Number;
  public fill = { color: null, opacity: 255, bleed: 0.1, bleedDir: 'out' };

  protected _onlyIncludeParamters: string[] = ["color", "y", "x", "width", "height"];

  public useBrushes: boolean = true;

  constructor(
    x: Number = 0,
    y: Number = 0,
    width: Number = 50,
    height: Number = 50,
    color: any = "",
    name: String = "",
    parent?: VectorObject,
  ) {
    super(x, y, name, parent);
    this.width = width;
    this.height = height;
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
    let x = this.parent ? this.x.valueOf() + this.parent.x.valueOf() : this.x;
    let y = this.parent ? this.y.valueOf() + this.parent.y.valueOf() : this.y;

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
      brush.rect(x, y, this.width, this.height);
    } else {
      // @ts-ignore
      p.rect(x, y, this.width, this.height);
    }

    // Cleanup
    brush.noFill();
  }

  flip(direction: "horizontal" | "vertical"): void {
    if (direction === "horizontal") {
      // Rectangle's x is top-left, so center is x + width/2.
      // We don't need to flip it visually as it's symmetrical,
      // but if it had orientation, we would.
    } else {
      // Same for vertical
    }
  }
}

export { Rectangle };