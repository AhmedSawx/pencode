<template>
  <div class="absolute top-0 left-0 pointer-events-none w-full h-full z-10">
    <TooltipProvider>
      <template v-for="(error) in formattedErrors">
        <Tooltip :delay-duration="100">
          <TooltipTrigger as-child>
            <div
              class="absolute squiggle"
              :style="{ ...calculateErrorStyle(error), cursor: 'text' }"
              style="z-index: 20;"
            ></div>
          </TooltipTrigger>
          <TooltipContent class="max-w-xs text-center">
            <p>{{ error.message }}</p>
          </TooltipContent>
        </Tooltip>
      </template>
      <template v-for="(word) in words">
        <div
          class="absolute pointer-events-none"
          :style="{ ...calculateWordStyle(word), cursor: 'text' }"
        ></div>
      </template>
    </TooltipProvider>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatLexerErrorMessage, formatParserErrorMessage } from '@/services/linter';
import type { ILexingError, IRecognitionException } from 'chevrotain';

export interface Word {
  word: string;
  line: number;
  startColumn: number;
  endColumn: number;
  startIndex: number;
  endIndex: number;
}

export interface FormattedError {
  message: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export default defineComponent({
  name: 'EditorOverlay',
  components: { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger },
  props: {
    errors: {
      type: Array as PropType<(ILexingError | IRecognitionException)[]|any[]|never[]|null[]>,
      default: () => [],
    },
    text: {
      type: String,
      default: '',
    },
    isSelecting: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    words(): Word[] {
      const words: Word[] = [];
      const lines = this.text.split('\n');
      const keywords = ['CHILD TO', 'AS', 'SET'];
      const keywordRegex = new RegExp(`(${keywords.join('|')})`, 'g');
      const wordRegex = /\b\w+\b/g;

      for (let i = 0; i < lines.length; i++) {
        let match: RegExpExecArray | null;
        const lineOffset = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);

        // Match keywords first
        while ((match = keywordRegex.exec(lines[i])) !== null) {
          words.push({
            word: match[0],
            line: i + 1,
            startColumn: match.index + 1,
            endColumn: match.index + match[0].length,
            startIndex: lineOffset + match.index,
            endIndex: lineOffset + match.index + match[0].length,
          });
        }

        // Match regular words
        while ((match = wordRegex.exec(lines[i])) !== null) {
          // Avoid adding duplicates
          if (!words.some(w => w.startIndex === lineOffset + match!.index)) {
            words.push({
              word: match[0],
              line: i + 1,
              startColumn: match.index + 1,
              endColumn: match.index + match[0].length,
              startIndex: lineOffset + match.index,
              endIndex: lineOffset + match.index + match[0].length,
            });
          }
        }
      }
      return words;
    },
    formattedErrors(): FormattedError[] {
      return this.errors.map((e: any) => {
        let token = e.token;

        if (e.name === "MismatchedTokenException" && token && token.tokenType && token.tokenType.name === "EOF") {
            const prevToken = e.previousToken;
            if (prevToken) {
                return {
                    message: formatParserErrorMessage(e),
                    startLine: prevToken.startLine,
                    endLine: prevToken.endLine,
                    startColumn: prevToken.endColumn + 1,
                    endColumn: prevToken.endColumn + 1,
                };
            }
        }

        if (token) { // Parser or Semantic Error
          return {
            message: formatParserErrorMessage(e),
            startLine: token.startLine,
            endLine: token.endLine,
            startColumn: token.startColumn,
            endColumn: token.endColumn,
          };
        } else if (e.line) { // Lexer Error
          return {
            message: formatLexerErrorMessage(e),
            startLine: e.line,
            endLine: e.line,
            startColumn: e.column,
            endColumn: e.column + e.length - 1,
          };
        }
        return null;
      }).filter((e): e is FormattedError => e !== null && e.startLine !== undefined && e.startColumn !== undefined);
    },
  },
  methods: {
    calculateErrorStyle(error: FormattedError) {
      const lineHeight = 24;
      const charWidth = 8.4;
      const editorPaddingLeft = 16;
      const editorPaddingTop = 12;
      const hoverHeight = 12;

      const top = editorPaddingTop + (error.startLine - 1) * lineHeight + (lineHeight - hoverHeight);
      const left = editorPaddingLeft + (error.startColumn - 1) * charWidth;
      const errorTokenLength = error.endColumn - error.startColumn + 1;
      const width = (errorTokenLength > 0 ? errorTokenLength : 1) * charWidth;

      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${hoverHeight}px`,
      };
    },
    calculateWordStyle(word: Word) {
      const lineHeight = 24;
      const charWidth = 8.4;
      const editorPaddingLeft = 16;
      const editorPaddingTop = 12;

      const top = editorPaddingTop + (word.line - 1) * lineHeight;
      const left = editorPaddingLeft + (word.startColumn - 1) * charWidth;
      const wordLength = word.endColumn - word.startColumn + 1;
      const width = (wordLength > 0 ? wordLength : 1) * charWidth;

      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${lineHeight}px`,
      };
    },
  },
});
</script>

<style scoped>
.squiggle {
  background-image: url('data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" enable-background="new 0 0 6 3" width="6" height="3"%3e%3cpath d="m0 2.5c1 0 1-1.5 2-1.5s1 1.5 2 1.5 1-1.5 2-1.5" fill="none" stroke="%23F44336" stroke-width="0.5"/%3e%3c/svg%3e');
  background-repeat: repeat-x;
  background-position: bottom;
  pointer-events: auto;
}
</style>