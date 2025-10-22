import { Rectangle, Line, Layer as LayerObject, Circle, Triangle } from "../classes/vectors/index.js";
import { Color, Layer, Flip, Mirror, Fill } from "../classes/modifers/index.js";
import { Custom } from "../classes/vectors/custom.js";
import { Brush } from "../classes/vectors/brush.js";
import { Field } from "../classes/vectors/field.js";
import { Spline } from "../classes/vectors/spline.js";

const vectorObjects = { Rectangle, Line, Layer: LayerObject, Custom, Brush, Field, Spline, Circle, Triangle };

const modifers = { Layer, Color, Flip, Mirror, Fill };

let vectorsArray: any[] = [];
let unnamedVectors: any = {};

export { vectorObjects, modifers, vectorsArray, unnamedVectors };