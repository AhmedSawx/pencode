import { VectorObject } from '../vectors'
import { Modifer } from './modifer'
import { createToken, Lexer } from 'chevrotain'

export class Layer extends Modifer {
  declare ruleStatement: any

  constructor(ref: VectorObject) {
    const Identifier = createToken({
      name: 'Identifier',
      pattern: /\w+/
    })

    const WS = createToken({ name: 'WS', pattern: /\s+/, group: Lexer.SKIPPED })

    let Tokens = [Identifier, WS]

    super(ref, Tokens)

    const $ = this

    $.ruleStatement = $.RULE('ruleStatement', () => {
      let layer = $.CONSUME(Identifier).image

      $.ACTION(() => {
        //console.log('HERE =>')
        ref.layer = { name: layer, p: undefined }
      })

      return {
        type: 'LAYER_STATEMENT',
        value: ref.layer
      }
    })

    this.performSelfAnalysis()
  }
}
