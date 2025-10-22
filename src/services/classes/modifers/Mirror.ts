import { VectorObject } from '../vectors'
import { Modifer } from './modifer'
import { createToken, Lexer } from 'chevrotain'

export class Mirror extends Modifer {
  static description: string = "Mirrors an object across a given origin point and axis. If x and y are not provided, it mirrors across the object's own center.";

  constructor(ref: VectorObject) {
    const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_]+/ });
    const StringToken = createToken({ name: "String", pattern: /"[a-zA-Z]+"/ });
    const NumberToken = createToken({ name: "Number", pattern: /-?[0-9]+(\.[0-9]+)?/ });
    const Colon = createToken({ name: "Colon", pattern: /:/ });
    const Comma = createToken({ name: "Comma", pattern: /,/ });
    const WS = createToken({ name: "WS", pattern: /\s+/, group: Lexer.SKIPPED });

    const allTokens = [Identifier, StringToken, NumberToken, Colon, Comma, WS];

    super(ref, allTokens);

    const $ = this;
    const params = { x: null as number | null, y: null as number | null, axis: 'vertical' as 'horizontal' | 'vertical' };

    const paramRule = $.RULE("param", () => {
        const key = $.CONSUME(Identifier).image;
        $.CONSUME(Colon);
        const value = $.OR([
            { ALT: () => $.CONSUME(NumberToken).image },
            { ALT: () => $.CONSUME(StringToken).image.slice(1, -1) }
        ]);

        if (key === 'x') params.x = parseFloat(value);
        if (key === 'y') params.y = parseFloat(value);
        if (key === 'axis') {
            if (value === 'horizontal' || value === 'vertical') {
                params.axis = value;
            } else {
                throw new Error("Invalid axis for Mirror modifier. Use 'horizontal' or 'vertical'.");
            }
        }
    });

    $.ruleStatement = $.RULE('ruleStatement', () => {
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => $.SUBRULE(paramRule)
      });

      $.ACTION(() => {
        let origin: { x: number; y: number; };

        if (params.x !== null && params.y !== null) {
            origin = { x: params.x, y: params.y };
        } else {
            origin = { x: ref.x.valueOf(), y: ref.y.valueOf() };
        }

        if (ref.cloneAndReflect) {
            ref.mirroredObject = ref.cloneAndReflect(origin, params.axis);
            if (ref.mirroredObject) {
              ref.mirroredObject.isCloneable = false;
            }
        }
      });
    });

    this.performSelfAnalysis();
  }
}
