<template>
  <div v-if="brush && project" class="flex flex-col h-full">
    <header
      class="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0"
    >
      <router-link
        :to="`/project/${project.id}`"
        data-testid="back-to-workspace"
      >
        <Button variant="outline" size="icon">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </router-link>
      <Separator orientation="vertical" class="h-6" />
      <div class="flex flex-col">
        <h2 class="font-bold text-lg">{{ brush.name }}</h2>
        <p class="text-xs text-muted-foreground">Editing Brush</p>
      </div>
    </header>
    <div class="flex-1 p-6 overflow-auto">
      <div
        v-if="brush"
        class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
      >
        <!-- Left Column: Main Properties & Code Editor -->
        <div class="md:col-span-2 flex flex-col gap-6">
          <!-- General Properties -->
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-2 gap-4">
              <div class="grid gap-1.5">
                <Label>Type</Label>
                <p class="text-sm text-muted-foreground">{{ brush.type }}</p>
              </div>
              <div class="grid gap-1.5">
                <Label for="rotate">Rotation</Label>
                <Select v-model="brush.rotate">
                  <SelectTrigger id="rotate">
                    <SelectValue placeholder="Select rotation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-1.5">
                <Label for="blend">Color Blending</Label>
                <div class="flex items-center gap-2 pt-2">
                  <Switch id="blend" v-model:checked="brushBlend" />
                  <span>{{ brush.blend ? "Enabled" : "Disabled" }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Tip Code Editor -->
          <Card v-if="brush.type === 'custom'" class="flex flex-col flex-1 min-h-0">
            <CardHeader>
              <CardTitle>Brush Tip Code</CardTitle>
              <CardDescription
                >Define the brush tip's geometry using JavaScript. The `_m`
                variable is your p5.Graphics instance.</CardDescription
              >
            </CardHeader>
            <CardContent class="flex-1 flex flex-col min-h-0">
              <codemirror
                :model-value="brush.tip ?? ''"
                @update:model-value="brush.tip = $event"
                placeholder="// Draw your brush tip shape on the _m graphics buffer.
_m.ellipse(0, 0, _m.width, _m.height);"
                :style="{ height: '100%' }"
                :autofocus="true"
                :indent-with-tab="true"
                :tab-size="2"
                :extensions="extensions"
                @ready="handleReady"
                ref="cm"
              />
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Dynamic Properties -->

                <div class="flex flex-col gap-6">

                  <div class="flex justify-end">

                    <DropdownMenu>

                      <DropdownMenuTrigger as-child>

                        <Button variant="outline" :disabled="availableProperties.length === 0">Add Property</Button>

                      </DropdownMenuTrigger>

                      <DropdownMenuContent>

                        <DropdownMenuItem v-for="prop in availableProperties" :key="prop.key" @click="addProperty(prop.key)">

                          {{ prop.label }}

                        </DropdownMenuItem>

                      </DropdownMenuContent>

                    </DropdownMenu>

                  </div>

        

                  <!-- Dynamically Rendered Property Cards -->

                  <template v-for="(value, key) in brush" :key="key">

                    <Card v-if="isEditableProperty(key)">

                      <CardHeader class="flex flex-row items-center justify-between">

                        <CardTitle class="capitalize">{{ key }}</CardTitle>

                        <Button variant="destructive" size="icon" @click="removeProperty(key)" class="h-7 w-7">

                          <Trash2 class="h-4 w-4" />

                        </Button>

                      </CardHeader>

                      <CardContent>

                        <!-- Sliders -->

                        <div v-if="key === 'weight'" class="grid gap-1.5">

                          <Label>Weight: {{ value }}</Label>

                          <Slider v-model="brushWeight" :max="100" :step="1" />

                        </div>

                        <div v-if="key === 'opacity'" class="grid gap-1.5">

                          <Label>Opacity: {{ value }}</Label>

                          <Slider v-model="brushOpacity" :max="255" :step="1" />

                        </div>

                        <div v-if="key === 'spacing'" class="grid gap-1.5">

                          <Label>Spacing: {{ value }}</Label>

                          <Slider v-model="brushSpacing" :max="10" :step="0.1" />

                        </div>

                        <div v-if="key === 'vibration'" class="grid gap-1.5">

                          <Label>Vibration: {{ value }}</Label>

                          <Slider v-model="brushVibration" :max="10" :step="0.1" />

                        </div>

                        <div v-if="key === 'definition'" class="grid gap-1.5">

                          <Label>Definition: {{ value }}</Label>

                          <Slider v-model="brushDefinition" :max="1" :step="0.05" />

                        </div>

                        <div v-if="key === 'quality'" class="grid gap-1.5">

                          <Label>Quality: {{ value }}</Label>

                          <Slider v-model="brushQuality" :max="10" :step="1" />

                        </div>

        

                        <!-- Pressure Object -->

                        <div v-if="key === 'pressure'" class="grid gap-4">

                          <div class="grid gap-1.5">

                            <Label for="pressure-type">Type</Label>

                            <Select v-model="brush.pressure.type">

                              <SelectTrigger id="pressure-type"><SelectValue /></SelectTrigger>

                              <SelectContent>

                                <SelectItem value="standard">Standard</SelectItem>

                                <SelectItem value="custom">Custom</SelectItem>

                              </SelectContent>

                            </Select>

                          </div>

                          <div class="grid gap-1.5">

                            <Label>Min/Max</Label>

                            <div class="flex gap-2">

                              <Input type="number" v-model.number="brush.pressure.min_max[0]" />

                              <Input type="number" v-model.number="brush.pressure.min_max[1]" />

                            </div>

                          </div>

                          <div v-if="brush.pressure.type === 'standard'" class="grid gap-1.5">

                            <Label>Curve</Label>

                            <div class="flex gap-2">

                              <Input type="number" v-model.number="standardPressureCurveA" />

                              <Input type="number" v-model.number="standardPressureCurveB" />

                            </div>

                          </div>

                          <div v-if="brush.pressure.type === 'custom'" class="grid gap-1.5">

                            <Label>Curve Function</Label>

                            <codemirror v-model="customPressureCurve" :style="{ height: '100px' }" :extensions="extensions" />

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  </template>

                </div>
      </div>
    </div>
    <UnsavedChangesDialog
      :open="showErrorDialog"
      @update:open="showErrorDialog = $event"
      variant="error"
      item-name="brush code"
      @discard="handleDiscardAndContinue"
      @cancel="handleCancelNavigation"
    />
  </div>
  <div v-else class="flex items-center justify-center h-full">
    <p>Brush not found in this project.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ArrowLeft, X, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectStore } from "@/mocks/project-store";
