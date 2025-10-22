<template>
  <div v-if="project" class="flex flex-col h-full w-full">
    <header
      class="flex justify-between pr-2 h-16 border-b border-border shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2 px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <router-link
                to="/"
                class="text-sm hover:text-foreground cursor-pointer"
                >Home</router-link
              >
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ project.title }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
    <Tabs
      v-model:modelValue="activeTab"
      default-value="editor"
      class="flex-1 flex flex-col"
    >
      <div class="border-b border-border">
        <TabsList class="ml-4 -mb-px rounded-none bg-transparent p-0">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="brushes">Brushes</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="editor" class="flex-1">
        <ResizablePanelGroup direction="horizontal" class="flex-1">
          <ResizablePanel :default-size="50" :min-size="30">
            <TextEditor
              ref="textEditor"
              v-model="textareaValue"
              @update:errors="editorErrors = $event"
            />
          </ResizablePanel>
          <ResizableHandle with-handle />
          <ResizablePanel :default-size="50" :min-size="30">
            <div
              class="h-full flex flex-col bg-card rounded-r-lg border border-l-0 border-border shadow-xl overflow-hidden"
            >
              <div
                class="flex items-center justify-between px-4 py-3 bg-muted border-b border-border h-14"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm text-foreground font-medium"
                    >Canvas</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <CreateButton
                    ref="createButtonRef"
                    :textarea-value="textareaValue"
                    :canvas-size="
                      project.canvasSize || { width: 800, height: 600 }
                    "
                    @canvas-created="handleCanvasCreated"
                  />
                  <SaveButton ref="saveButtonRef" @save="saveProject" />
                  <Button variant="outline" @click="handleClear">
                    Clear
                  </Button>
                </div>
              </div>

              <div
                ref="canvasContainerRef"
                class="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-gray-50 dark:bg-background canvas-grid"
                style="transform-origin: 0 0"
              >
                <div
                  ref="drawnImageRef"
                  id="drawnimage"
                  class="w-full h-full min-w-full min-h-full relative"
                >
                  <!-- Ruler points overlay -->
                  <div
                    class="absolute top-0 left-0 w-full h-full pointer-events-none"
                  >
                    <div
                      v-for="(point, index) in rulerPointsOnScreen"
                      :key="index"
                      class="absolute -translate-x-1/2 -translate-y-1/2"
                      :style="point.style"
                    >
                      <div
                        class="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-lg"
                      ></div>
                      <div
                        class="absolute top-full left-1/2 mt-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded-md whitespace-nowrap shadow-lg"
                      >
                        ({{ Math.round(point.x) }}, {{ Math.round(point.y) }})
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="!hasCanvasContent"
                    class="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div class="text-center text-muted-foreground">
                      <div class="text-6xl mb-4 opacity-30">🎨</div>
                      <p class="text-lg font-medium mb-2">
                        Your artwork will appear here
                      </p>
                      <p class="text-sm">
                        Canvas size:
                        {{
                          project.canvasSize
                            ? `${project.canvasSize.width} × ${project.canvasSize.height}`
                            : "Default"
                        }}
                      </p>
                      <p class="text-xs mt-2 opacity-75">
                        Use mouse wheel to zoom • Drag to pan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex items-center justify-between px-4 py-2 bg-muted border-t border-border h-12"
              >
                <div
                  class="flex items-center gap-4 text-xs text-muted-foreground"
                >
                  <span
                    >Cursor: ({{ canvasState.cursorPosition.x }},
                    {{ canvasState.cursorPosition.y }})</span
                  >
                  <span>•</span>
                  <span
                    >Position: ({{ canvasState.position.x }},
                    {{ canvasState.position.y }})</span
                  >
                  <span>•</span>
                  <span>Scale: {{ (canvasState.zoom / 100).toFixed(1) }}x</span>
                  <span>•</span>
                  <Button variant="outline" @click="handleResetView" size="sm">
                    Reset View
                  </Button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground"
                    >Zoom: {{ canvasState.zoom }}%</span
                  >
                  <Button
                    variant="outline"
                    size="sm"
                    @click="handleToggleFullscreen"
                    class="flex items-center gap-1"
                    :title="
                      isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    "
                  >
                    <Minimize v-if="isFullscreen" class="w-3 h-3" />
                    <Expand v-else class="w-3 h-3" />
                  </Button>

                  <Button variant="ghost" class="text-xs">Share</Button>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabsContent>
      <TabsContent value="brushes" class="flex-1">
        <BrushManager />
      </TabsContent>
    </Tabs>
    <UnsavedChangesDialog
      :open="showUnsavedDialog"
      @update:open="showUnsavedDialog = $event"
      @save="handleSaveAndContinue"
      @discard="handleDiscardAndContinue"
      @cancel="handleCancelNavigation"
      :project-title="project.title"
      :is-draft-project="project.status === 'draft'"
      :is-empty="isProjectEmpty"
    />
  </div>
  <div v-else class="flex items-center justify-center h-full">
    <p>Project not found.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Panzoom from "@panzoom/panzoom";
