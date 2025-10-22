<template>
  <div>
    <Card class="group h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-md hover:scale-[1.02]">
      <CardContent class="p-4 pb-0">
        <div class="relative">
          <router-link :to="`/project/${id}`">
            <div class="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
              <img
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                :src="imageSrc"
                :alt="title"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </router-link>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col items-start gap-3 p-4">
        <div class="w-full">
          <router-link :to="`/project/${id}`">
            <CardTitle class="line-clamp-2 text-lg font-semibold text-foreground transition-colors duration-200 hover:text-primary">
              {{ title }}
            </CardTitle>
          </router-link>
        </div>
        <div class="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <Clock class="h-3 w-3" />
              <span>{{ formattedLastModified }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="h-3 w-3" />
              <span>Project {{ id }}</span>
            </div>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem @click="showDeleteDialog = true" variant="destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardFooter>
    </Card>

    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the project "{{ title }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button variant="destructive" @click="handleDeleteProject">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script>
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MoreHorizontal, Trash2 } from 'lucide-vue-next';
import { formatLastModified } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteProject } from '@/mocks/projects';

export default {
  name: 'ProjectCard',
  components: {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
    Calendar,
    Clock,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    MoreHorizontal,
    Trash2,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    canvasImage: {
      type: String,
      default: '',
    },
    lastModified: {
      type: String,
      default: '',
    },
  },
  emits: ['project-deleted'],
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: {
    imageSrc() {
      return this.canvasImage
        ? `data:image/png;base64,${this.canvasImage}`
        : 'https://placehold.co/600x400/';
    },
    formattedLastModified() {
      return formatLastModified(this.lastModified);
    },
  },
  methods: {
    handleDeleteProject() {
      deleteProject(this.id);
      this.$emit('project-deleted');
      this.showDeleteDialog = false;
    },
  },
};
</script>