<template>
  <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in items" :key="item.title">
        <TooltipProvider>
          <div v-if="open">
            <SidebarMenuButton as-child v-if="item.title !== 'Home'">
              <router-link :to="item.url">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </router-link>
            </SidebarMenuButton>
            <SidebarMenuButton v-else @click="goToHome">
              <component :is="item.icon" />
              <span>{{ item.title }}</span>
            </SidebarMenuButton>
          </div>
          <Tooltip v-else>
            <TooltipTrigger as-child>
              <SidebarMenuButton as-child v-if="item.title !== 'Home'">
                <router-link :to="item.url">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </router-link>
              </SidebarMenuButton>
              <SidebarMenuButton v-else @click="goToHome">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              {{ item.title }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { navigationState } from '@/services/navigationState';

export interface NavItem {
  title: string;
  url: string;
  icon: any;
}

export default defineComponent({
  name: 'NavMain',
  components: {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  },
  props: {
    items: {
      type: Array as PropType<NavItem[]>,
      required: true,
    },
  },
  setup() {
    const { open } = useSidebar()
    return {
      open,
    }
  },
  methods: {
    goToHome() {
      const activeProjectId = navigationState.activeProjectId;

      if (activeProjectId && this.$route.path !== `/project/${activeProjectId}`) {
        this.$router.push(`/project/${activeProjectId}`);
      } else {
        this.$router.push('/');
      }
    },
  },
});
</script>