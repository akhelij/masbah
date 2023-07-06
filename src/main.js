import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import mitt from 'mitt';
import vueSocialSharing from 'vue-social-sharing';
import vueHotjar from 'vue-hotjar-next';
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";
import './index.css';
import 'mosha-vue-toastify/dist/style.css';
  const app = createApp(App)

  // Components Auto Importation
  const components = import.meta.globEager('./components/*.vue') 

  Object.entries(components).forEach(([path, definition]) => {
    // Get name of component, based on filename
    // "./components/Fruits.vue" will become "Fruits"
    const componentName = path.split('/').pop().replace(/\.\w+$/, '')
  
    // Register component on this Vue instance
    app.component(componentName, definition.default)
  })

  Sentry.init({
    app,
    dsn: "https://175024e18e094cd0be54d98c39ee12ea@o962067.ingest.sentry.io/5910565",
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["localhost", "95.179.219.122", "pissina.vercel.app", "pissina.com", /^\//],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
 
  app.use(vueHotjar, {
    id: 2556594,
    isProduction: true,
    snippetVersion: 6
  });

  const clickOutSide = {
    beforeMount: (el, binding) => {
      el.clickOutsideEvent = event => {
        // here I check that click was outside the el and his children
        if (!(el == event.target || el.contains(event.target))) {
          // and if it did, call method provided in attribute value
          binding.value();
        }
      };
      document.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted: el => {
      document.removeEventListener("click", el.clickOutsideEvent);
    },
  };
  app.directive('click-outside', clickOutSide);
  
  // Vue EVENT BUS with mitt
  const emitter = mitt()
  app.provide('$emitter', emitter)
  
  app.use(vueSocialSharing).use(router).use(store).mount('#app')