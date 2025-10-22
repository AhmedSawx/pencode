import p5 from "p5";
// @ts-ignore
import * as brush from "p5.brush";

/**
 * Base class for all vector objects
 */
class VectorObject {
  static description: string = "This is the base class for all vector objects.";
  static parameter_descriptions: { [key: string]: string } = {
    x: "The x-coordinate of the object.",
    y: "The y-coordinate of the object.",
    name: "The name of the object.",
    parent: "The parent object.",
  };

  static count = 0;
  x: Number = 0;
  y: Number = 0;
  public parent: VectorObject | undefined;
  public name: String = "";
  public layer!: { name: String; p?: p5.Graphics; canvas?: p5 };
  public mirroredObject: VectorObject | null = null;
  public isCloneable: boolean = true;
  public fill: { color: any, opacity: number, bleed: number, bleedDir: string } | null = null;
  
  public _unsupportedModifiers: string[] = [];

  protected _onlyIncludeParamters: string[] = [];

  protected useDraw: boolean = true;

  // Registry to store feature methods and parameters
  protected static featureRegistry: Map<
    string,
    { method: Function; params: any[]; cleanup?: Function }
  > = new Map();

  protected appliedFeatures: Map<
    string,
    { method: Function; params: any[]; cleanup?: Function }
  > = new Map();

  protected static registerFeature(
    featureType: string,
    method: Function,
    params: any[],
    cleanup?: Function,
  ): void {
    this.featureRegistry.set(featureType, { method, params, cleanup });
  }

  // Initialize default features internally
  protected static initDefaultFeatures(): void {
    // Default brush (can be overridden in subclass)
    this.featureRegistry.set("brush", {
      method: brush.set,
      params: ["pen", "black", 2],
      cleanup: () => brush.set("pen", "black", 0),
    });

    // Default field (can be overridden in subclass)
    this.featureRegistry.set("field", {
      method: brush.noField,
      params: [],
      cleanup: () => brush.noField(),
    });
  }

  static resetFeatures(): void {
    this.featureRegistry.clear();
    this.initDefaultFeatures();
  }

  public useBrushes: boolean = true;

  public get onlyIncludeParamters() {
    return this._onlyIncludeParamters;
  }

  constructor(
    x: Number = 0,
    y: Number = 0,
    name: String = "",
    parent?: VectorObject,
  ) {
    // Common properties and methods for all vector objects
    this.x = x;
    this.y = y;
    this.name = name;
    this.parent = parent;

    VectorObject.count++;
  }

  getParams() {
    const formatted: any[] = [];
    const keysDone = new Set<string>();

    // Use a for...in loop to get all properties, including inherited ones
    for (const key in this) {
      // Skip functions, private properties, and duplicates
      if (
        typeof this[key as keyof this] === "function" ||
        key.startsWith("_") ||
        keysDone.has(key)
      ) {
        continue;
      }

      // If _onlyIncludeParamters is used, only include those keys
      if (
        this.onlyIncludeParamters.length > 0 &&
        !this.onlyIncludeParamters.includes(key)
      ) {
        continue;
      }

      // Exclude base properties that are not in _onlyIncludeParamters
      if (
        !this.onlyIncludeParamters.includes(key) &&
        (key === "name" || key === "parent" || key === "useBrushes")
      ) {
        continue;
      }

      const isAnyPrefix = key.toLowerCase().startsWith("any");
      const finalName = isAnyPrefix ? key.slice(3) : key;

      const propValue = this[key as keyof this];
      let propType = isAnyPrefix ? "any" : typeof propValue;
      if (propType === "object" && propValue instanceof Number) {
        propType = "Number";
      } else if (propType === "object" && propValue instanceof String) {
        propType = "string";
      }

      formatted.push({
        name: finalName,
        actualName: key,
        type: propType,
        value: propValue,
        index: formatted.length,
        description: (this.constructor as any).parameter_descriptions[
          finalName
        ],
      });
      keysDone.add(key);
    }

    console.log("Getting params for " + this.constructor.name + ":", formatted);
    return formatted.sort((a, b) => a.name.localeCompare(b.name));
  }

  init(p: p5) {
    if (!this.useDraw) return;

    if (Boolean(this.layer && this.layer.p)) {
      // Apply dynamic features (e.g., brush.set, brush.field)
      for (const [_, { method, params }] of this.appliedFeatures.entries()) {
        method(...params); // Execute the stored method with parameters
      }
      console.log(
        `[DEBUG] Initializing object: ${this.constructor.name}, name: ${this.name}`,
      );
      //@ts-ignore
      this.draw(this.layer.p);
      console.log(
        `[DEBUG] Finished drawing object: ${this.constructor.name}, name: ${this.name}`,
      );

      for (const [_, { cleanup }] of this.appliedFeatures.entries()) {
        if (cleanup) cleanup();
      }

      // brush.noField();
    } else {
      // Apply dynamic features for non-layered objects
      for (const [_, { method, params }] of this.appliedFeatures.entries()) {
        method(...params);
      }
      
      this.draw(p);

      // Cleanup features
      for (const [_, { cleanup }] of this.appliedFeatures.entries()) {
        if (cleanup) cleanup();
      }
    }
  }

  //@ts-ignore
  setup(p?: p5) {
    this.appliedFeatures = new Map(VectorObject.featureRegistry);
  }

  //@ts-ignore
  draw(p?: p5) {}

  // @ts-ignore
  flip(direction: "horizontal" | "vertical"): void {
    // Base implementation does nothing, to be overridden by subclasses
  }

  cloneAndReflect(origin: { x: number; y: number; }, axis: 'horizontal' | 'vertical'): VectorObject {
    const clone = new (this.constructor as any)();
    // Create a shallow copy
    for (const key in this) {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
            (clone as any)[key] = (this as any)[key];
        }
    }
    if (axis === 'vertical') {
        clone.x = 2 * origin.x - this.x.valueOf();
    } else { // horizontal
        clone.y = 2 * origin.y - this.y.valueOf();
    }
    return clone;
  }
}

export { VectorObject };
