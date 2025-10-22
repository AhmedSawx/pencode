import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Workspace from '../pages/Workspace.vue'
import Settings from '../pages/Settings.vue'
import BrushEditor from '../pages/BrushEditor.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/project/:id',
    name: 'Workspace',
    component: Workspace,
  },
  {
    path: '/project/:id/brush/:brushName',
    name: 'BrushEditor',
    component: BrushEditor,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
