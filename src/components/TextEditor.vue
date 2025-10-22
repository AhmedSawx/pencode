<template>
  <div class="h-full flex flex-col bg-card rounded-l-lg border border-r-0 border-border shadow-xl overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 bg-muted border-b border-border h-14">
      <div class="flex items-center gap-2">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-destructive"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span class="text-sm text-muted-foreground ml-3">script.pen</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">Pencode Language</span>
      </div>
    </div>

    <div class="flex-1 flex relative min-h-0">
      <div class="w-12 bg-muted/50 border-r border-border py-3 text-right text-xs text-muted-foreground font-mono select-none shrink-0">
        <div v-for="i in editorStats.lines" :key="i" :id="`line-${i}`" class="px-2 leading-6 hover:bg-accent">
          {{ i }}
        </div>
      </div>
      <div class="flex-1 relative overflow-x-auto">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          @input="handleTextareaInput"
          @keydown="handleTextareaKeydown"
          @blur="handleTextareaBlur"
          @scroll="handleScroll"
          @mousemove="handleTextareaMouseMove"
          @mouseleave="handleTextareaMouseLeave"
          class="w-full h-full p-3 pl-4 font-mono text-sm bg-background text-foreground outline-none border-none leading-6 placeholder-muted-foreground absolute top-0 left-0"
          placeholder="// Welcome to Pencode Studio..."
          spellcheck="false"
          style="tab-size: 2; font-size: 14px; line-height: 24px; white-space: pre; min-width: 100%;"
        ></textarea>
        <EditorOverlay
          ref="editorOverlay"
          :errors="errors"
          :text="modelValue"
          :style="{ left: `-${overlayScrollLeft}px` }"
        />
        <SuggestionsBox
          ref="suggestionsBoxRef"
          :suggestions="suggestions"
          :x="suggestionBoxPosition.x"
          :y="suggestionBoxPosition.y"
          @suggestion-selected="handleSuggestionSelected"
          v-show="showSuggestions"
        />
        <InfoBox
          :info="infoBoxContent"
          :x="infoBoxPosition.x"
          :y="infoBoxPosition.y"
          v-if="showInfoBox"
          @mouseenter="handleInfoBoxEnter"
          @mouseleave="handleInfoBoxLeave"
          @close="showInfoBox = false"
        />
      </div>
    </div>

    <div class="flex items-center justify-between px-4 py-3 bg-muted border-t border-border h-12">
        <div class="flex items-center gap-4">
            <ErrorList :errors="errors" @go-to-error="handleGoToError" />
        </div>
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Lines: {{ editorStats.lines }}</span>
            <span>Chars: {{ editorStats.characters }}</span>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getSuggestions, getInfo, languageModel } from '@/services/autocomplete';
import { lint } from '@/services/linter';
import EditorOverlay, { type Word, type FormattedError } from '@/components/EditorOverlay.vue';
import ErrorList from '@/components/ErrorList.vue';
import SuggestionsBox from '@/components/SuggestionsBox.vue';
import InfoBox from '@/components/InfoBox.vue';
import type { ILexingError, IRecognitionException } from 'chevrotain';

export interface EditorStats {
  lines: number;
  characters: number;
}

