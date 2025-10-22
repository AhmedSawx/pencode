<template>
  <Dialog :open="open" @update:open="setOpen">
    <DialogTrigger as-child>
      <Button>
        <Plus class="h-4 w-4 mr-2" />
        Create New Brush
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>Create New Brush</DialogTitle>
        <DialogDescription>
          Give your new brush a unique name.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="brush-name">Brush Name</Label>
          <Input
            id="brush-name"
            v-model="brushName"
            placeholder="e.g., 'charcoal-pencil'"
            @keydown.enter="handleCreate"
            :class="{ 'border-destructive': isNameTaken }"
          />
          <p v-if="isNameTaken" class="text-sm text-destructive">This brush name already exists.</p>
        </div>
        <div class="grid gap-2">
          <Label for="brush-type">Brush Type</Label>
          <Select v-model="brushType">
            <SelectTrigger id="brush-type">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="setOpen(false)">
          Cancel
        </Button>
        <Button @click="handleCreate" :disabled="!brushName.trim() || isNameTaken">
          Create Brush
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Project, Brush } from '@/mocks/types';
import { updateProject } from '@/mocks/projects';
import { toast } from 'vue-sonner';
import { state } from '@/services/state';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default defineComponent({
  name: 'CreateBrushDialog',
  components: {
    Plus,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  },
  props: {
    project: {
      type: Object as () => Project,
      required: true,
    },
  },
  data() {
    return {
      open: false,
      brushName: '',
      brushType: 'custom' as Brush['type'],
    };
  },
  computed: {
    isNameTaken() {
      if (!this.brushName.trim()) return false;
      const existingBrush = this.project.brushes?.find(b => b.name === this.brushName.trim());
      return !!existingBrush && existingBrush.status !== 'discarded';
    }
  },
  methods: {
    setOpen(value: boolean) {
      this.open = value;
    },
    handleCreate() {
      const trimmedName = this.brushName.trim();
      if (!trimmedName) return;

      if (this.isNameTaken) {
        toast.error('Brush name already exists', {
          description: `A brush with the name "${trimmedName}" already exists in this project.`,
        });
        return;
      }

      const existingBrushIndex = this.project.brushes?.findIndex(b => b.name === trimmedName) ?? -1;

      if (existingBrushIndex !== -1) {
        const existingBrush = this.project.brushes![existingBrushIndex];
        if (existingBrush.status === 'discarded') {
          // Revive the brush
          const revivedBrush: Brush = {
            ...existingBrush,
            type: this.brushType,
            weight: 5,
            vibration: 0.1,
            definition: this.brushType === 'standard' ? 0.5 : null,
            quality: this.brushType === 'standard' ? 5 : null,
            opacity: this.brushType === 'standard' ? 150 : 25,
            spacing: 0.5,
            pressure: {
              type: 'standard',
              min_max: [1.3, 1],
              curve: [0.3, 0.2],
            },
            tip: this.brushType === 'custom'
                ? `// ${trimmedName}\n// The _m parameter is the brush tip's p5.Graphics buffer.\n// Draw your brush tip shape on it.\n_m.ellipse(0, 0, _m.width, _m.height);`
                : null,
            rotate: 'natural',
            blend: true,
          };
          delete revivedBrush.status;

          const updatedBrushes = [...this.project.brushes!];
          updatedBrushes[existingBrushIndex] = revivedBrush;
          
          updateProject(this.project.id, { brushes: updatedBrushes });

          // Remove from discarded list
          const discardedIndex = state.discardedBrushes.indexOf(trimmedName);
          if (discardedIndex > -1) {
            state.discardedBrushes.splice(discardedIndex, 1);
          }
          
          this.setOpen(false);
          this.$router.push(`/project/${this.project.id}/brush/${encodeURIComponent(trimmedName)}`);
          this.brushName = '';
          this.brushType = 'custom';

        } else {
          // Brush with this name already exists and is active
          toast.error('Brush name already exists', {
            description: `A brush with the name "${trimmedName}" already exists in this project.`,
          });
        }
      } else {
        // Create a new brush
        this.setOpen(false);
        const newBrush: Brush = {
          name: trimmedName,
          weight: 5,
          vibration: 0.1,
          definition: this.brushType === 'standard' ? 0.5 : null,
          quality: this.brushType === 'standard' ? 5 : null,
          opacity: this.brushType === 'standard' ? 150 : 25,
          spacing: 0.5,
          pressure: {
            type: 'standard',
            min_max: [1.3, 1],
            curve: [0.3, 0.2],
          },
          type: this.brushType,
          tip: this.brushType === 'custom'
              ? `// ${trimmedName}\n// The _m parameter is the brush tip's p5.Graphics buffer.\n// Draw your brush tip shape on it.\n_m.ellipse(0, 0, _m.width, _m.height);`
              : null,
          rotate: 'natural',
          blend: true,
        };

        if (newBrush.type === 'standard') {
          delete (newBrush as Partial<Brush>).type;
        }

        const updatedBrushes = [...(this.project.brushes || []), newBrush];
        updateProject(this.project.id, { brushes: updatedBrushes });

        this.$router.push(`/project/${this.project.id}/brush/${encodeURIComponent(trimmedName)}`);

        this.brushName = '';
        this.brushType = 'custom';
      }
    },
  },
});
</script>
