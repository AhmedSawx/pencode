<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
            <AlertTriangle class="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          </div>
          <div>
            <DialogTitle>
              {{ title }}
            </DialogTitle>
            <DialogDescription class="mt-1">
              {{ description }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" @click="handleCancel" :disabled="isSaving || isDiscarding">
          {{ cancelText }}
        </Button>
        <Button variant="destructive" @click="handleDiscard" :disabled="isSaving || isDiscarding">
          {{ isDiscarding ? discardInProgressText : discardText }}
        </Button>
        <Button v-if="variant === 'unsaved' && !isEmptyDraft" @click="handleSave" :disabled="isSaving || isDiscarding">
          {{ isSaving ? 'Saving...' : 'Save & Continue' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-vue-next';

export default {
  name: 'UnsavedChangesDialog',
  components: {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    AlertTriangle,
  },
  props: {
    open: Boolean,
    variant: {
      type: String,
      default: 'unsaved', // 'unsaved' or 'error'
    },
    itemName: {
      type: String,
      default: 'item',
    },
    projectTitle: {
      type: String,
      default: 'this project',
    },
    isDraftProject: Boolean,
    isEmpty: Boolean,
  },
  emits: ['update:open', 'save', 'discard', 'cancel'],
  data() {
    return {
      isSaving: false,
      isDiscarding: false,
    };
  },
  computed: {
    isEmptyDraft() {
      return this.variant === 'unsaved' && this.isDraftProject && this.isEmpty;
    },
    title() {
      if (this.variant === 'error') {
        return 'Code Errors Detected';
      }
      return this.isEmptyDraft ? 'Delete Empty Draft' : 'Unsaved Changes';
    },
    description() {
      if (this.variant === 'error') {
        return `You have syntax errors in the ${this.itemName}. Please fix them, or discard the changes to continue.`;
      }
      return this.isEmptyDraft
        ? `The draft project "${this.projectTitle}" is empty and will be deleted. Are you sure you want to continue?`
        : `You have unsaved changes in ${this.projectTitle}. What would you like to do?`;
    },
    cancelText() {
        if (this.variant === 'error') {
            return 'Stay and Fix';
        }
        return 'Cancel';
    },
    discardText() {
        if (this.variant === 'error') {
            return 'Discard Changes';
        }
        return this.isEmptyDraft ? 'Delete Draft' : 'Discard Changes';
    },
    discardInProgressText() {
        if (this.variant === 'error') {
            return 'Discarding...';
        }
        return this.isEmptyDraft ? 'Deleting...' : 'Discarding...';
    }
  },
  watch: {
    open(newValue) {
      if (newValue) {
        this.isSaving = false;
        this.isDiscarding = false;
      }
    },
  },
  methods: {
    onOpenChange(value: boolean) {
      this.$emit('update:open', value);
    },
    async handleSave() {
      if (this.isSaving) return;
      if (this.isEmptyDraft) {
        this.handleDiscard();
        return;
      }
      this.isSaving = true;
      this.$emit('save');
    },
    handleDiscard() {
      if (this.isDiscarding) return;
      this.isDiscarding = true;
      this.$emit('discard');
    },
    handleCancel() {
      this.$emit('cancel');
    },
  },
};
</script>