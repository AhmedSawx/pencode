import p5 from "p5";
import { VectorObject } from "./vector-object"
// import * as ts from "typescript";

export class Custom extends VectorObject {
  
  ANYdraw: string = "";
  
  protected _onlyIncludeParamters: string[] = ['ANYdraw'];
  
  constructor(
    x: Number = 0,
    y: Number = 0,
    name: String = '',
    ANYdraw: string = "",
    parent?: VectorObject
  ) {
    super(x, y, name, parent)
    this.ANYdraw = ANYdraw;
  }
  
  draw(p: p5): void {
    console.log(`This is a custom Vectorobject, its name is ${this.name}`);

    // Flatten newlines to spaces (to avoid syntax errors)
    const cleanedCode = this.ANYdraw.replace(/[\r\n]+/g, ' ');
  
    try {
      // Execute the code directly — user must include "p." manually
      const executor = new Function("p", cleanedCode);
      executor(p);
    } catch (error) {
      console.error("Error executing user code:", error);
    }
  }
}