export default defineComponent({
  name: 'TextEditor',
  components: {
    SuggestionsBox,
    InfoBox,
    EditorOverlay,
    ErrorList,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'update:errors'],
  data() {
    return {
      suggestions: [] as string[],
      showSuggestions: false,
      suggestionBoxPosition: { x: 0, y: 0 },
      infoBoxContent: null as any,
      infoBoxPosition: { x: 0, y: 0 },
      showInfoBox: false,
      editorStats: { lines: 1, characters: 0 } as EditorStats,
      errors: [] as (ILexingError | IRecognitionException)[],
      lintTimeout: null as any,
      infoBoxHideTimeout: null as any,
      hoverTimeout: null as any,
      overlayScrollLeft: 0,
      suggestionBoxRawPosition: { x: 0, y: 0 },
      infoBoxRawPosition: { x: 0, y: 0 },
      editorWidth: 0,
      resizeObserver: null as ResizeObserver | null,
    };
  },

  watch: {
    modelValue(newValue: string) {
      this.updateEditorStats();
      this.debounceLint(newValue);
    },
    showInfoBox(newValue: boolean) {
      if (newValue) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleClickOutsideInfoBox, true);
        });
      } else {
        document.removeEventListener('click', this.handleClickOutsideInfoBox, true);
      }
    },
  },
  mounted() {
    this.updateEditorStats();
    this.debounceLint(this.modelValue);
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        this.editorWidth = entries[0].contentRect.width;
      }
    });
    this.resizeObserver.observe(this.$el.querySelector('.flex-1.relative.overflow-x-auto'));
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    document.removeEventListener('click', this.handleClickOutsideInfoBox, true);
  },
  methods: {
    handleClickOutsideInfoBox(event: MouseEvent) {
      const path = event.composedPath();
      const infoBoxComponent = this.$refs.infoBoxRef as any;
      if (infoBoxComponent && infoBoxComponent.$el && !path.includes(infoBoxComponent.$el)) {
        this.showInfoBox = false;
      }
    },
    handleGoToError(error: any) {
      setTimeout(() => {
        const textarea = this.$refs.textareaRef as HTMLTextAreaElement;
        const lines = this.modelValue.split('\n');
        const startPosition = lines.slice(0, error.startLine - 1).reduce((acc, cur) => acc + cur.length + 1, 0) + (error.startColumn - 1);
        const errorLength = (error.endColumn - error.startColumn) + 1;
        const endPosition = startPosition + errorLength;
        textarea.focus();
        textarea.selectionStart = endPosition;
        textarea.selectionEnd = endPosition;
        const lineElement = document.getElementById(`line-${error.startLine}`);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    },
    debounceLint(text: string) {
      if (this.lintTimeout) {
        clearTimeout(this.lintTimeout);
      }
      this.lintTimeout = setTimeout(() => {
        if (text && text.trim()) {
            const { lexErrors, parseErrors, semanticErrors } = lint(text);
            this.errors = [...lexErrors, ...parseErrors, ...semanticErrors];
            this.$emit('update:errors', this.errors);
        } else {
            this.errors = [];
            this.$emit('update:errors', []);
        }
      }, 300);
    },
    updateEditorStats() {
      const value = this.modelValue || '';
      const lines = value.split('\n').length;
      const characters = value.length;
      this.editorStats = { lines, characters };
    },
    handleTextareaInput(event: Event) {
        this.showInfoBox = false;
        const target = event.target as HTMLTextAreaElement;
        const newText = target.value;
        const cursorPosition = target.selectionStart;
        this.$emit('update:modelValue', newText);

        const textToCursor = newText.substring(0, cursorPosition);
        const lastChar = textToCursor.slice(-1);
        const charBeforeLast = textToCursor.length > 1 ? textToCursor.slice(-2, -1) : '';

        if (lastChar === ' ') {
            if (charBeforeLast !== ',') {
                this.showSuggestions = false;
            }
            return;
        }

        if (lastChar === '(' || lastChar === ',') {
            let openParenCount = 0;
            let closeParenCount = 0;
            for (const char of textToCursor) {
                if (char === '(') openParenCount++;
                if (char === ')') closeParenCount++;
            }

            if (openParenCount > closeParenCount) {
                this.updateSuggestions(false, newText, cursorPosition);
            } else {
                this.showSuggestions = false;
            }
            return;
        }

        if (lastChar.trim() !== '') {
            this.updateSuggestions(true, newText, cursorPosition);
        } else {
            this.showSuggestions = false;
        }
    },
    updateSuggestions(this: any, filter = true, text = this.modelValue, cursor = (this.$refs.textareaRef as HTMLTextAreaElement).selectionStart, objects: any[] = []) {
        this.suggestions = getSuggestions(text, cursor, filter, objects);
        this.showSuggestions = this.suggestions.length > 0;

        if (this.showSuggestions) {
            const textToCursor = text.substring(0, cursor);
            const lines = textToCursor.split('\n');
            const currentLine = lines[lines.length - 1];
            const lineHeight = 24;
            const charWidth = 8.4;
            const editorPaddingLeft = 16;
            const editorPaddingTop = 12;

            const rawX = editorPaddingLeft + (currentLine.length * charWidth);
            const rawY = editorPaddingTop + (lines.length * lineHeight);
            this.suggestionBoxRawPosition = { x: rawX, y: rawY };

            const suggestionsBoxWidth = 256;
            let finalX = rawX - this.overlayScrollLeft;

            if (finalX + suggestionsBoxWidth > this.editorWidth) {
              finalX = this.editorWidth - suggestionsBoxWidth - 16;
            }
            if (finalX < 16) {
              finalX = 16;
            }

            this.suggestionBoxPosition = {
                x: finalX,
                y: rawY
            };
        }
    },
    handleTextareaKeydown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === ' ') {
            event.preventDefault();
            this.updateSuggestions(false);
            return;
        }

        if (this.showSuggestions && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter')) {
            (this.$refs.suggestionsBoxRef as any).handleKeydown(event);
            event.preventDefault();
            return;
        }
        if (event.key === 'Escape') {
            this.showSuggestions = false;
            this.showInfoBox = false;
            return;
        }

        const keysThatHideSuggestions = ['Home', 'End', 'PageUp', 'PageDown'];
        if (keysThatHideSuggestions.includes(event.key)) {
            this.showSuggestions = false;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            this.showInfoBox = false;
        }

        if (event.key === 'ArrowLeft') {
            this.showSuggestions = false;
        }

        if (event.key === 'ArrowRight') {
            const textarea = this.$refs.textareaRef as HTMLTextAreaElement;
            const cursorPosition = textarea.selectionStart;
            const text = this.modelValue;
            const nextChar = text.substring(cursorPosition, cursorPosition + 1);

            if (nextChar === ',' || nextChar === ')') {
                setTimeout(() => {
                    this.updateSuggestions(false);
                }, 0);
            } else {
                this.showSuggestions = false;
            }
        }
    },
    handleTextareaBlur() {
        setTimeout(() => {
            this.showSuggestions = false;
            this.showInfoBox = false;
        }, 200);
    },
    handleSuggestionSelected(suggestion: string) {
        const textarea = this.$refs.textareaRef as HTMLTextAreaElement;
        const currentText = this.modelValue;
        const cursorPos = textarea.selectionStart;

        const textBeforeCursorForWord = currentText.substring(0, cursorPos);
        const lastWordMatch = textBeforeCursorForWord.match(/([\w!]*)$/);
        const lastWord = lastWordMatch ? lastWordMatch[1] : '';
        const isObject = languageModel.objects.hasOwnProperty(suggestion);
        const isModifier = languageModel.modifiers.hasOwnProperty(suggestion);

        if (lastWord.startsWith('!')) {
            const textToInsert = '!' + suggestion + '()';
            const textBefore = currentText.substring(0, cursorPos - lastWord.length);
            const textAfter = currentText.substring(cursorPos);
            const newTextValue = textBefore + textToInsert + textAfter;
            this.$emit('update:modelValue', newTextValue);

            this.$nextTick(() => {
                const newCursorPos = (textBefore + textToInsert).length - 1;
                textarea.focus();
                textarea.selectionStart = newCursorPos;
                textarea.selectionEnd = newCursorPos;
                this.updateSuggestions(false, newTextValue, newCursorPos);
            });
        } else if (isObject || isModifier) {
            const textToInsert = suggestion + '()';
            const textBefore = currentText.substring(0, cursorPos - lastWord.length);
            const textAfter = currentText.substring(cursorPos);
            const newTextValue = textBefore + textToInsert + textAfter;
            this.$emit('update:modelValue', newTextValue);

            this.$nextTick(() => {
                const newCursorPos = (textBefore + textToInsert).length - 1;
                textarea.focus();
                textarea.selectionStart = newCursorPos;
                textarea.selectionEnd = newCursorPos;
                this.updateSuggestions(false, newTextValue, newCursorPos);
            });
        } else {
            const textBeforeCursor = currentText.substring(0, cursorPos);
            const paramContextMatch = textBeforeCursor.match(/(\w+)\s*\(([^)]*)$/);

            if (paramContextMatch) {
                const objectName = paramContextMatch[1];
                const objectClass = (languageModel.objects as any)[objectName];
                if (objectClass) {
                    const variadicRegex = /([a-zA-Z_]+)([0-9]+)/;
                    const variadicMatch = suggestion.match(variadicRegex);
                    const variadicDef = objectClass.variadicParameters;
                    let paramInfo: any = null;

                    if (variadicDef && variadicMatch) {
                        const paramName = variadicMatch[1];
                        paramInfo = variadicDef.params.find((p: any) => p.name === paramName);
                    } else {
                        const params = new objectClass().getParams();
                        paramInfo = params.find((p: any) => p.name === suggestion);
                    }

                    if (paramInfo) {
                        let textToInsert = suggestion;
                        switch (paramInfo.type) {
                            case 'Number':
                            case 'number': textToInsert += ': 0'; break;
                            case 'string': textToInsert += ': ""'; break;
                            case 'any': textToInsert += ": ''"; break;
                            default: textToInsert += ': ';
                        }
                        
                        const textBefore = currentText.substring(0, cursorPos - lastWord.length);
                        const textAfter = currentText.substring(cursorPos);
                        const newText = textBefore + textToInsert + textAfter;
                        
                        this.$emit('update:modelValue', newText);
                        this.showSuggestions = false;

                        this.$nextTick(() => {
                            let newCursorPos = (textBefore + textToInsert).length;
                            if (paramInfo.type === 'string' || paramInfo.type === 'any') {
                                newCursorPos--;
                            }
                            textarea.focus();
                            textarea.selectionStart = newCursorPos;
                            textarea.selectionEnd = newCursorPos;
                        });
                        return; 
                    }
                }
            }
            
            const textBefore = currentText.substring(0, cursorPos - lastWord.length);
            const textAfter = currentText.substring(cursorPos);
            const newText = textBefore + suggestion + textAfter;
            this.$emit('update:modelValue', newText);
            this.showSuggestions = false;
        }
    },
    handleTextareaMouseMove(event: MouseEvent) {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      this.hoverTimeout = setTimeout(() => {
        const textarea = this.$refs.textareaRef as HTMLTextAreaElement;
        const rect = textarea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const scrollX = textarea.scrollLeft;
        const scrollY = textarea.scrollTop;

        const absoluteX = x + scrollX;
        const absoluteY = y + scrollY;

        const editorOverlay = this.$refs.editorOverlay as any;
        if (!editorOverlay) {
          this.handleWordLeft();
          return;
        }

        const words: Word[] = editorOverlay.words;
        const lineHeight = 24;
        const charWidth = 8.4;
        const editorPaddingLeft = 16 + 4;
        const editorPaddingTop = 12;

        const foundWord = words.find((word: Word) => {
            const wordTop = editorPaddingTop + (word.line - 1) * lineHeight;
            const wordBottom = wordTop + lineHeight;
            const wordLeft = editorPaddingLeft + (word.startColumn - 1) * charWidth;
            const wordRight = editorPaddingLeft + word.endColumn * charWidth;

            return absoluteY >= wordTop && absoluteY <= wordBottom &&
                   absoluteX >= wordLeft && absoluteX <= wordRight;
        });

        if (foundWord) {
          clearTimeout(this.infoBoxHideTimeout);
          const formattedErrors: FormattedError[] = editorOverlay.formattedErrors;
          const errorAtWord = formattedErrors.find((e: FormattedError) => {
            const lines = this.modelValue.split('\n');
            const errorStartOffset = lines.slice(0, e.startLine - 1).reduce((acc, cur) => acc + cur.length + 1, 0) + (e.startColumn - 1);
            const errorEndOffset = lines.slice(0, e.endLine - 1).reduce((acc, cur) => acc + cur.length + 1, 0) + (e.endColumn - 1);
            return Math.max(foundWord.startIndex, errorStartOffset) <= Math.min(foundWord.endIndex - 1, errorEndOffset);
          });

          if (errorAtWord) {
            this.showInfoBox = false;
            return;
          }

          this.infoBoxContent = getInfo(this.modelValue, foundWord.startIndex, formattedErrors, foundWord.word);
          this.showInfoBox = this.infoBoxContent !== null;

          if (this.showInfoBox) {
            const style = editorOverlay.calculateWordStyle(foundWord);
            const rawX = parseInt(style.left);
            const rawY = parseInt(style.top) + parseInt(style.height);
            this.infoBoxRawPosition = { x: rawX, y: rawY };

            const infoBoxWidth = 320;
            let finalX = rawX - this.overlayScrollLeft;

            if (finalX + infoBoxWidth > this.editorWidth) {
              finalX = this.editorWidth - infoBoxWidth - 16;
            }
            if (finalX < 16) {
              finalX = 16;
            }

            this.infoBoxPosition = { x: finalX, y: rawY };
          }
        } else {
          this.handleWordLeft();
        }
      }, 150);
    },
    handleTextareaMouseLeave() {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      this.handleWordLeft();
    },
    handleWordLeft() {
      this.infoBoxHideTimeout = setTimeout(() => {
        this.showInfoBox = false;
      }, 200);
    },
    handleInfoBoxEnter() {
      clearTimeout(this.infoBoxHideTimeout);
    },
    handleInfoBoxLeave() {
      this.infoBoxHideTimeout = setTimeout(() => {
        this.showInfoBox = false;
      }, 200);
    },
    handleScroll(event: Event) {
      this.showInfoBox = false;
      this.showSuggestions = false;

      const target = event.target as HTMLTextAreaElement;
      this.overlayScrollLeft = target.scrollLeft;
      this.suggestionBoxPosition.x = this.suggestionBoxRawPosition.x - this.overlayScrollLeft;
      this.infoBoxPosition.x = this.infoBoxRawPosition.x - this.overlayScrollLeft;
    },
  }
});
</script>