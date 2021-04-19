import NotFound from '@/views/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      return { path: '/login' }
    },
  },
  {
    path: '/overview',
    component: () => import('../views/KontoOverview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    component: () => import('../views/Pages/UserProfileCard.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profileedit',
    component: () => import('../views/Pages/UserProfileEdit.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/activity',
    component: () => import('../views/Pages/UserProfileActivity.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/transactions',
    component: () => import('../views/Pages/UserProfileTransactionList.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    component: () => import('../views/Pages/Login.vue'),
  },
  {
    path: '/thx',
    component: () => import('../views/Pages/thx.vue'),
  },
  {
    path: '/register',
    component: () => import('../views/Pages/Register.vue'),
  },
  {
    path: '/password',
    component: () => import('../views/Pages/Password.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
