import p5 from "p5";
import { VectorObject } from "./vector-object";
//@ts-ignore
import * as brush from "p5.brush";
import { projectStore } from "../../../mocks/project-store";
import { state } from "../../../services/state";

export class Brush extends VectorObject {
  protected useDraw: boolean = false;
  public type: string = "";
  public color: string = "black";
  public size: number = 2;

  protected _onlyIncludeParamters: string[] = ["type", "color", "size"];

  constructor(
    x: Number = 0,
    y: Number = 0,
    name: String = "",
    type: string = "",
    color: string = "black",
    size: number = 2,
    parent?: VectorObject,
  ) {
    super(x, y, name, parent);
    this.type = type;
    this.color = color;
    this.size = size;
  }

  setup(_p: p5): void {
    const projectId = window.location.pathname.split("/")[2];
    const project = projectStore.projects.find((pr) => pr.id === projectId);
    
    // Is it a non-discarded custom brush?
    const customBrush = project?.brushes?.find(b => b.name === this.type && b.status !== 'discarded');

    if (customBrush) {
      // It's a valid custom brush
      const brushColor = _p.color(this.color);
      VectorObject.featureRegistry.set("brush", {
        method: brush.set,
        params: [this.type, brushColor, this.size],
        cleanup: () => brush.set("pen", "black", 2),
      });
      return; // Done
    }

    // If not a custom brush, is it a default brush?
    const allDefaultBrushes: string[] = brush.box();
    // Filter out globally discarded brushes
    const defaultBrushes = allDefaultBrushes.filter(b => !state.discardedBrushes.includes(b));

    const isDefaultBrush = defaultBrushes.includes(this.type);

    if (isDefaultBrush) {
      // It's a valid default brush
      const brushColor = _p.color(this.color);
      VectorObject.featureRegistry.set("brush", {
        method: brush.set,
        params: [this.type, brushColor, this.size],
        cleanup: () => brush.set("pen", "black", 2),
      });
      return; // Done
    }

    // If we are here, the brush is not found. Fallback to default.
    const availableCustomBrushes = project?.brushes?.filter(b => b.status !== 'discarded').map(b => b.name) || [];
    const availableBrushes = [...new Set([...defaultBrushes, ...availableCustomBrushes])];
    
    console.warn(
      `Brush "${this.type}" not found. Falling back to default 'pen' brush. Available brushes: ${availableBrushes.join(", ")}`
    );

    const brushColor = _p.color("black");
    VectorObject.featureRegistry.set("brush", {
      method: brush.set,
      params: ["pen", brushColor, 2],
      cleanup: () => brush.set("pen", "black", 2), // Redundant but safe
    });
  }
}
