import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import mitt from 'mitt'
import './index.css'
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
  
  app.use(router).use(store).mount('#app')
