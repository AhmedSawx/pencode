<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="flex aspect-square size-8 items-center justify-center rounded-lg">
              <img src="/Pencode-logo-light.svg" alt="Pencode" class="block dark:hidden" />
              <img src="/Pencode-logo-dark.svg" alt="Pencode" class="hidden dark:block" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">Pencode</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-muted-foreground text-xs">
            File
          </DropdownMenuLabel>
          <template v-for="(item, index) in filteredMenuItems" :key="index">
            <DropdownMenuItem v-if="!item.separator" @click="item.action" :disabled="item.disabled">
              {{ item.label }}
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="item.separator" />
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<script lang="ts">
import { ChevronsUpDown } from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { isDesktop } from '@/services/api';

export interface MenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
  desktopOnly?: boolean;
  disabled?: boolean;
}

export default {
  name: 'AppMenu',
  components: {
    ChevronsUpDown,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  },
  data() {
    return {
      isMobile: false,
      mediaQueryList: null as MediaQueryList | null,
      mainMenuItems: [
        { label: 'Open Project', action: () => window.dispatchEvent(new CustomEvent('open-project-dialog')) },
        { separator: true },
        { label: 'Help', action: this.help, disabled: true },
        { label: 'About', action: this.about, disabled: false },
        { separator: true, desktopOnly: true },
        { label: 'Quit', action: this.quit, desktopOnly: true },
      ] as MenuItem[],
      workspaceMenuItems: [
        { label: 'Save', action: this.saveProject },
        { label: 'Save As...', action: this.saveAs, desktopOnly: true },
        { label: 'Export Project', action: this.exportProject, desktopOnly: false },
        { label: 'Export Image...', action: this.exportImage },
        { separator: true },
        { label: 'Close Project', action: this.closeProject },
        { separator: true },
        { label: 'Help', action: this.help, disabled: true },
        { label: 'About', action: this.about, disabled: false },
        { separator: true, desktopOnly: true },
        { label: 'Quit', action: this.quit, desktopOnly: true },
      ] as MenuItem[],
    };
  },
  computed: {
    isWorkspace() {
      return this.$route.name === 'Workspace';
    },
    currentMenuItems() {
      return this.isWorkspace ? this.workspaceMenuItems : this.mainMenuItems;
    },
    filteredMenuItems() {
      if (isDesktop.value) {
        return this.currentMenuItems.filter((item: any) => item.desktopOnly !== false);
      }
      return this.currentMenuItems.filter((item: any) => !item.desktopOnly);
    }
  },
  mounted() {
    this.mediaQueryList = window.matchMedia('(max-width: 768px)');
    this.isMobile = this.mediaQueryList.matches;
    this.mediaQueryList.addEventListener('change', this.handleMediaQueryChange);
  },
  beforeUnmount() {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleMediaQueryChange);
    }
  },
  methods: {
    handleMediaQueryChange(event: MediaQueryListEvent) {
      this.isMobile = event.matches;
    },
    saveProject() {
      window.dispatchEvent(new CustomEvent('save-project'));
    },
    async saveAs() {
      if (isDesktop.value) {
        const fileTypes = ['Pencode Projects (*.pencode)'];
        const filePath = await window.pywebview!.api.show_save_as_dialog('Untitled.pencode', fileTypes);
        if (filePath) {
          window.dispatchEvent(new CustomEvent('save-project-as', { detail: { filePath } }));
        }
      }
    },
    exportProject() {
      window.dispatchEvent(new CustomEvent('export-project'));
    },
    exportImage() {
      window.dispatchEvent(new CustomEvent('export-image'));
    },
    closeProject() {
      this.$router.push('/');
    },
    openProject() {
      console.log('"Open Project" clicked');
    },
    help() {
      console.log('"Help" clicked');
    },
    about() {
      window.dispatchEvent(new CustomEvent('open-about-dialog'));
    },
    quit() {
      if (isDesktop.value) {
        window.pywebview!.api.quit_app();
      } else {
        console.log('"Quit" clicked (only functional in desktop app)');
      }
    },
  },
};
</script>