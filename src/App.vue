<template>
  <SidebarProvider>
    <app-sidebar />
    <SidebarInset>
      <main class="h-screen w-full bg-background">
        <router-view v-if="!isInitializing" v-slot="{ Component, route }">
          <keep-alive include="Workspace">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
        <div v-else class="flex items-center justify-center h-full">
          <p>Initializing...</p>
        </div>
        <div id="canvas-graveyard" style="display: none;"></div>
      </main>
      <Toaster rich-colors :theme="theme" />
      <AboutDialog :open="showAboutDialog" @update:open="showAboutDialog = $event" />
    </SidebarInset>
  </SidebarProvider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppSidebar from '@/components/app-sidebar.vue';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { initializeEnvironment } from '@/services/api';
import AboutDialog from '@/components/AboutDialog.vue';

type Theme = 'light' | 'dark' | 'system';

export default defineComponent({
  name: 'App',
  components: {
    AppSidebar,
    SidebarProvider,
    SidebarInset,
    Toaster,
    AboutDialog,
  },
  data() {
    return {
      theme: (localStorage.getItem('vite-ui-theme') as Theme) || 'dark',
      isInitializing: true,
      showAboutDialog: false,
    };
  },
  provide() {
    return {
      theme: this.theme,
      setTheme: this.setTheme,
    };
  },
  methods: {
    setTheme(theme: Theme) {
      localStorage.setItem('vite-ui-theme', theme);
      this.theme = theme;
      this.applyTheme(theme);
    },
    applyTheme(theme: Theme) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        return;
      }

      root.classList.add(theme);
    },
    toggleAboutDialog(value: boolean) {
      this.showAboutDialog = value;
    },
  },
  async created() {
    console.log('[App.vue] Created hook: Starting initialization.');
    this.applyTheme(this.theme);
    await initializeEnvironment();
    console.log('[App.vue] Created hook: Initialization finished.');
    this.isInitializing = false;
  },
  mounted() {
    window.addEventListener('open-about-dialog', () => this.toggleAboutDialog(true));
  },
  beforeUnmount() {
    window.removeEventListener('open-about-dialog', () => this.toggleAboutDialog(true));
  },
});
</script>

<style>
.app-container {
  display: flex;
}
</style>
