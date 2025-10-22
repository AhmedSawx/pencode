<template>
  <button
    @click="triggerCreate"
    type="button"
    class="px-6 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors duration-200 font-medium shadow-lg hover:shadow-xl border border-primary/20 flex items-center gap-2"
    id="createButton"
  >
    <svg
      class="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    Create
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { redrawCanvas } from '@/services/canvasManager';

export default defineComponent({
  name: 'CreateButton',
  props: {
    textareaValue: {
      type: String,
      required: true,
    },
    canvasSize: {
      type: Object as PropType<{ width: number; height: number }>,
      required: true,
    },
  },
  methods: {
    triggerCreate() {
      const success = redrawCanvas(this.textareaValue, this.canvasSize);
      if (success) {
        this.$emit('canvas-created');
      }
    },
  },
});
</script>