<template>
  <Button
    @click="handleSave"
    :class="showSuccess ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''"
    :variant="showSuccess ? 'default' : 'secondary'"
    title="Save project"
  >
    <Check v-if="showSuccess" class="w-4 h-4" />
    <Save v-else class="w-4 h-4" />
    {{ showSuccess ? 'Saved!' : 'Save' }}
  </Button>
</template>

<script>
import { Save, Check } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

export default {
  name: 'SaveButton',
  components: {
    Save,
    Check,
    Button,
  },
  props: {
    // projectId and textareaValue are no longer needed here
  },
  data() {
    return {
      showSuccess: false,
    };
  },
  methods: {
    handleSave() {
      this.$emit('save');
    },
    // Public method to be called from parent to show success state
    showSuccessState() {
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 2000);
    }
  },
};
</script>