<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader class="items-center text-center">
        <div class="p-2 rounded-full inline-block">
          <img src="/Pencode-logo-light.svg" alt="Pencode Logo" class="w-12 h-12 block dark:hidden" />
          <img src="/Pencode-logo-dark.svg" alt="Pencode Logo" class="w-12 h-12 hidden dark:block" />
        </div>
        <DialogTitle class="text-2xl font-bold">Pencode</DialogTitle>
        <DialogDescription> Version Alpha 1 </DialogDescription>
      </DialogHeader>
      <div class="py-4 text-center">
        <p class="text-muted-foreground">
          A creative coding environment for generating art with a simple,
          declarative language.
        </p>
      </div>
      <DialogFooter class="flex-col gap-2">
        <Button as-child>
          <a
            href="https://github.com/ahmedSawx/PenCode"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github class="h-4 w-4 mr-2" />
            View on GitHub
          </a>
        </Button>
        <Button variant="outline" @click="onOpenChange(false)"> Close </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Github } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default defineComponent({
  name: "AboutDialog",
  components: {
    Github,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  },
  props: {
    open: Boolean,
  },
  emits: ["update:open"],
  methods: {
    onOpenChange(value: boolean) {
      this.$emit("update:open", value);
    },
  },
});
</script>
