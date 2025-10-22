<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader>
      <AppMenu />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
    </SidebarContent>
    <SidebarFooter>
      <NavThemeToggle />
    </SidebarFooter>
  </Sidebar>
</template>

<script>
import {
  Home,
  Settings2,
} from 'lucide-vue-next';
import NavMain from '@/components/nav-main.vue';
import AppMenu from '@/components/app-menu.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import NavThemeToggle from '@/components/nav-theme-toggle.vue';

export default {
  name: 'AppSidebar',
  components: {
    NavMain,
    AppMenu,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    NavThemeToggle,
  },
  data() {
    return {
      navMain: [
        {
          title: 'Home',
          url: '/',
          icon: Home,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings2,
        },
      ],
    };
  },
};
</script>