import { Expand, Minimize } from "lucide-vue-next";
import * as api from "@/services/api";
import { redrawCanvas } from "@/services/canvasManager";
import * as projectManager from "@/mocks/projects";
import type { Project } from "@/mocks/types";
import CreateButton from "@/components/CreateButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog.vue";
import { encodeProject } from "@/lib/file-format";
import { projectStore } from "@/mocks/project-store";
import { navigationState } from "@/services/navigationState";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import BrushManager from "@/components/BrushManager.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextEditor from "@/components/TextEditor.vue";

export interface CanvasState {
  zoom: number;
  position: { x: number; y: number };
  cursorPosition: { x: number; y: number };
}

export interface RulerPoint {
  x: number;
  y: number;
  style: { left: string; top: string };
}

export default defineComponent({
  name: "Workspace",
  components: {
    CreateButton,
    SaveButton,
    UnsavedChangesDialog,
    Expand,
    Minimize,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Separator,
    SidebarTrigger,
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
    Button,
    TextEditor,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    BrushManager,
  },
  data() {
    return {
      activeTab: "editor",
      textareaValue: "",
      originalCode: "",
      editorErrors: [],
      autoCreateTimeout: null as any,
      canvasState: {
        zoom: 100,
        position: { x: 0, y: 0 },
        cursorPosition: { x: 0, y: 0 },
      } as CanvasState,
      hasCanvasContent: false,
      isFullscreen: false,
      showUnsavedDialog: false,
      pendingNavigation: null as any,
      isSaving: false,
      rulerPoints: [] as { x: number; y: number }[],
      rulerPointsOnScreen: [] as RulerPoint[],
      rightClickTimeout: null as NodeJS.Timeout | null,
      doubleClickCooldown: false,
      panzoomInstance: null as any,
      resizeObserver: null as any,
      canvasContainerSize: { width: 0, height: 0 },
      isNavigating: false,
      lastPanzoomState: { x: 0, y: 0, scale: 1 },
    };
  },
  computed: {
    project() {
      return projectStore.projects.find((p) => p.id === this.$route.params.id);
    },
    isProjectEmpty() {
      if (!this.project) return true;
      const p = projectManager.getProject(this.project.id);
      if (!p || p.status !== "draft") return false;
      return !p.code?.trim() && !p.canvasImage;
    },
    projectHasUnsavedChanges() {
      return this.project?.hasUnsavedChanges || false;
    },
  },
  watch: {
    activeTab(newTab, oldTab) {
      if (newTab === "brushes" && oldTab === "editor") {
        this.preserveCanvas();
      } else if (newTab === "editor" && oldTab === "brushes") {
        this.restoreCanvas();
      }
    },
    textareaValue(newValue: string) {
      if (this.project && newValue !== this.originalCode) {
        projectManager.updateProject(this.project.id, {
          code: newValue,
          hasUnsavedChanges: true,
        });
      } else if (this.project && newValue === this.originalCode) {
        projectManager.updateProject(this.project.id, {
          code: this.originalCode,
          hasUnsavedChanges: false,
        });
      }
      if (this.autoCreateTimeout) {
        clearTimeout(this.autoCreateTimeout);
      }
      this.autoCreateTimeout = setTimeout(() => {
        if (this.editorErrors.length === 0 && this.textareaValue.trim()) {
          (this.$refs.createButtonRef as any)?.triggerCreate();
        }
      }, 400);
    },
    "$route.params.id": {
      immediate: true,
      handler(newId: string) {
        if (newId) {
          this.loadProject(newId);
        }
      },
    },
  },
  methods: {
    preserveCanvas() {
      const canvas = document.getElementById("defaultCanvas0");
      const graveyard = document.getElementById("canvas-graveyard");
      if (canvas && graveyard) {
        if (this.panzoomInstance) {
          // Save the state before destroying
          const pan = this.panzoomInstance.getPan();
          this.lastPanzoomState = {
            x: pan.x,
            y: pan.y,
            scale: this.panzoomInstance.getScale(),
          };
          this.panzoomInstance.destroy();
          this.panzoomInstance = null;
        }
        graveyard.appendChild(canvas);
      }
    },
    restoreCanvas() {
      // Use setTimeout to ensure this runs after Vue has fully updated the DOM,
      // making the container ref available.
      setTimeout(() => {
        const graveyard = document.getElementById("canvas-graveyard");
        const canvas = graveyard ? graveyard.querySelector("canvas") : null;
        const container = this.$refs.drawnImageRef as HTMLElement;

        if (canvas && container) {
          // If we found the preserved canvas, move it back and re-init panzoom.
          container.appendChild(canvas);
          this.initPanzoom(this.lastPanzoomState);
        } else if (this.project?.code?.trim()) {
          // As a fallback, if the canvas wasn't preserved, recreate it.
          const success = redrawCanvas(
            this.textareaValue,
            this.project.canvasSize,
          );
          if (success) {
            this.handleCanvasCreated();
          }
        }
      }, 0);
    },
    async saveProject(): Promise<void> {
      if (!this.project) return;

      this.isSaving = true;

      try {
        const projectToSave: Project = {
          ...this.project,
          code: this.textareaValue,
        };

        // If desktop mode and no filePath, it's a new project that needs a path first.
        if (api.isDesktop.value && !projectToSave.filePath) {
          await this.handleSaveAs();
        } else {
          const savedProject = await projectManager.saveProject(projectToSave);
          this.originalCode = savedProject.code || "";
          (this.$refs.saveButtonRef as any).showSuccessState();
        }
      } catch (error) {
        console.error("Failed to save project:", error);
        // Optionally show an error toast to the user
      } finally {
        this.isSaving = false;
      }
    },

    async handleSaveAs(event?: Event): Promise<void> {
      if (!this.project) return;

      let filePath = (event as CustomEvent)?.detail?.filePath;

      // Only show the dialog in desktop mode.
      if (api.isDesktop.value && !filePath) {
        const defaultName = `${this.project.title || "Untitled"}.pencode`;
        filePath = await window.pywebview!.api.show_save_as_dialog(
          defaultName,
          ["Pencode Projects (*.pencode)"],
        );
      }

      if (!filePath) {
        // User cancelled the dialog or not in a compatible environment.
        this.isSaving = false;
        return;
      }

      const newTitle =
        filePath.split(/[/\\]/).pop()?.replace(".pencode", "") ||
        this.project.title;

      // Update the project in the store with the new path and title before saving.
      projectManager.updateProject(this.project.id, {
        filePath: filePath,
        title: newTitle,
      });

      // Now that the path is set, call the main save method.
      await this.saveProject();
    },
    triggerSave(): void {
      this.saveProject();
    },
    initPanzoom(initialState?: { x: number; y: number; scale: number }): void {
      console.log("[Workspace.vue] initPanzoom called");
      if (this.$refs.drawnImageRef && this.$refs.canvasContainerRef) {
        console.log("[Workspace.vue] initPanzoom: refs are available");
        try {
          const container = this.$refs.canvasContainerRef as HTMLElement;
          const elem = this.$refs.drawnImageRef as HTMLElement;

          const startState = initialState || { x: 0, y: 0, scale: 1 };

          this.panzoomInstance = Panzoom(elem, {
            canvas: true,
            maxScale: 5,
            minScale: 0.1,
            startX: startState.x,
            startY: startState.y,
            startScale: startState.scale,
          });
          container.addEventListener(
            "wheel",
            this.panzoomInstance.zoomWithWheel,
          );
          elem.addEventListener("panzoomchange", this.updateCanvasState);
          container.addEventListener("mousemove", this.updateCursorPosition);
          container.addEventListener(
            "contextmenu",
            this.handleCanvasContextMenu,
          );
          this.updateCanvasState();

          if (this.resizeObserver) {
            this.resizeObserver.disconnect();
          }
          this.resizeObserver = new ResizeObserver((entries) => {
            if (!this.panzoomInstance) return;
            const entry = entries[0];
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;

            const { x, y } = this.panzoomInstance.getPan();
            const oldWidth = this.canvasContainerSize.width;
            const oldHeight = this.canvasContainerSize.height;

            const deltaX = (newWidth - oldWidth) / 2;
            const deltaY = (newHeight - oldHeight) / 2;

            this.panzoomInstance.pan(x + deltaX, y + deltaY, {
              animate: false,
            });

            this.canvasContainerSize = { width: newWidth, height: newHeight };
          });
          this.resizeObserver.observe(container);
          this.canvasContainerSize = {
            width: container.offsetWidth,
            height: container.offsetHeight,
          };
        } catch (error) {
          console.error("Error initializing Panzoom:", error);
        }
      }
    },
    loadProject(projectId: string): void {
      const pId = projectId || (this.$route.params.id as string);
      const foundProject = projectManager.getProject(pId);

      if (foundProject) {
        localStorage.setItem("lastOpenedProjectId", foundProject.id);
        this.textareaValue = foundProject.code || "";

        if (!foundProject.hasUnsavedChanges) {
          this.originalCode = foundProject.code || "";
        }

        this.$nextTick(() => {
          if (foundProject.code?.trim()) {
            (this.$refs.createButtonRef as any).triggerCreate();
          }
        });
      } else {
        this.$router.push("/");
      }
    },
    handleClear(): void {
      this.textareaValue = "";
      const canvas = document.getElementById("defaultCanvas0");
      if (canvas) canvas.remove();
      this.hasCanvasContent = false;
      if (this.panzoomInstance) this.panzoomInstance.reset();
      this.rulerPoints = [];
      this.rulerPointsOnScreen = [];
    },
    handleCanvasCreated(): void {
      this.hasCanvasContent = true;
      const canvas = document.getElementById(
        "defaultCanvas0",
      ) as HTMLCanvasElement;

      if (canvas) {
        const dataURL = canvas.toDataURL("image/png");
        const base64Data = dataURL.split(",")[1];
        projectManager.updateProject(this.project!.id, {
          canvasImage: base64Data,
        });
      }

      // Only initialize panzoom if it doesn't exist. On subsequent creates,
      // the existing instance will persist, preserving the view seamlessly.
      if (!this.panzoomInstance) {
        this.initPanzoom();
      }
    },
    handleSaveAndContinue(): void {
      this.saveProject().then(() => {
        if (this.pendingNavigation) {
          if (this.pendingNavigation.path === "/") {
            navigationState.activeProjectId = null;
          }
          this.isNavigating = true;
          this.$router.push(this.pendingNavigation);
          this.pendingNavigation = null;
        }
        this.showUnsavedDialog = false;
      });
    },
    handleDiscardAndContinue(): void {
      if (this.project) {
        this.textareaValue = this.originalCode;

        if (this.project.status === "draft") {
          projectManager.deleteProject(this.project.id);
        }
      }

      this.showUnsavedDialog = false;
      this.$nextTick(() => {
        if (this.pendingNavigation) {
          this.isNavigating = true;
          this.$router.push(this.pendingNavigation);
          this.pendingNavigation = null;
        }
      });
    },
    handleCancelNavigation(): void {
      this.showUnsavedDialog = false;
      this.pendingNavigation = null;
    },
    handleFullscreenChange(): void {
      this.isFullscreen = !!document.fullscreenElement;
    },
    updateCursorPosition(event: MouseEvent): void {
      if (!this.project) return;
      const p5canvas = document.getElementById("defaultCanvas0");
      if (!p5canvas) return;

      const rect = p5canvas.getBoundingClientRect();
      const canvasWidth = this.project.canvasSize.width;
      const canvasHeight = this.project.canvasSize.height;
      const scale = rect.width / canvasWidth;

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const canvasX = mouseX / scale - canvasWidth / 2;
      const canvasY = mouseY / scale - canvasHeight / 2;

      this.canvasState.cursorPosition = {
        x: Math.round(canvasX),
        y: Math.round(canvasY),
      };
    },
    getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
      if (!this.project) return { x: 0, y: 0 };

      const p5canvas = document.getElementById("defaultCanvas0");
      if (!p5canvas) return { x: 0, y: 0 };

      const rect = p5canvas.getBoundingClientRect();
      const canvasWidth = this.project.canvasSize.width;
      const canvasHeight = this.project.canvasSize.height;
      const scale = rect.width / canvasWidth;

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let canvasX = mouseX / scale - canvasWidth / 2;
      let canvasY = mouseY / scale - canvasHeight / 2;

      // Clamping logic
      const halfWidth = this.project.canvasSize.width / 2;
      const halfHeight = this.project.canvasSize.height / 2;

      canvasX = Math.max(-halfWidth, Math.min(canvasX, halfWidth));
      canvasY = Math.max(-halfHeight, Math.min(canvasY, halfHeight));

      return {
        x: canvasX,
        y: canvasY,
      };
    },
    handleCanvasContextMenu(event: MouseEvent): void {
      event.preventDefault();

      if (this.rightClickTimeout) {
        clearTimeout(this.rightClickTimeout);
        this.rightClickTimeout = null;

        if (this.doubleClickCooldown) return;

        if (this.rulerPoints.length > 0) {
          this.rulerPoints = [];
        } else {
          const coords = this.getCanvasCoordinates(event);
          this.rulerPoints.push(coords);
        }
        this.updateRulerPointsScreenPosition();

        this.doubleClickCooldown = true;
        setTimeout(() => {
          this.doubleClickCooldown = false;
        }, 500);
      } else {
        this.rightClickTimeout = setTimeout(() => {
          if (this.rulerPoints.length > 0) {
            const coords = this.getCanvasCoordinates(event);
            this.rulerPoints.push(coords);
            this.updateRulerPointsScreenPosition();
          }
          this.rightClickTimeout = null;
        }, 300);
      }
    },
    updateRulerPointsScreenPosition(): void {
      if (!this.project) {
        this.rulerPointsOnScreen = [];
        return;
      }
      const canvasWidth = this.project.canvasSize.width;
      const canvasHeight = this.project.canvasSize.height;

      this.rulerPointsOnScreen = this.rulerPoints.map((point) => {
        const cssX = point.x + canvasWidth / 2;
        const cssY = point.y + canvasHeight / 2;
        return {
          x: point.x,
          y: point.y,
          style: {
            left: `${cssX}px`,
            top: `${cssY}px`,
          },
        };
      });
    },
    updateCanvasState(event?: any): void {
      if (this.panzoomInstance) {
        let x, y, scale;
        if (event && event.detail) {
          ({ x, y, scale } = event.detail);
        } else {
          const pan = this.panzoomInstance.getPan();
          x = pan.x;
          y = pan.y;
          scale = this.panzoomInstance.getScale();
        }

        this.canvasState = {
          ...this.canvasState,
          zoom: Math.round(scale * 100),
          position: { x: Math.round(x), y: Math.round(y) },
        };
      }
    },
    handleResetView(): void {
      if (
        this.panzoomInstance &&
        this.$refs.canvasContainerRef &&
        this.project
      ) {
        const container = this.$refs.canvasContainerRef as HTMLElement;

        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        const contentWidth = this.project.canvasSize.width;
        const contentHeight = this.project.canvasSize.height;

        // Calculate the pan values that will center the content
        const centeredX = (containerWidth - contentWidth) / 2;
        const centeredY = (containerHeight - contentHeight) / 2;

        // Animate to the centered, 100% zoom state
        this.panzoomInstance.zoom(1, { animate: true });
        this.panzoomInstance.pan(centeredX, centeredY, { animate: true });

        // Update the stored state to this new default
        this.lastPanzoomState = { x: centeredX, y: centeredY, scale: 1 };
      }
    },
    handleToggleFullscreen(): void {
      const container = this.$refs.canvasContainerRef as HTMLElement;
      if (!this.isFullscreen) {
        container?.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
    handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (this.projectHasUnsavedChanges && !api.isDesktop.value) {
        event.preventDefault();
        event.returnValue = "";
      }
    },
    handleExportProject() {
      if (!this.project) return;

      const projectData = { ...this.project, code: this.textareaValue };
      const binaryData = encodeProject(projectData);
      const blob = new Blob([binaryData], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.project.title || "Untitled"}.pencode`;
      link.click();
      URL.revokeObjectURL(url);
    },
    async handleExportImage() {
      if (!this.project) return;

      const canvas = document.getElementById(
        "defaultCanvas0",
      ) as HTMLCanvasElement;
      if (!canvas) {
        console.warn("Canvas not found.");
        return;
      }

      const dataURL = canvas.toDataURL("image/png");

      if (api.isDesktop.value) {
        const defaultName = `${this.project.title || "Untitled"}.png`;
        const filePath = await window.pywebview!.api.show_save_as_dialog(
          defaultName,
          ["PNG Images (*.png)"],
        );
        if (filePath) {
          const base64Data = dataURL.split(",")[1];
          await window.pywebview!.api.save_image(filePath, base64Data);
        }
      } else {
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${this.project.title || "Untitled"}.png`;
        link.click();
      }
    },
  },
  mounted() {
    this.loadProject(this.$route.params.id as string);
    navigationState.activeProjectId = this.$route.params.id as string;
    window.addEventListener("save-project", this.triggerSave);
    window.addEventListener("save-project-as", this.handleSaveAs);
    window.addEventListener("export-project", this.handleExportProject);
    window.addEventListener("export-image", this.handleExportImage);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    this.$nextTick(() => this.initPanzoom());
  },
  activated() {
    navigationState.activeProjectId = this.$route.params.id as string;
    window.addEventListener("save-project", this.triggerSave);
    window.addEventListener("save-project-as", this.handleSaveAs);
    window.addEventListener("export-project", this.handleExportProject);
    window.addEventListener("export-image", this.handleExportImage);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    if (this.activeTab === "editor") {
      this.restoreCanvas();
    }
  },
  deactivated() {
    const container = this.$refs.canvasContainerRef as HTMLElement;
    if (this.panzoomInstance) {
      if (container) {
        container.removeEventListener(
          "wheel",
          this.panzoomInstance.zoomWithWheel,
        );
        container.removeEventListener("mousemove", this.updateCursorPosition);
        container.removeEventListener(
          "contextmenu",
          this.handleCanvasContextMenu,
        );
      }
      this.panzoomInstance.destroy();
      this.panzoomInstance = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener("save-project", this.triggerSave);
    window.removeEventListener("save-project-as", this.handleSaveAs);
    window.removeEventListener("export-project", this.handleExportProject);
    window.removeEventListener("export-image", this.handleExportImage);
    document.removeEventListener(
      "fullscreenchange",
      this.handleFullscreenChange,
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeUnmount() {
    const container = this.$refs.canvasContainerRef as HTMLElement;
    if (this.panzoomInstance) {
      if (container) {
        container.removeEventListener(
          "wheel",
          this.panzoomInstance.zoomWithWheel,
        );
        container.removeEventListener("mousemove", this.updateCursorPosition);
        container.removeEventListener(
          "contextmenu",
          this.handleCanvasContextMenu,
        );
      }
      this.panzoomInstance.destroy();
      this.panzoomInstance = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener("save-project", this.triggerSave);
    window.removeEventListener("save-project-as", this.handleSaveAs);
    window.removeEventListener("export-project", this.handleExportProject);
    window.removeEventListener("export-image", this.handleExportImage);
    document.removeEventListener(
      "fullscreenchange",
      this.handleFullscreenChange,
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeRouteLeave(to: any, _from: any, next: any) {
    if (this.isNavigating) {
      next();
      return;
    }
    // Allow navigation to the brush editor of the current project
    if (to.name === "BrushEditor" && to.params.id === this.project?.id) {
      this.preserveCanvas();
      next();
      return;
    }
    if (to.path === "/settings") {
      next();
      return;
    }
    if (this.isSaving) {
      next();
      return;
    }
    if (this.projectHasUnsavedChanges) {
      this.pendingNavigation = to;
      this.showUnsavedDialog = true;
      next(false);
    } else {
      if (to.path === "/") {
        navigationState.activeProjectId = null;
      }
      next();
    }
  },
});
</script>
