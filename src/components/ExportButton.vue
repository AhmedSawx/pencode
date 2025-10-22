<template>
  <button
    @click="handleExportCanvas"
    :class="`px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ${className}`"
    title="Export canvas as PNG image"
  >
    <Download class="w-3 h-3" />
    Export
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Download } from 'lucide-vue-next';

export default defineComponent({
  name: 'ExportButton',
  components: {
    Download,
  },
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      default: '',
    },
  },
  methods: {
    handleExportCanvas() {
      try {
        const canvas = document.getElementById('defaultCanvas0') as HTMLCanvasElement;

        if (!canvas) {
          console.warn('Canvas not found. Make sure to create the canvas first.');
          return;
        }

        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `pencode-project-${this.projectTitle.replace(
          /[^a-zA-Z0-9]/g,
          '-'
        )}-${this.projectId}.png`;
        link.href = dataURL;
        link.click();
      } catch (error) {
        console.error('Error exporting canvas:', error);
      }
    },
  },
});
</script>