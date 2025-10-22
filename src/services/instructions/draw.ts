import { projectStore } from "@/mocks/project-store";
import { state } from "../state";
import p5 from "p5";
// @ts-ignore
import * as brush from "p5.brush";
import { VectorObject } from "../classes/vectors";
import type { Brush } from "../../mocks/types";

let Layers: any[] = [];

function draw_image(p: p5, canvasSize: { width: number; height: number }) {
  brush.instance(p);
  VectorObject.resetFeatures();

  p.setup = () => {
    Layers.forEach(() => Layers.pop());

    p.createCanvas(canvasSize.width, canvasSize.height, p.WEBGL);
    brush.load();

    p.pixelDensity(1);
    p.background(255);
    brush.seed(1);

    const projectId = window.location.pathname.split("/")[2];
    const project = projectStore.projects.find((pr) => pr.id === projectId);

    if (project && project.brushes) {
      project.brushes.filter(b => b.status !== 'discarded').forEach((customBrush) => {
        try {
          const brushParams: Partial<Brush> = { ...customBrush };
          if (brushParams.tip && typeof brushParams.tip === 'string') {
            brushParams.tip = new Function('_m', brushParams.tip) as any;
          }
          if (brushParams.pressure && typeof brushParams.pressure.curve === 'string') {
            brushParams.pressure.curve = new Function('x', `return ${brushParams.pressure.curve}`) as any;
          }
          if (brushParams.type === 'standard') {
            delete brushParams.type;
          }
          brush.add(customBrush.name, brushParams);
        } catch (e) {
          console.error(`[DEBUG] Failed to load custom brush "${customBrush.name}":`, e);
        }
      });
    }

    // Find all user-defined Layer objects and create graphics buffers for them
    state.vectorsArray.objects.forEach((element) => {
      if (element.object instanceof VectorObject && element.object.constructor.name === 'Layer') {
        const layerGraphics = p.createGraphics(p.width, p.height, p.WEBGL);
        // @ts-ignore
        layerGraphics.colorMode(element.object.colorMode.toLowerCase());
        // @ts-ignore
        element.object.Graphics = layerGraphics;
        Layers.push({
          name: element.object.name,
          p: layerGraphics,
          canvas: p,
        });
      }
    });

    // Assign the graphics buffer to objects that have a layer property
    state.vectorsArray.objects.forEach((element) => {
      if (element.object.layer && typeof element.object.layer.name === 'string') {
        const layerData = Layers.find((l) => l.name === element.object.layer.name);
        if (layerData) {
          element.object.layer.p = layerData.p;
        } else {
          p.remove();
          throw Error(`Layer ${element.object.layer.name} does not exist!`);
        }
      }
      // If no layer is specified, element.object.layer remains undefined.
      
      element.object.setup(p); // Call setup for all objects
    });
  };

  p.draw = () => {
    // 1. Separate objects into layered and non-layered
    const objectsWithLayers = state.vectorsArray.objects.filter(
      (el) => el.object && el.object.layer && el.object.layer.p,
    );
    const objectsWithoutLayers = state.vectorsArray.objects.filter(
      (el) => !el.object || !el.object.layer || !el.object.layer.p,
    );

    // 2. Group layered objects by their graphics buffer
    const objectsByLayer = new Map<p5.Graphics, any[]>();
    objectsWithLayers.forEach((el) => {
      const layerGraphics = el.object.layer.p;
      if (!objectsByLayer.has(layerGraphics)) {
        objectsByLayer.set(layerGraphics, []);
      }
      objectsByLayer.get(layerGraphics)!.push(el);
    });

    // 3. Draw on layer buffers
    objectsByLayer.forEach((objects, layer) => {
      brush.load(layer);
      layer.clear(); // Use clear for transparent background
      objects.forEach((element: any) => {
        element.object.init(p); // init will use layer.p
      });
      brush.reDraw();
      brush.reBlend();
    });

    // 4. Draw directly on main canvas
    brush.load(p);
    p.background(255); // Clear main canvas
    objectsWithoutLayers.forEach((element: any) => {
      if (!element.object) return;
      element.object.init(p); // init will use main p instance
    });
    brush.reDraw();
    brush.reBlend();

    // 5. Composite layer buffers onto the main canvas
    Layers.forEach((layerData) => {
      if (layerData.p !== p) {
        p.image(layerData.p, -(p.width / 2), -(p.height / 2));
      }
    });

    p.noLoop();
  };
}

class Image {
  static image: p5;
}

export function ondraw(canvasSize: { width: number; height: number }) {
  if (!state.vectorsArray) {
    console.error("vectorsArray is not defined!");
    return;
  }

  if (Boolean(Image.image)) Image.image.remove();

  const sketch = (p: p5) => draw_image(p, canvasSize);
  const container = document.getElementById("drawnimage");
  if (container) {
    Image.image = new p5(sketch, container);
  }
}


