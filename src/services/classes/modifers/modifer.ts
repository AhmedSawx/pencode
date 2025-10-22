import { EmbeddedActionsParser, Lexer } from 'chevrotain'
import type { TokenType } from 'chevrotain'
import { VectorObject } from '../vectors'

export class Modifer extends EmbeddedActionsParser {
  static description: string = "This is the base class for all modifiers.";
  static parameter_descriptions: { [key: string]: string } = {};

  ruleStatement: any;
  Tokens: TokenType[]
  ref: VectorObject

  constructor(ref: VectorObject, Tokens: TokenType[]) {
    super(Tokens)
    this.Tokens = Tokens
    this.ref = ref
  }

  parse(content: string) {
    if (content[0] === "'" && content[content.length - 1] === "'") {
      content = content.slice(1, content.length - 1)
    }

    let lexar = new Lexer(this.Tokens)

    let lexed = lexar.tokenize(content).tokens

    this.input = lexed

    let ast = this.ruleStatement()

    if (this.errors.length > 0) {
      throw Error(
        'Sad sad panda, parsing errors detected!\n' + this.errors[0].message
      )
    }

    return ast
  }
}
