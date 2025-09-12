import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { ObserveVisibility } from "vue-observe-visibility";

const app = createApp(App);
app.directive("observe-visibility", ObserveVisibility);
app.mount("#app");
