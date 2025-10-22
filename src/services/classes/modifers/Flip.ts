import { VectorObject } from '../vectors'
import { Modifer } from './modifer'
import { createToken, Lexer } from 'chevrotain'

export class Flip extends Modifer {
  static description: string = "Flips an object 'horizontally' or 'vertically' around its own center.";
  static parameter_descriptions: { [key: string]: string } = {};

  declare ruleStatement: any

  constructor(ref: VectorObject) {
    const Direction = createToken({
      name: 'Direction',
      pattern: /horizontal|vertical/i
    })

    const WS = createToken({ name: 'WS', pattern: /\s+/, group: Lexer.SKIPPED })

    let Tokens = [Direction, WS]

    super(ref, Tokens)

    const $ = this

    $.ruleStatement = $.RULE('ruleStatement', () => {
      let direction = $.CONSUME(Direction).image.toLowerCase()

      $.ACTION(() => {
        if (direction === 'horizontal' || direction === 'vertical') {
            ref.flip(direction);
        } else {
            throw Error("Invalid direction for Flip modifier. Use 'horizontal' or 'vertical'.");
        }
      })

      return {
        type: 'FLIP_STATEMENT',
        value: direction
      }
    })

    this.performSelfAnalysis()
  }
}
