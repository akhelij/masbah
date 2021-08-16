import { createStore } from "vuex";
import user from './modules/user';
import announcement from './modules/announcement';
import progressbar from './modules/progress-bar';

const store = createStore ({
    modules:{
        announcement,
        user,
        progressbar
    }
});

export default store;