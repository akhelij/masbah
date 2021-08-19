import { createRouter, createWebHistory } from "vue-router";
import Privacy from '../views/Privacy.vue';
import Terms from '../views/Terms.vue';
import Home from '../views/Home.vue';
import Form from '../views/Announcement/Form.vue';
import Details from '../views/Announcement/Details.vue';
import Profile from '../views/Profile.vue';
import store from '../store'

const routes = [
    {
        path: '/privacy',
        name: 'Privacy',
        component: Privacy,
        meta: {
            title: "Privacy policy"
        }
    },
    {
        path: '/terms',
        name: 'Terms',
        component: Terms,
        meta: {
            title: "Terms and conditions"
        }
    },
    {
        path: '/',
        name: 'Home',
        component: Home,
        props: route => ({ page: parseInt(route.query.page) || 1 }),
        meta: {
            title: "Accueil"
        }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: {
            title: "Profile"
          }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: {
            title: "Profile"
          }
    },
    {
        path: '/announce',
        props:true,
        name: 'CreateAnnouncement',
        component: Form,
        meta: {
            title: "Publier une annonce"
        }
    },
    {
        path: '/announce/:id',
        props:true,
        name: 'UpdateAnnouncement',
        component: Form,
        meta: {
            title: "Publier une annonce"
        }
    },
    {
        path: '/details/:id',
        props:true,
        name: 'Details',
        component: Details,
        meta: {
            title: "Détail de l'annonce"
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    document.title = `Pissina | ${to.meta.title}`;
    
    if (typeof to.matched[0]?.components.default === 'function') {
        store.dispatch('progressbar/start')
    }
    next();
});

router.beforeResolve((to, from, next) => {
    store.dispatch('progressbar/stop')
    next()
})
export default router;