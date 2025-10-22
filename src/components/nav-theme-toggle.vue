<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <ModeToggle />
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<script>
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import ModeToggle from './mode-toggle.vue'

export default {
  name: 'NavThemeToggle',
  components: {
    SidebarMenu,
    SidebarMenuItem,
    ModeToggle,
  },
}
</script>