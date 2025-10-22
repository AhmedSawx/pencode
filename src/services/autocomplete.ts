import { interpret } from './instructions/interpreter';
import { Rectangle, Line, Layer as LayerObject, Custom, Brush, Field, Spline, Circle, Triangle } from './classes/vectors';
import { Color, Layer, Flip, Mirror, Fill } from './classes/modifers';

export const languageModel = {
  objects: {
    Rectangle,
    Line,
    Layer: LayerObject,
    Custom,
    Brush,
    Field,
    Spline,
    Circle,
    Triangle,
  },
  modifiers: {
    Color,
    Layer,
    Flip,
    Mirror,
    Fill,
  },
};

function getWordAt(text: string, index: number): { word: string, start: number, end: number } | null {
  const left = text.slice(0, index + 1).search(/\w+$/);
  const right = text.slice(index).search(/\W/);

  if (right === -1) {
    return {
      word: text.slice(left),
      start: left,
      end: text.length,
    };
  }

  const word = text.slice(left, right + index);
  if (left === -1 || !word.trim()) {
    return null;
  }

  return {
    word,
    start: left,
    end: right + index,
  };
}

export function getInfo(text: string, cursorPosition: number, _errors: any[], word?: string): any {
  let currentWord: string | undefined = word;

  if (!currentWord) {
    const wordInfo = getWordAt(text, cursorPosition);
    if (!wordInfo) return null;
    currentWord = wordInfo.word;
  }

  if (!currentWord) return null;

  const objectClass = (languageModel.objects as any)[currentWord];
  if (objectClass) {
    return {
      name: currentWord,
      description: objectClass.description,
      params: new objectClass().getParams(),
    };
  }

  const modifierClass = (languageModel.modifiers as any)[currentWord];
  if (modifierClass) {
    const paramDescriptions = modifierClass.parameter_descriptions || {};
    const params = Object.keys(paramDescriptions).map(key => ({
      name: key,
      description: paramDescriptions[key],
      type: '' // Type info isn't stored here, but UI handles it
    }));

    return {
      name: currentWord,
      description: modifierClass.description,
      params: params,
    };
  }

  // Find parameter context
  const textBeforeCursor = text.slice(0, cursorPosition);
  const lastOpeningParen = textBeforeCursor.lastIndexOf('(');
  if (lastOpeningParen !== -1) {
    const functionCallMatch = text.slice(0, lastOpeningParen).match(/(\w+)$/);
    if (functionCallMatch) {
      const functionName = functionCallMatch[1];
      const functionClass = (languageModel.objects as any)[functionName];
      if (functionClass) {
        const variadicRegex = /([a-zA-Z_]+)([0-9]+)/;
        const variadicMatch = currentWord.match(variadicRegex);
        const variadicDef = functionClass.variadicParameters;
        let paramInfo: any = null;

        if (variadicDef && variadicMatch) {
            const paramName = variadicMatch[1];
            paramInfo = variadicDef.params.find((p: any) => p.name === paramName);
        } else {
            const params = new functionClass().getParams();
            paramInfo = params.find((p: any) => p.name === currentWord);
        }

        if (paramInfo) {
          return {
            name: currentWord, // Show the full name e.g., "x1"
            type: paramInfo.type,
            description: paramInfo.description,
          };
        }
      }
    }
  }

  return null;
}


// ... (keep existing getSuggestions function)

function findLastTopLevelComma(text: string): number {
    let parenDepth = 0;
    for (let i = text.length - 1; i >= 0; i--) {
        const char = text[i];
        if (char === ')') {
            parenDepth++;
        } else if (char === '(') {
            parenDepth--;
        } else if (char === ',' && parenDepth === 0) {
            return i;
        }
    }
    return -1;
}

