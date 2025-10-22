<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        :class="`text-xs flex items-center gap-1.5 ${errorCount > 0 ? 'text-destructive' : 'text-green-600'}`"
        :disabled="errorCount === 0"
      >
        <TriangleAlert v-if="errorCount > 0" class="h-3.5 w-3.5" />
        <CircleCheck v-else class="h-3.5 w-3.5" />
        <span>{{ errorCount }} {{ errorCount === 1 ? 'Error' : 'Errors' }}</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent v-if="errorCount > 0" class="w-96" @close-auto-focus.prevent>
      <DropdownMenuLabel>Problems</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div class="max-h-80 overflow-y-auto">
        <DropdownMenuItem
          v-for="(error, index) in formattedErrors"
          :key="index"
          @click="goToError(error)"
          class="flex items-start gap-2 cursor-pointer"
        >
          <TriangleAlert class="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div class="flex-1">
            <p class="text-sm leading-tight">{{ error.message }}</p>
            <p class="text-xs text-muted-foreground">Line {{ error.startLine }}, Column {{ error.startColumn }}</p>
          </div>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TriangleAlert, CircleCheck } from 'lucide-vue-next';
import { formatLexerErrorMessage, formatParserErrorMessage } from '@/services/linter';
import type { ILexingError, IRecognitionException } from 'chevrotain';

export interface FormattedError {
  message: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export default defineComponent({
  name: 'ErrorList',
  components: {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    TriangleAlert,
    CircleCheck,
  },
  props: {
    errors: {
      type: Array as PropType<(ILexingError | IRecognitionException)[]>,
      default: () => [],
    },
  },
  computed: {
    errorCount() {
      return this.errors.length;
    },
    formattedErrors(): FormattedError[] {
      return this.errors.map((e: any) => {
        let token = e.token;
        let message = e.message;

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

        if (e.name) { // Parser Error
            message = formatParserErrorMessage(e);
        } else if (e.length) { // Lexer Error
            message = formatLexerErrorMessage(e);
        }

        if (token) { // Parser or Semantic Error
          return {
            message,
            startLine: token.startLine,
            endLine: token.endLine,
            startColumn: token.startColumn,
            endColumn: token.endColumn,
          };
        } else if (e.line) { // Lexer Error
          return {
            message,
            startLine: e.line,
            endLine: e.line,
            startColumn: e.column,
            endColumn: e.column + e.length - 1,
          };
        }
        return null;
      }).filter((e): e is FormattedError => e !== null && e.startLine !== undefined && e.startColumn !== undefined)
        .sort((a, b) => {
          if (a.startLine !== b.startLine) {
            return a.startLine - b.startLine;
          }
          return a.startColumn - b.startColumn;
        });
    }
  },
  methods: {
    goToError(error: FormattedError) {
      this.$emit('go-to-error', error);
    },
  },
});
</script>