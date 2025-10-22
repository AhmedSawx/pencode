import p5 from "p5";
import { VectorObject } from "./vector-object";
//@ts-ignore
import * as brush from "p5.brush";
// import * as ts from "typescript";

export class Field extends VectorObject {
  public type: string = "";

  protected _onlyIncludeParamters: string[] = ["type"];

  protected useDraw: boolean = false;

  constructor(
    x: Number = 0,
    y: Number = 0,
    name: String = "",
    type: string = "",
    parent?: VectorObject,
  ) {
    super(x, y, name, parent);
    this.type = type;
  }

  //@ts-ignore
  setup(p: p5): void {
    let fields: string[] = [];

    // console.log(brush.listFields());

    for (let field of brush.listFields()) {
      fields.push(field);
    }

    console.log(fields);

    let selectedField: string =
      fields.find((p) => p === this.type) ?? this.type;

    console.log(selectedField);

    if (!Boolean(selectedField)) {
      console.log("Field is empty");
      VectorObject.registerFeature(
        "field",
        brush.noField,
        [], // Params: [fieldName]
        () => brush.noField(),
      );
    } else if (!Boolean(fields.find((p) => p === selectedField))) {
      console.log("Field has error");
      console.error(
        `Field ${this.type} not found, please use one of these : ${fields.join(", ")}`,
      );
    } else {
      console.log("Field not have error");
      VectorObject.registerFeature(
        "field",
        brush.field,
        [selectedField], // Params: [fieldName]
        () => brush.noField(),
      );
    }
  }
}
