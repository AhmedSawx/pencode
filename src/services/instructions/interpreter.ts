import * as chevrotain from "chevrotain";
import { vectorObjects, modifers } from "./base-variables";
import { VectorObject } from "../classes/vectors";

const createToken = chevrotain.createToken;

// --- TOKENS ---
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: chevrotain.Lexer.SKIPPED,
});
const ExclamationPoint = createToken({
  name: "ExclamationPoint",
  pattern: /!/,
});
const As = createToken({ name: "As", pattern: /as/i });
const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_]+[0-9]*/,
});
const Child = createToken({ name: "Child", pattern: /CHILD/i });
const To = createToken({ name: "To", pattern: /TO/i });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const SetKeyword = createToken({ name: "Set", pattern: /SET/i });
const Any = createToken({ name: "Any", pattern: /'[^']*'/ });
const NumberToken = createToken({ name: "Number", pattern: /-?[0-9]+(.[0-9]+)?/ });
const StringToken = createToken({
  name: "String",
  pattern: /"[a-zA-Z0-9_-]*"/,
});
const LeftParentheses = createToken({ name: "LeftParentheses", pattern: /\(/ });
const RightParentheses = createToken({
  name: "RightParentheses",
  pattern: /\)/,
});
const Colon = createToken({ name: "Colon", pattern: /:/ });

const AllTokens = [
  WhiteSpace,
  ExclamationPoint,
  As,
  Child,
  SetKeyword,
  To,
  Any,
  Comma,
  LeftParentheses,
  RightParentheses,
  Colon,
  Identifier,
  NumberToken,
  StringToken,
];

const ObjectLexer = new chevrotain.Lexer(AllTokens);

// --- PARSER ---
class ObjectParser extends chevrotain.EmbeddedActionsParser {
  public objectStatement: any;
  public semanticErrors: any[] = [];
  public objects: { objectName: string; object: VectorObject }[] = [];
  public mode: "execute" | "lint" = "execute";

  constructor() {
    super(AllTokens, { recoveryEnabled: true });

    const $ = this as any;

    // -- UTILITY METHODS --
    const addSemanticError = (message: string, token: chevrotain.IToken) => {
      if (this.mode === "lint" && token) {
        this.semanticErrors.push({ message, token });
      }
    };

    const throwOrAddError = (message: string, token: chevrotain.IToken) => {
      if (this.mode === "execute") {
        throw new Error(message);
      } else {
        addSemanticError(message, token);
      }
    };

    const assignParametersToObject = (object: any, parameters: any[]) => {
      if (!object) return;

      const standardObjectParameters = object.getParams();
      const variadicDefinition = (object.constructor as any).variadicParameters;
      const usedArguments = new Set<string>();
      const variadicParams: any[] = [];

      let errorInfo: { message: string; token: chevrotain.IToken } | null =
        null;

      // Process all parameters in a single loop
      parameters.forEach((param, index) => {
        if (!param || errorInfo) return;

        // 1. Handle named parameters
        if (param.name) {
          // Check if it's a standard parameter
          const standardParamDef = standardObjectParameters.find(
            (p: any) => p.name === param.name,
          );
          if (standardParamDef) {
            if (usedArguments.has(param.name)) {
              errorInfo = {
                message: `Parameter \"${param.name}\" has already been assigned.`,
                token: param.nameToken,
              };
              return;
            }
            usedArguments.add(param.name);
            object[standardParamDef.actualName] = param.value;
            return; // Done with this param
          }

          // Check if it's a variadic-style parameter
          const variadicRegex = /([a-zA-Z_]+)([0-9]+)/;
          const match = param.name.match(variadicRegex);
          if (match) {
            if (
              variadicDefinition &&
              variadicDefinition.params.some((p: any) => p.name === match[1])
            ) {
              variadicParams.push({
                ...param,
                variadicName: match[1],
                index: parseInt(match[2], 10),
              });
              return; // Done with this param
            }
          }

          // If it's neither a valid standard nor a valid variadic param, it's an error
          errorInfo = {
            message: `Parameter \"${param.name}\" is not valid for a ${object.constructor.name}.`,
            token: param.nameToken,
          };
          return;
        }

        // 2. Handle positional parameters
        else {
          const targetParam = standardObjectParameters[param.order - 1];
          if (!targetParam) {
            errorInfo = {
              message: `Too many parameters for ${object.constructor.name}.`,
              token: param.token,
            };
            return;
          }
          if (usedArguments.has(targetParam.name)) {
            errorInfo = {
              message: `Positional parameter #${index + 1} conflicts with an already assigned named parameter.`,
              token: param.token,
            };
            return;
          }
          usedArguments.add(targetParam.name);
          object[targetParam.actualName] = param.value;
        }
      });

      if (errorInfo !== null) {
        return throwOrAddError(errorInfo["message"], errorInfo["token"]);
      }

      // 3. Post-process and validate the collected variadic parameters
      if (variadicDefinition) {
        const grouped = new Map<number, any[]>();
        variadicParams.forEach((p) => {
          if (!grouped.has(p.index)) {
            grouped.set(p.index, []);
          }
          grouped.get(p.index)!.push(p);
        });

        const sortedGroups = [...grouped.entries()].sort((a, b) => a[0] - b[0]);

        if (sortedGroups.length > 0) {
          // Order check
          for (let i = 0; i < sortedGroups.length; i++) {
            if (sortedGroups[i][0] !== i + 1) {
              return throwOrAddError(
                `Variadic parameter groups must be sequential. Found index ${sortedGroups[i][0]} but expected ${i + 1}.`,
                sortedGroups[i][1][0].nameToken,
              );
            }
          }
        }

        // Minimum occurrences check
        if (sortedGroups.length < variadicDefinition.min) {
          return throwOrAddError(
            `At least ${variadicDefinition.min} ${variadicDefinition.groupName}(s) are required, but only ${sortedGroups.length} were provided.`,
            parameters[0]?.token,
          );
        }

        const finalVariadicData: any[] = [];

        // Dependency and assignment check
        sortedGroups.forEach(([index, groupParams]) => {
          const groupData: { [key: string]: any } = {};
          for (const def of variadicDefinition.params) {
            const providedParam = groupParams.find(
              (p) => p.variadicName === def.name,
            );
            if (providedParam) {
              groupData[def.name] = providedParam.value;
            } else if (!def.optional) {
              return throwOrAddError(
                `Parameter \"${def.name}${index}\" is missing. Each ${variadicDefinition.groupName} group must be complete.`,
                groupParams[0]?.nameToken || parameters[0]?.token,
              );
            }
          }
          finalVariadicData.push(groupData);
        });

        if (variadicDefinition.storeIn) {
          object[variadicDefinition.storeIn] = finalVariadicData;
        }
      }
    };

    // -- PARSER RULES --

    this.objectStatement = $.RULE("objectStatement", () => {
      let order = 1;

      const processSingleStatement = (stmt: any) => {
        if (!stmt) return;
        const { object, name, parent } = stmt;
        if (object && object.object) {
          if (parent) {
            const parentObject = this.objects.find(
              (p) => p.objectName === parent.parent,
            );
            if (!parentObject) {
              throwOrAddError(
                `Parent object \"${parent.parent}\" is undefined.`,
                parent.parentToken,
              );
            } else {
              object.object.parent = parentObject.object;
            }
          }

          let finalObjectName = "";
          if (name) {
            if (!this.objects.find((p) => p.objectName === name.name.image)) {
              finalObjectName = name.name.image;
            } else {
              throwOrAddError(
                `Name \"${name.name.image}\" is already taken.`,
                name.name,
              );
              finalObjectName = `${object.objectName}(${order})`;
            }
          } else {
            finalObjectName = `${object.objectName}(${order})`;
          }
          object.objectName = finalObjectName;
          object.object.name = finalObjectName;
          this.objects.push(object);

          // Handle mirrored object if it exists
          if (object.object.mirroredObject) {
            const mirroredInstance = object.object.mirroredObject;
            const mirroredObjectName = `${finalObjectName}-mirrored`;
            mirroredInstance.name = mirroredObjectName;
            const mirroredContainer = {
              objectName: mirroredObjectName,
              object: mirroredInstance,
              parameters: [], // Already applied
            };
            this.objects.push(mirroredContainer);
          }

          order++;
        }
      };

      const firstStmt = $.SUBRULE($.singleObjectAndModifiers);
      $.ACTION(() => processSingleStatement(firstStmt));

      $.MANY(() => {
        $.CONSUME(Comma);
        const nextStmt = $.SUBRULE2($.singleObjectAndModifiers);
        $.ACTION(() => processSingleStatement(nextStmt));
      });

      const trailingComma = $.OPTION(() => {
        return $.CONSUME2(Comma);
      });

      $.ACTION(() => {
        if (trailingComma) {
          throwOrAddError(
            "A trailing comma at the end of the statement is not allowed.",
            trailingComma,
          );
        }
      });

      return { type: "OBJECT_STATEMENT", objects: this.objects };
    });

    $.RULE("singleObjectAndModifiers", () => {
      let object: any;
      let name: any;
      let parent: any;

      object = $.OR([
        { ALT: () => $.SUBRULE($.objectClause) },
        { ALT: () => $.SUBRULE($.cloneClause) },
      ]);

      $.OPTION(() => {
        name = $.SUBRULE($.nameClause);
      });
      $.OPTION1(() => {
        parent = $.SUBRULE($.childClause);
      });

      $.OPTION2(() => {
        $.CONSUME(SetKeyword);
        $.AT_LEAST_ONE({
          DEF: () => {
            const modifierName = $.CONSUME(Identifier);
            $.CONSUME(LeftParentheses);
            const content = $.CONSUME(Any);
            $.CONSUME(RightParentheses);

            $.ACTION(() => {
              if (object && object.object) {
                const modifierKey = Object.keys(modifers).find(
                  (k) => k.toLowerCase() === modifierName.image.toLowerCase(),
                );
                const ModifierClass = (modifers as any)[modifierKey || ""];

                if (!ModifierClass) {
                  throwOrAddError(
                    `Modifier \"${modifierName.image}\" is undefined.`,
                    modifierName,
                  );
                } else {
                  const unsupported = object.object._unsupportedModifiers;
                  if (unsupported && unsupported.includes(modifierKey || "")) {
                    throwOrAddError(
                      `Modifier \"${modifierKey}\" is not supported by the ${object.object.constructor.name} object.`,
                      modifierName,
                    );
                    return;
                  }

                  const modifier = new ModifierClass(object.object);
                  try {
                    modifier.parse(content.image.slice(1, -1));
                  } catch (e: any) {
                    throwOrAddError(e.message, modifierName);
                  }
                }
              }
            });
          },
        });
      });

      return { object, name, parent };
    });

    $.RULE("nameClause", () => {
      $.CONSUME(As);
      const name = $.CONSUME(Identifier);
      return { name: name };
    });

    $.RULE("childClause", () => {
      $.CONSUME(Child);
      $.CONSUME(To);
      const parent = $.CONSUME(Identifier);
      return { parent: parent.image, parentToken: parent };
    });

    $.RULE("cloneClause", () => {
      let parameters: any[] = [];
      let order = 1;
      let object: VectorObject | null = null;
      let objectName: string = "";

      $.CONSUME(ExclamationPoint);
      const name = $.CONSUME(Identifier);

      $.ACTION(() => {
        objectName = name.image;
        const foundObject = this.objects.find(
          (p) => p.objectName === objectName,
        );
        if (!foundObject) {
          throwOrAddError(
            `Cannot find named object "${objectName}" to clone.`,
            name,
          );
        } else if (!foundObject.object.isCloneable) {
          throwOrAddError(
            `Object "${objectName}" is a mirrored object and cannot be cloned.`,
            name,
          );
        } else {
          object = new (foundObject.object.constructor as any)();
          for (const [key, value] of Object.entries(foundObject.object)) {
            if (key in object!) {
              (object as any)[key] = value;
            }
          }
        }
      });

      $.CONSUME(LeftParentheses);
      $.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          const param = $.SUBRULE($.parameterClause);
          $.ACTION(() => {
            if (param) {
              if (!param.name) {
                param.order = order++;
              }
              parameters.push(param);
            }
          });
        },
      });
      $.CONSUME(RightParentheses);

      $.ACTION(() => {
        if (object) {
          assignParametersToObject(object, parameters);
        }
      });

      return { objectName, object, parameters };
    });

    $.RULE("objectClause", () => {
      let parameters: any[] = [];
      let order = 1;
      let object: VectorObject | null = null;
      let objectName: string = "";

      const name = $.CONSUME(Identifier);

      $.ACTION(() => {
        objectName = name.image;
        const ObjectClass = (vectorObjects as any)[
          Object.keys(vectorObjects).find(
            (k) => k.toLowerCase() === objectName.toLowerCase(),
          ) || ""
        ];
        if (!ObjectClass) {
          throwOrAddError(`Object type \"${objectName}\" not found.`, name);
        } else {
          object = new ObjectClass();
        }
      });

      $.CONSUME(LeftParentheses);
      $.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          const param = $.SUBRULE($.parameterClause);
          $.ACTION(() => {
            if (param) {
              if (!param.name) {
                param.order = order++;
              }
              parameters.push(param);
            }
          });
        },
      });
      $.CONSUME(RightParentheses);

      $.ACTION(() => {
        if (object) {
          assignParametersToObject(object, parameters);
        }
      });

      return { objectName, object, parameters };
    });

    $.RULE("parameterClause", () => {
      let name: chevrotain.IToken | null = null;
      let exprResult: { value: any; token: chevrotain.IToken } | undefined;

      $.OPTION3(() => {
        name = $.CONSUME(Identifier);
        $.CONSUME(Colon);
      });
      exprResult = $.SUBRULE($.parameterExpression);

      return $.ACTION(() => {
        return {
          name: name ? name.image : null,
          nameToken: name,
          value: exprResult!.value,
          token: exprResult!.token,
          order: 0,
        };
      });
    });

    $.RULE("parameterExpression", () => {
      let token: chevrotain.IToken;
      $.OR([
        {
          ALT: () => {
            token = $.CONSUME(NumberToken);
          },
        },
        {
          ALT: () => {
            token = $.CONSUME(StringToken);
          },
        },
        {
          ALT: () => {
            token = $.CONSUME(Any);
          },
        },
      ]);

      return $.ACTION(() => {
        let value: any = token.image;
        if (token.tokenType.name === "Number") {
          value = JSON.parse(token.image);
        } else if (
          token.tokenType.name === "String" ||
          token.tokenType.name === "Any"
        ) {
          value = token.image.slice(1, -1);
        }
        return { value, token };
      });
    });

    this.performSelfAnalysis();
  }

  public reset() {
    super.reset();
    this.semanticErrors = [];
    this.objects = [];
  }
}

const parser = new ObjectParser();

// --- INTERPRET FUNCTION ---
export function interpret(
  inputText: string,
  mode: "execute" | "lint" = "execute",
) {
  parser.reset();
  parser.mode = mode;

  const lexResult = ObjectLexer.tokenize(inputText);
  parser.input = lexResult.tokens;

  const ast = parser.objectStatement();

  if (
    mode === "execute" &&
    (parser.errors.length > 0 || lexResult.errors.length > 0)
  ) {
    const lexingError = lexResult.errors[0];
    const parsingError = parser.errors[0];

    if (lexingError) {
      throw new Error(lexingError.message);
    }

    if (parsingError) {
      let message = parsingError.message;
      if (parsingError.name === "MismatchedTokenException") {
        const mismatchedError: any = parsingError;
        message = `Expecting a ${mismatchedError.payload.A.name} but found a ${mismatchedError.payload.B.name}`;
      }
      throw new Error(message);
    }
  }

  if (mode === "lint" && parser.errors.length > 0) {
    const firstError = parser.errors[0];
    parser.errors = [firstError];
  }

  return {
    objects: ast ? parser.objects : [],
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
    semanticErrors: parser.semanticErrors,
  };
}
