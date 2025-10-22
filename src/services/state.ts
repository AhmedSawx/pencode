import { reactive } from 'vue';

export const state = reactive({
  vectorsArray: { objects: [] } as { objects: { object: any, objectName: string }[] },
  discardedBrushes: [] as string[],
});
