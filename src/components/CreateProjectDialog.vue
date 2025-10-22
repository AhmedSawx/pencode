<template>
  <Dialog :open="open" @update:open="setOpen">
    <DialogTrigger as-child>
      <Button class="flex items-center gap-2">
        <Plus class="h-4 w-4" />
        New Project
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogDescription>
          Create a new Pencode drawing project with a custom canvas size.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Project Name -->
        <div class="grid gap-2">
          <Label for="project-name">Project Name</Label>
          <Input
            id="project-name"
            v-model="projectName"
            placeholder="Enter project name..."
            @keydown.enter="handleEnterKey"
          />
        </div>

        <!-- Canvas Size -->
        <div class="grid gap-2">
          <Label>Canvas Size</Label>
          <Select v-model="selectedSizeName">
            <SelectTrigger>
              <SelectValue placeholder="Select canvas size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="size in canvasSizes" :key="size.name" :value="size.name">
                <div class="flex justify-between items-center w-full">
                  <span>{{ size.name }}</span>
                  <span class="text-muted-foreground ml-2">{{ size.label }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Custom Size Inputs -->
        <div v-if="isCustomSize" class="grid grid-cols-2 gap-2">
          <div class="grid gap-2">
            <Label for="custom-width">Width (px)</Label>
            <Input
              id="custom-width"
              v-model="customWidth"
              type="number"
              placeholder="800"
              min="100"
              max="4000"
            />
          </div>
          <div class="grid gap-2">
            <Label for="custom-height">Height (px)</Label>
            <Input
              id="custom-height"
              v-model="customHeight"
              type="number"
              placeholder="600"
              min="100"
              max="4000"
            />
          </div>
        </div>

        <!-- Size Preview -->
        <div class="text-sm text-muted-foreground">
          Canvas size: {{ sizePreview }} pixels
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="setOpen(false)" :disabled="isLoading">
          Cancel
        </Button>
        <Button @click="handleCreate" :disabled="isCreateDisabled || isLoading">
          {{ isLoading ? 'Creating...' : 'Create Project' }}
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addProject } from '@/mocks/projects';
import type { Project } from '@/mocks/types';

const canvasSizes = [
  { name: 'Small Square', width: 400, height: 400, label: '400 × 400' },
  { name: 'Medium Square', width: 600, height: 600, label: '600 × 600' },
  { name: 'Large Square', width: 800, height: 800, label: '800 × 800' },
  { name: 'Small Landscape', width: 800, height: 600, label: '800 × 600' },
  { name: 'Medium Landscape', width: 1200, height: 800, label: '1200 × 800' },
  { name: 'Large Landscape', width: 1600, height: 900, label: '1600 × 900' },
  { name: 'Small Portrait', width: 600, height: 800, label: '600 × 800' },
  { name: 'Medium Portrait', width: 800, height: 1200, label: '800 × 1200' },
  { name: 'Custom', width: 0, height: 0, label: 'Custom Size' },
];

export default defineComponent({
  name: 'CreateProjectDialog',
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
    onProjectCreate: Function as any,
  },
  data() {
    return {
      open: false,
      projectName: '',
      selectedSizeName: canvasSizes[3].name,
      customWidth: '',
      customHeight: '',
      isLoading: false,
      canvasSizes,
    };
  },
  computed: {
    selectedSize() {
      return this.canvasSizes.find(s => s.name === this.selectedSizeName) || this.canvasSizes[3];
    },
    isCustomSize() {
      return this.selectedSize.name === 'Custom';
    },
    isCreateDisabled() {
      return !this.projectName.trim() || (this.isCustomSize && (!this.customWidth || !this.customHeight));
    },
    sizePreview() {
        return this.isCustomSize
              ? `${this.customWidth || '?'} × ${this.customHeight || '?'}`
              : this.selectedSize.label
    }
  },
  methods: {
    setOpen(value: boolean) {
      this.open = value;
    },
    handleEnterKey() {
      if (!this.isCreateDisabled) {
        this.handleCreate();
      }
    },
    async handleCreate() {
      if (!this.projectName.trim()) return;

      this.isLoading = true;

      try {
        let finalWidth = this.selectedSize.width;
        let finalHeight = this.selectedSize.height;

        if (this.isCustomSize) {
          finalWidth = parseInt(this.customWidth) || 800;
          finalHeight = parseInt(this.customHeight) || 600;
        }

        const projectData: Omit<Project, 'id'> = {
          title: this.projectName.trim(),
          canvasSize: {
            width: finalWidth,
            height: finalHeight,
          },
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: 'draft',
          hasUnsavedChanges: true,
        };

        const newProject = addProject(projectData);

        if (this.onProjectCreate) {
          this.onProjectCreate(newProject);
        }

        this.$router.push(`/project/${newProject.id}`);

        this.open = false;
        this.projectName = '';
        this.selectedSizeName = canvasSizes[3].name;
        this.customWidth = '';
        this.customHeight = '';
      } catch (error) {
        console.error('Error creating project:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
</script>