import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { ObserveVisibility } from "vue-observe-visibility";
import { i18n } from "./locales";

const app = createApp(App);

app.use(i18n);
app.directive("observe-visibility", ObserveVisibility);

app.mount("#app");
