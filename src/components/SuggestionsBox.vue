<template>
  <div v-if="suggestions.length > 0" class="absolute z-20" :style="{ top: `${y}px`, left: `${x}px` }" data-testid="suggestions-box">
    <Card class="w-64">
      <CardContent class="p-1">
        <ul>
          <li
            v-for="(suggestion, index) in suggestions"
            :key="index"
            :class="[
              'px-3 py-1.5 text-sm rounded-sm cursor-pointer',
              { 'bg-accent text-accent-foreground': index === activeIndex }
            ]"
            @click="selectSuggestion(suggestion)"
            @mouseover="activeIndex = index"
          >
            {{ suggestion }}
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Card, CardContent } from '@/components/ui/card';

export default defineComponent({
  components: {
    Card,
    CardContent,
  },
  props: {
    suggestions: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      activeIndex: 0,
    };
  },
  watch: {
    suggestions() {
      this.activeIndex = 0;
    },
  },
  methods: {
    selectSuggestion(suggestion: string) {
      this.$emit('suggestion-selected', suggestion);
    },
    handleKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.selectSuggestion(this.suggestions[this.activeIndex]);
      }
    },
  },
});
</script>