export function getSuggestions(text: string, cursorPosition: number, _filter: boolean = true, _parsedObjects: any[] = []): string[] {
  const textToCursor = text.substring(0, cursorPosition);

  // --- 1. Check for parameter context ---
  const paramContextRegex = /(\w+)\s*\(([^)]*)$/i;
  const paramMatch = textToCursor.match(paramContextRegex);
  const lastOpenParen = textToCursor.lastIndexOf('(');
  const lastCloseParen = textToCursor.lastIndexOf(')');

  if (paramMatch && lastOpenParen > lastCloseParen) {
    const objectName = paramMatch[1];
    const objectModel = (languageModel.objects as any)[objectName];

    if (objectModel) {
      const standardParams = new objectModel().getParams().map((p: any) => p.name);
      const variadicDef = objectModel.variadicParameters;
      const paramsText = paramMatch[2];

      // --- Refined Parameter Logic ---

      // 1. Dissect the current parameter string to find what's complete vs. what's being typed.
      const lastDelimIndex = Math.max(paramsText.lastIndexOf(','), -1);
      const completedParamsText = paramsText.substring(0, lastDelimIndex + 1);
      const partialParamText = paramsText.substring(lastDelimIndex + 1);

      // 2. Check if the user is typing a parameter's value (after a ':'). If so, no suggestions.
      const parts = partialParamText.split(':');
      if (parts.length > 1 && parts[1].trim() !== '') {
          return [];
      }
      if (parts.length > 1 && partialParamText.trim().endsWith(':')) {
          return [];
      }

      // 3. Determine the partial word to filter by (it's the part before the colon).
      const partial = parts[0].trim();

      // 4. Get a list of parameters that have already been fully defined.
      const usedParamNames = new Set(completedParamsText.split(',').map(p => p.trim().split(':')[0]).filter(p => p));

      // 5. Start with a list of available (unused) standard parameters.
      let suggestions: string[] = standardParams.filter((p: string) => !usedParamNames.has(p));

      // 6. Add variadic parameter suggestions if applicable.
      if (variadicDef) {
        const variadicRegex = /([a-zA-Z_]+)([0-9]+)/;
        let maxIndex = 0;
        const allTypedParams = paramsText.split(',').map(p => p.trim().split(':')[0]);
        allTypedParams.forEach(p => {
          const match = p.match(variadicRegex);
          if (match) {
            const index = parseInt(match[2], 10);
            if (index > maxIndex) maxIndex = index;
          }
        });

        const currentGroupParams = allTypedParams.filter(p => p.endsWith(String(maxIndex)));
        const currentGroupParamNames = currentGroupParams.map(p => p.slice(0, -String(maxIndex).length));
        const isCurrentGroupComplete = variadicDef.params.every((p: any) => currentGroupParamNames.includes(p.name));

        if (maxIndex === 0) {
          suggestions.push(...variadicDef.params.map((p: any) => `${p.name}1`));
        } else if (isCurrentGroupComplete) {
          const nextIndex = maxIndex + 1;
          suggestions.push(...variadicDef.params.map((p: any) => `${p.name}${nextIndex}`));
        } else {
          const missingParams = variadicDef.params
            .filter((p: any) => !currentGroupParamNames.includes(p.name))
            .map((p: any) => `${p.name}${maxIndex}`);
          suggestions.push(...missingParams);
        }
      }

      // 7. Return the final list, filtered by the partial word if one exists.
      if (partial) {
        return suggestions.filter(s => s.toLowerCase().startsWith(partial.toLowerCase()));
      }
      
      // If no partial, return all available suggestions (for empty parens or after a comma).
      return suggestions;
    }
    return [];
  }

  // --- 2. Handle non-parameter contexts (keywords, object names) ---
  const statementBeforeCursor = textToCursor.substring(findLastTopLevelComma(textToCursor) + 1);

  const endOfObjectRegex = /^\s*\w+\s*\([^)]*\)$/i;
  if (endOfObjectRegex.test(statementBeforeCursor)) {
      return [];
  }

  const objectDefRegex = /^\s*\w+\s*\([^)]*\)/i;
  const objectDefMatch = statementBeforeCursor.match(objectDefRegex);

  if (objectDefMatch) {
      const restOfStatement = statementBeforeCursor.substring(objectDefMatch[0].length);

      // --- State-Aware Keyword Logic ---
      const isTyping = !restOfStatement.endsWith(' ');
      const parts = restOfStatement.trim().split(/\s+/).filter(p => p);
      const lastCompletePart = (isTyping ? parts[parts.length - 2] : parts[parts.length - 1]) || '';

      // State 1: After AS or TO, an identifier is expected. Suppress suggestions.
      if (lastCompletePart.toUpperCase() === 'AS' || lastCompletePart.toUpperCase() === 'TO') {
          return [];
      }

      // State 2: We are in a SET clause. Handle modifier suggestions.
      if (parts.some(p => p.toUpperCase() === 'SET')) {
        const setMatch = restOfStatement.toUpperCase().match(/\bSET\s*(\w*)$/);
        if (setMatch) {
            const modifierPartial = setMatch[1];
            // Only suggest if a partial is typed, or on manual trigger when empty.
            if (modifierPartial || !_filter) {
              return Object.keys(languageModel.modifiers).filter(m => m.toUpperCase().startsWith(modifierPartial.toUpperCase()));
            }
        }
        return []; // After a SET clause, no more keywords are suggested.
      }

      // State 3: A keyword is expected. Determine which ones are available.
      const hasAS = parts.some(p => p.toUpperCase() === 'AS');
      const hasChildTo = parts.some(p => p.toUpperCase() === 'CHILD'); // Check for CHILD, TO is implied

      let availableKeywords: string[] = [];
      if (hasChildTo) {
          availableKeywords.push('SET');
      } else if (hasAS) {
          availableKeywords.push('CHILD TO', 'SET');
      } else {
          availableKeywords.push('AS', 'CHILD TO', 'SET');
      }

      // Filter the available keywords by what the user is currently typing.
      const partial = isTyping ? parts[parts.length - 1] : '';
      if (partial) {
          return availableKeywords.filter(k => k.startsWith(partial.toUpperCase()));
      }

      // If not typing a partial, only show suggestions on manual trigger.
      return _filter ? [] : availableKeywords;
  }

  // --- 3. Handle default cases (cloning and new objects) ---
  const trimmedStatement = statementBeforeCursor.trim();
  const wordMatch = trimmedStatement.match(/([a-zA-Z_!][a-zA-Z0-9_]*)$/);
  const currentWord = wordMatch ? wordMatch[0] : '';

  if (currentWord.startsWith('!')) {
      const partialName = currentWord.substring(1).toLowerCase();
      const textWithoutBang = text.substring(0, text.lastIndexOf('!'));
      const { objects } = interpret(textWithoutBang, 'lint');
      const allNames = objects.map(o => o.objectName).filter(name => !name.includes('('));
      return [...allNames].filter(name => name.toLowerCase().startsWith(partialName));
  }

  if (currentWord) {
    return [...Object.keys(languageModel.objects), '!'].filter(s => s.toLowerCase().startsWith(currentWord.toLowerCase()));
  }

  if (trimmedStatement) {
    return [];
  }

  if (!_filter) {
    return [...Object.keys(languageModel.objects), '!'];
  }

  return [];
}