import { VectorObject } from '../vectors'
import { Modifer } from './modifer'
import { createToken, Lexer } from 'chevrotain'

export class Fill extends Modifer {
  static description: string = "Fills a closed shape with color and an optional bleed effect.";
  static parameter_descriptions: { [key: string]: string } = {
    color: "The fill color (e.g., 'red', '#FF0000').",
    opacity: "The opacity of the fill (0-255).",
    bleed: "The strength of the bleed effect (0-0.5).",
    bleedDir: "The direction of the bleed ('in' or 'out')."
  };

  constructor(ref: VectorObject) {
    const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_]+/ });
    const StringToken = createToken({ name: "String", pattern: /"[^"]*"/ });
    const NumberToken = createToken({ name: "Number", pattern: /-?[0-9]+(\.[0-9]+)?/ });
    const Colon = createToken({ name: "Colon", pattern: /:/ });
    const Comma = createToken({ name: "Comma", pattern: /,/ });
    const WS = createToken({ name: "WS", pattern: /\s+/, group: Lexer.SKIPPED });

    const allTokens = [Identifier, StringToken, NumberToken, Colon, Comma, WS];

    super(ref, allTokens);

    const $ = this;
    const params = { color: null as string | null, opacity: null as number | null, bleed: null as number | null, bleedDir: null as string | null };

    const paramRule = $.RULE("param", () => {
        const key = $.CONSUME(Identifier).image;
        $.CONSUME(Colon);
        const value = $.OR([
            { ALT: () => $.CONSUME(NumberToken).image },
            { ALT: () => $.CONSUME(StringToken).image.slice(1, -1) }
        ]);

        switch(key) {
            case 'color':
                params.color = value;
                break;
            case 'opacity':
                params.opacity = parseFloat(value);
                break;
            case 'bleed':
                params.bleed = parseFloat(value);
                break;
            case 'bleedDir':
                params.bleedDir = value;
                break;
        }
    });

    $.ruleStatement = $.RULE('ruleStatement', () => {
      $.MANY_SEP({
        SEP: Comma,
        DEF: () => $.SUBRULE(paramRule)
      });

      $.ACTION(() => {
        if (ref.fill === null) {
            throw new Error(`The '${ref.constructor.name}' object does not support the 'Fill' modifier.`);
        }
        
        const fillProps: any = {};
        if (params.color !== null) fillProps.color = params.color;
        if (params.opacity !== null) fillProps.opacity = params.opacity;
        if (params.bleed !== null) fillProps.bleed = params.bleed;
        if (params.bleedDir !== null) fillProps.bleedDir = params.bleedDir;

        // @ts-ignore
        ref.fill = { ...ref.fill, ...fillProps };
      });
    });

    this.performSelfAnalysis();
  }
}