import { updateProject } from "@/mocks/projects";
import type { Project, Brush } from "@/mocks/types";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog.vue";

import { Codemirror } from "vue-codemirror";

import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion } from "@codemirror/autocomplete";
import { linter, lintGutter, setDiagnostics } from "@codemirror/lint";
import * as acorn from "acorn";
import { p5CompletionSource } from "@/services/p5-completion";

// Custom linting source for acorn
const acornLinter = linter((view) => {
  let diagnostics: any[] = [];
  try {
    acorn.parse(view.state.doc.toString(), { ecmaVersion: "latest" });
  } catch (e: any) {
    const pos = e.pos;
    diagnostics.push({
      from: pos - 1,
      to: pos,
      severity: "error",
      message: e.message.split(" (")[0],
    });
  }
  return diagnostics;
});

export default defineComponent({
  name: "BrushEditor",
  components: {
    ArrowLeft,
    X,
    Trash2,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Input,
    Label,
    Separator,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Slider,
    Switch,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    UnsavedChangesDialog,
    Codemirror,
  },
  setup() {
    const id = Math.random().toString(36).substring(7);
    const cm = ref(null);
    const extensions = [
      javascript(),
      javascriptLanguage.data.of({
        autocomplete: p5CompletionSource,
      }),
      oneDark,
      autocompletion(),
      lintGutter(),
      acornLinter,
    ];

    return { id, extensions, cm };
  },
  data() {
    return {
      editorView: null as any,
      hasSyntaxError: false,
      originalBrushTip: "",
      showErrorDialog: false,
      pendingNavigation: null as any,
    };
  },
  computed: {
    project(): Project | undefined {
      return projectStore.projects.find((p) => p.id === this.$route.params.id);
    },
    brush: {
      get(): Brush | undefined {
        if (!this.project || !this.project.brushes) return undefined;
        return this.project.brushes.find(
          (b) => b.name === this.$route.params.brushName,
        );
      },
      set(newBrush: Brush) {
        if (!this.project || !this.brush) return;
        const brushIndex =
          this.project.brushes?.findIndex((b) => b.name === this.brush?.name) ??
          -1;
        if (brushIndex !== -1) {
          const newBrushes = [...this.project.brushes!];
          newBrushes[brushIndex] = newBrush;
          updateProject(this.project.id, { brushes: newBrushes });
        }
      },
    },
    brushWeight: {
      get() {
        return [this.brush?.weight ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.weight = v[0];
      },
    },
    brushOpacity: {
      get() {
        return [this.brush?.opacity ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.opacity = v[0];
      },
    },
    brushSpacing: {
      get() {
        return [this.brush?.spacing ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.spacing = v[0];
      },
    },
    brushVibration: {
      get() {
        return [this.brush?.vibration ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.vibration = v[0];
      },
    },
    brushDefinition: {
      get() {
        return [this.brush?.definition ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.definition = v[0];
      },
    },
    brushQuality: {
      get() {
        return [this.brush?.quality ?? 0];
      },
      set(v: number[]) {
        if (this.brush) this.brush.quality = v[0];
      },
    },
    brushBlend: {
      get() {
        return this.brush?.blend ?? false;
      },
      set(v: boolean) {
        if (this.brush) {
          this.brush.blend = v;
        }
      },
    },
    standardPressureCurveA: {
      get() {
        if (this.brush?.pressure.type === 'standard' && Array.isArray(this.brush.pressure.curve)) {
          return this.brush.pressure.curve[0];
        }
        return 0.3;
      },
      set(v: number) {
        if (this.brush?.pressure.type === 'standard') {
          if (!Array.isArray(this.brush.pressure.curve)) {
            this.brush.pressure.curve = [v, 0.2];
          } else {
            this.brush.pressure.curve[0] = v;
          }
        }
      },
    },
    standardPressureCurveB: {
      get() {
        if (this.brush?.pressure.type === 'standard' && Array.isArray(this.brush.pressure.curve)) {
          return this.brush.pressure.curve[1];
        }
        return 0.2;
      },
      set(v: number) {
        if (this.brush?.pressure.type === 'standard') {
          if (!Array.isArray(this.brush.pressure.curve)) {
            this.brush.pressure.curve = [0.3, v];
          }
          else {
            this.brush.pressure.curve[1] = v;
          }
        }
      },
    },
    customPressureCurve: {
      get() {
        if (this.brush?.pressure.type === 'custom' && typeof this.brush.pressure.curve === 'string') {
          return this.brush.pressure.curve;
        }
        return '';
      },
      set(v: string) {
        if (this.brush?.pressure.type === 'custom') {
          this.brush.pressure.curve = v;
        }
      },
    },
    availableProperties() {
      const allProps: { key: keyof Brush; label: string; types?: (Brush['type'])[] }[] = [
        { key: 'weight', label: 'Weight' },
        { key: 'opacity', label: 'Opacity' },
        { key: 'spacing', label: 'Spacing' },
        { key: 'vibration', label: 'Vibration' },
        { key: 'pressure', label: 'Pressure' },
        { key: 'rotate', label: 'Rotate' },
        { key: 'blend', label: 'Blend' },
        { key: 'definition', label: 'Definition', types: ['standard', 'spray'] },
        { key: 'quality', label: 'Quality', types: ['standard', 'spray'] },
        { key: 'tip', label: 'Tip', types: ['custom'] },
      ];
      if (!this.brush) return [];

      const brushType = this.brush.type;

      return allProps.filter(prop => {
        const isPresent = this.brush![prop.key] !== null && this.brush![prop.key] !== undefined;
        if (isPresent) return false;

        if (prop.types) {
          return prop.types.includes(brushType);
        }

        return true;
      });
    },
  },
  methods: {
    isEditableProperty(key: string) {
      const nonEditable: (keyof Brush)[] = ['name', 'type'];
      return !nonEditable.includes(key as keyof Brush) && this.brush && (this.brush[key as keyof Brush] !== null && this.brush[key as keyof Brush] !== undefined);
    },
    addProperty(key: keyof Brush) {
      if (!this.brush) return;
      const newBrush = { ...this.brush };
      // Set default values for newly added properties
      const defaults: Partial<Brush> = {
        weight: 5,
        opacity: 100,
        spacing: 0.5,
        vibration: 0.1,
        pressure: { type: 'standard', min_max: [1.3, 1], curve: [0.3, 0.2] },
        rotate: 'natural',
        blend: true,
        definition: 0.5,
        quality: 5,
        tip: '// your tip code here\n_m.ellipse(0, 0, _m.width, _m.height);'
      };
      if (key in defaults) {
        (newBrush as any)[key] = (defaults as any)[key];
        this.brush = newBrush;
      }
    },
    removeProperty(key: keyof Brush) {
      if (!this.brush) return;
      const newBrush = { ...this.brush };
      (newBrush as any)[key] = null;
      this.brush = newBrush;
    },
    handleEditorUpdate(viewUpdate: any) {
      const lintState = viewUpdate.state.field(acornLinter, false);
      let hasError = false;
      if (lintState) {
        for (const diagnostic of lintState.diagnostics) {
          if (diagnostic.severity === "error") {
            hasError = true;
            break;
          }
        }
      }
      this.hasSyntaxError = hasError;
    },
    handleReady({ view }: any) {
      this.editorView = view;
    },
    handleDiscardAndContinue() {
      if (this.brush && this.editorView) {
        this.brush.tip = this.originalBrushTip;
        this.hasSyntaxError = false;
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: this.originalBrushTip,
          },
        });
        // Clear diagnostics
        const clearTransaction = setDiagnostics(this.editorView.state, []);
        this.editorView.dispatch(clearTransaction);
      }
      this.showErrorDialog = false;
      this.$router.push(this.pendingNavigation);
    },
    handleCancelNavigation() {
      this.showErrorDialog = false;
      this.pendingNavigation = null;
    },
    handleBeforeUnload(event: BeforeUnloadEvent) {
      if (this.hasSyntaxError) {
        event.preventDefault();
        event.returnValue =
          "You have syntax errors in your code. Are you sure you want to leave? Changes will be discarded.";
      }
    },
  },
  mounted() {
    if (this.brush) {
      this.originalBrushTip = this.brush.tip || "";
    }
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeRouteLeave(to: any, _from: any, next: any) {
    if (!this.editorView) return next();

    let hasError = false;
    try {
      // Perform a direct, synchronous parse check to avoid race conditions.
      acorn.parse(this.editorView.state.doc.toString(), {
        ecmaVersion: "latest",
      });
    } catch (e) {
      hasError = true;
    }

    if (hasError) {
      this.pendingNavigation = to;
      this.showErrorDialog = true;
      next(false);
    } else {
      next();
    }
  },
});
</script>
