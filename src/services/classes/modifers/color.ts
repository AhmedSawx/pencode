import { VectorObject } from '../vectors'
import { Modifer } from './modifer'
import { createToken, Lexer } from 'chevrotain'

export class Color extends Modifer {
  static description: string = "Sets the color of an object. It accepts a color name, HEX, RGB, or HSL value.";
  static parameter_descriptions: { [key: string]: string } = {};

  declare ruleStatement: any

  constructor(ref: VectorObject) {
    const word = createToken({
      name: 'word',
      pattern: /[a-zA-Z]+/i
    })

    const GRAYSCALE = createToken({
      name: 'GRAYSCALE',
      pattern: /[0-9]{1,3}/
    })

    const RGB = createToken({
      name: 'RGB',
      pattern:
        /\b(0|([1-9][0-9]?|1[0-9]{2}|2[0-4][0-9]|25[0-5])),(0|([1-9][0-9]?|1[0-9]{2}|2[0-4][0-9]|25[0-5])),(0|([1-9][0-9]?|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\b/
    })

    const HSA = createToken({
      name: 'HSA',
      pattern: /[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/
    })

    const RGBPercent = createToken({
      name: 'RGBPercent',
      pattern: /[0-9]{1,3}%,[0-9]{1,3}%,[0-9]{1,3}%/
    })

    const HEX = createToken({
      name: 'HEX',
      pattern: /#([A-Fa-f0-9]{3,6})/
    })

    const Comma = createToken({
      name: 'Comma',
      pattern: /,/
    })

    const WS = createToken({ name: 'WS', pattern: /\s+/, group: Lexer.SKIPPED })

    let Tokens = [word, RGB, HSA, RGBPercent, Comma, GRAYSCALE, HEX, WS]

    super(ref, Tokens)

    const $ = this

    $.ruleStatement = $.RULE('ruleStatement', () => {
      let color = $.OR([
        { ALT: () => $.CONSUME(word) },
        { ALT: () => $.CONSUME(RGB) },
        { ALT: () => $.CONSUME(HSA) },
        { ALT: () => $.CONSUME(RGBPercent) },
        { ALT: () => $.CONSUME(GRAYSCALE) },
        { ALT: () => $.CONSUME(HEX) }
      ])

      //console.log(color)

      $.ACTION(() => {
        //console.log('HERE =>')
        //@ts-ignore
        if ('color' in ref) {
          //@ts-ignore
          ref.color = color
        } else {
          throw Error(
            "Color isn't on this object, Please look for other object"
          )
        }
      })

      return {
        type: 'COLOR_STATEMENT',
        value: color
      }
    })

    this.performSelfAnalysis()
  }
}
