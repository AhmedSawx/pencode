import { interpret } from './instructions/interpreter';

export function formatLexerErrorMessage(error: any): string {
    const message = error.message || "";
    const charMatch = message.match(/unexpected character: ->(.)<-/);

    if (charMatch && charMatch[1]) {
        const char = charMatch[1];
        if (char === ' ') {
            return "It looks like there's a stray space here. Please remove it.";
        }
        return `The character '${char}' is not valid here. Please check for typos or misplaced symbols.`;
    }
    
    return "There's an unrecognized symbol or character in your code that doesn't belong. Please review the line for errors.";
}

export function formatParserErrorMessage(error: any): string {
    const name = error.name || "";
    const msg = error.message || "";

    if (name === 'NoViableAltException') {
        return "This part of the code is incomplete. Please check for missing values or commas.";
    }
    if (name === 'MismatchedTokenException') {
        const match = msg.match(/Expecting token of type --> (\w+) <-- but found --> '([^']*)' <--/);
        if (match) {
            const expected = match[1];
            const found = match[2];
            return `Syntax error: Expected a ${expected} but found '${found}' instead.`;
        }
    }
    
    // Use the message directly from the semantic error
    if (error.token) {
        return msg;
    }

    const cleanedMessage = msg.split('-->')[0].trim();
    if (cleanedMessage) {
        return cleanedMessage;
    }

    return "There is a syntax error here. Please check the structure of your code.";
}

// --- LINT FUNCTION ---
export function lint(text: string) {
  // Delegate to the unified interpreter in 'lint' mode
  const { lexErrors, parseErrors, semanticErrors, objects } = interpret(text, 'lint');

  return { 
    lexErrors,
    parseErrors,
    semanticErrors,
    objects
  };
}
