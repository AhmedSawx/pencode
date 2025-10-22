import p5, { Color } from "p5";
import { VectorObject } from "./vector-object.js";
import type { IToken } from "chevrotain";
// @ts-ignore
import * as brush from "p5.brush";

class Circle extends VectorObject {
  static description: string = "Draws a circle on the canvas.";
  static parameter_descriptions: { [key: string]: string } = {
    x: "The x-coordinate of the circle\'s center.",
    y: "The y-coordinate of the circle\'s center.",
    radius: "The radius of the circle.",
    color: "The stroke color of the circle.",
  };

  color: any | IToken;
  radius: Number;
  public fill = { color: null, opacity: 255, bleed: 0.1, bleedDir: 'out' };

  protected _onlyIncludeParamters: string[] = ["color", "y", "x", "radius"];

  public useBrushes: boolean = true;

  constructor(
    x: Number = 0,
    y: Number = 0,
    radius: Number = 25,
    color: any = "",
    name: String = "",
    parent?: VectorObject,
  ) {
    super(x, y, name, parent);
    this.radius = radius;
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
      brush.circle(x, y, this.radius);
    } else {
      // @ts-ignore
      p.circle(x, y, this.radius);
    }

    // Cleanup
    brush.noFill();
  }
}

export { Circle };
