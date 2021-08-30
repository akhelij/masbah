import 'firebase/auth'
import db from '@/firebase/firebaseInit'

const announcementsCollection = db.collection('announcements');

export default {
    state: {      
      announcements: [],
      my_announcements: [],
      announcement: "",
    },

    getters: {
      getAnnouncement(state){
        return state.announcement;
      },
      getAnnouncements(state){
        
        return state.announcements;
      },
      getMyAnnouncements(state){
        return state.my_announcements;
      },
    },

    mutations: {
      SET_ANNOUNCEMENT(state, payload){
        state.announcement = payload;
      },
      PUSH_NEW_ANNOUNCEMENTS(state, payload){
        
          state.my_announcements.push(payload);
          if(payload.media != null && Object.keys(payload.media).length >0) 
          {
            state.announcements.push(payload);
          }
        
      },
      UPDATE_ANNOUNCEMENTS(state, payload){
       
          let tmp = state.my_announcements.map((announcement) => (announcement.id == payload.id) ? payload : announcement);
          state.my_announcements = tmp;
          if(payload.media != null && Object.keys(payload.media).length >0)
          {
            tmp = state.announcements.map((announcement) => (announcement.id == payload.id) ? payload : announcement);
            state.announcements = tmp;
          }
        
      },      
      REMOVE_ANNOUNCEMENT(state, payload){
        let index = state.announcements.map((announcement,index) => {if(announcement.id === payload.id) return index});
        state.announcements.splice(index, 1);

        index = state.my_announcements.map((announcement,index) => {if(announcement.id === payload.id) return index});
        state.my_announcements.splice(index, 1);
      },
      UPDATED_ANNOUNCEMENT_STATUS(state, payload){

        if(payload.publish){
          let index = state.announcements.map((announcement,index) => {if(announcement.id === payload.id) return index});
          state.announcements.splice(index, 1);
        }else{
          state.announcements.push(payload);
        }

      },
      SET_ANNOUNCEMENTS(state, payload){
        state.announcements = payload;
      },
      SET_MY_ANNOUNCEMENTS(state, payload){
        state.my_announcements = payload;
      },
    },

    actions: {
      getAnnouncementByIdAction({ commit }, id){
          return new Promise((resolve, reject) => {
              announcementsCollection.doc(id)
              .get()  
              .then((announcement) => {
                if(announcement.exists){
                  commit('SET_ANNOUNCEMENT', { id: announcement.id, ...announcement.data() });
                  resolve({success: true, data: announcement.data()});
                }else{
                  resolve({success: false, data: "Annonce non disponible"});
                }
              })
              .catch((error) => {
                reject({success: false, data: error.message});
              }); 
          });
      },
      fetchAnnouncementsAction({ commit }){ 
        announcementsCollection
        .where("published","==",true)
        .orderBy("created_at")
        .get()
        .then( (snapshot) => {  
            let announcements = [];
            snapshot.forEach((doc) => {
              announcements.push({ id: doc.id, ...doc.data() });
          });                
          commit('SET_ANNOUNCEMENTS', announcements);        
        }); 
      },
      fetchMyAnnouncementsAction({ commit },id){
        announcementsCollection.where("user_id","==",id).get().then((snapshot) => {        
          let announcements = [];
          snapshot.forEach((doc) => {
            announcements.push({ id: doc.id, ...doc.data() });          
          });              
          commit('SET_MY_ANNOUNCEMENTS', announcements);
        });     
      },
      createAnnouncementAction({ commit }, announcement){            
        return new Promise((resolve, reject) => {
          announcementsCollection
          .add(announcement)
          .then((response) => {
            commit('PUSH_NEW_ANNOUNCEMENTS', {id: response.id, ...announcement});
            resolve({success: true, data: response});
          })
          .catch((error) => reject({success: false, data: error.message}));
        });
      },
      setAnnouncementAction({ commit }, announcement){                  
        commit('SET_ANNOUNCEMENT', announcement);
      },
      updateAnnouncementAction({ commit }, announcement){
        return new Promise((resolve, reject) => {
           announcementsCollection
          .doc(announcement.id)
          .update(announcement)
          .then((response) =>{ 
            commit('UPDATE_ANNOUNCEMENTS', {id: announcement.id, ...announcement}, true);         
            resolve({success: true, data: response})
          })
          .catch((error) => {
            reject({success: false, data: error.message})});
        });
      },
      changeAnnouncementStatusAction({ commit }, announcement){
        return new Promise((resolve, reject) => {
          announcementsCollection.doc(announcement.id)
          .update({published: announcement.published})
          .then((response) =>{
            commit('UPDATED_ANNOUNCEMENT_STATUS', {id: announcement.id, ...announcement});
            resolve({success: true, data: response})
          })
          .catch((error) => reject({success: false, data: error.message}));
        });
      },
      deleteAnnouncementAction({ commit }, announcement){
        return new Promise((resolve, reject) => {
          announcementsCollection.doc(announcement.id).delete()
          .then((response) =>{
            commit('REMOVE_ANNOUNCEMENT', {id: announcement.id, ...announcement});
            resolve({success: true, data: response})
          })
          .catch((error) => reject({success: false, data: error.message}));
        });
      },
      filterAnnoucementsByCity({ commit }, city){  
        let query = announcementsCollection.where("published","==",true)
        query = query.where("city.name", '==', city);
        return new Promise((resolve, reject) => {
          query.get()
          .then((snapshot) => { 
            let announcements = [];
            if(snapshot.empty){  
              resolve({success: false, empty: true})
            }else{
              snapshot.forEach((doc) => {
                announcements.push({ id: doc.id, ...doc.data() });  
              });    
              
              resolve({success: true, empty: false})
            } 
            commit('SET_ANNOUNCEMENTS', announcements);         
          }).catch(error => reject({success: false, data: error.message}));   
        });
      },
    }

}