import p5 from 'p5'
import { VectorObject } from './vector-object'

export class Layer extends VectorObject {
  //@ts-ignore
  #Graphics: p5.Graphics
  colorMode: string
  
  protected _onlyIncludeParamters: string[] = ['colorMode']

  set Graphics(v: p5.Graphics) {
    this.#Graphics = v
  }

  get Graphics() {
    return this.#Graphics
  }

  //@ts-ignore
  constructor(colorMode: string = '') {
    //@ts-ignore
    super()

    this.colorMode = colorMode
  }

  setup(p: p5): void {
    if (Boolean(!this.colorMode) || Boolean(Number(this.colorMode))) {
      console.warn(
        `Color mode is not defined!. Setting it to "RGB". Next time, choose "RGB" or "HSB" or "HSL".`
      )
    }

    this.Graphics = p.createGraphics(p.width, p.height, p.WEBGL)
    //@ts-ignore
    this.Graphics.colorMode(this.colorMode.toLowerCase())
  }
}
