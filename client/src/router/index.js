import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 懒加载路由
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const CSSnippetDetail = () => import('../views/CSSnippetDetail.vue')
const CSSnippetEdit = () => import('../views/CSSnippetEdit.vue')
const Search = () => import('../views/Search.vue')
const Profile = () => import('../views/Profile.vue')
const Tags = () => import('../views/Tags.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/cssnippet/:id',
    name: 'CSSnippetDetail',
    component: CSSnippetDetail,
    props: true
  },
  {
    path: '/cssnippet/new',
    name: 'CSSnippetCreate',
    component: CSSnippetEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    redirect: '/cssnippet/new',
    meta: { requiresAuth: true }
  },
  {
    path: '/cssnippet/:id/edit',
    name: 'CSSnippetEdit',
    component: CSSnippetEdit,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/tag/:name',
    name: 'Tag',
    component: Tags,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = !!userStore.user
  
  // 需要认证的页面
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // 需要游客身份的页面
  else if (to.meta.requiresGuest && isAuthenticated) {
    next('/')
  }
  else {
    next()
  }
})

export default router