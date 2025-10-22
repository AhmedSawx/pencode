<template>
  <div
    v-if="info"
    class="absolute z-10"
    :style="{ top: `${y}px`, left: `${x}px` }"
    data-testid="info-box"
  >
    <Card class="w-80">
      <CardHeader>
        <div class="flex justify-between items-center">
          <CardTitle>{{ info.name }}</CardTitle>
          <span
            v-if="info.type"
            class="text-xs font-mono bg-muted px-1.5 py-0.5 rounded-sm"
            >{{ info.type }}</span
          >
        </div>
        <CardDescription v-if="info.description">{{
          info.description
        }}</CardDescription>
      </CardHeader>
      <CardContent v-if="info.params && info.params.length > 0">
        <h4 class="font-semibold mb-2">Parameters</h4>
        <ul>
          <li v-for="(param, index) in info.params" :key="index" class="mb-1">
            <span class="font-mono text-sm bg-muted p-1 rounded">{{
              param.name
            }}</span
            >:
            <span class="text-sm text-muted-foreground">{{ param.type }}</span>
            <p
              v-if="param.description"
              class="text-xs text-muted-foreground ml-2"
            >
              {{ param.description }}
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default {
  components: {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  },
  props: {
    info: {
      type: Object,
      default: null,
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
  emits: ['close'],
  mounted() {
    document.addEventListener('click', this.handleClickOutside, true);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
  },
  methods: {
    handleClickOutside(event: MouseEvent) {
      if (!this.$el.contains(event.target)) {
        this.$emit('close');
      }
    },
  },
};
</script>
