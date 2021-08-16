import firebase from 'firebase/app'
import 'firebase/auth'
import db from '@/firebase/firebaseInit'
import {timestamp} from '@/firebase/firebaseInit'

const usersCollection = db.collection('users');

export default {
    state: {      
      user: null
    },

    getters: {
      getUser(state){
          return state.user;
      },
      isAuth(state){
          return !!state.user;
      },
    },

    mutations: {
        SET_USER(state, payload){
          state.user = payload;
        }
    },

    actions: {
      getUserById({ commit }, uid){
        return new Promise((resolve, reject) => {
            usersCollection.doc(uid)
            .get()  
            .then((user) => {
              if(user.exists){
                commit('SET_USER', {id: user.id, ...user.data()});       
                resolve({succes: true, data: user.data()});
              }else{              
                resolve({succes: false, data: "User does not exist"});
              }
            })
            .catch((error) => {
              reject({succes: false, data: error.message});
            }); 
        });
      },
      registerAction({ commit }, payload) 
      {
        return new Promise((resolve, reject) => {
          firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
          .then((response) => 
          {
              usersCollection.doc(response.user.uid)
              .set({
                username: payload.username,
                email: payload.email,
                info: payload.info,                
                created_at: timestamp,
              });
              commit('SET_USER', response.user);
              resolve({success: true, data: response.user});
          })
          .catch((error) => {
            reject({success: false, data: error.message});
          });
        });
      },      
      updateUserAction({ commit, state }, payload) 
      {
        return new Promise((resolve, reject) => {  
              usersCollection.doc(state.user.id)
              .update({
                avatar: payload.avatar,
                username: payload.username,
                email: payload.email,
                updated_at: timestamp,
              }).then((response) => {
                commit('SET_USER', payload);
                resolve({success: true, data: payload});
            })
            .catch((error) => {
                reject({success: false, data: error});
            });
              
         
        });
      },
      signInAction({ commit, dispatch }, payload)
      {            
        return new Promise((resolve, reject) => {
          firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
          .then((response) => {
            dispatch("getUserById", response.user.uid)
              .then((response) => resolve({succes: true, data: response.data}));
          })
          .catch((error) => {
            reject({succes: false, data: error});
          });
        });
      },
      googleAuthAction({ commit, dispatch })
      {
        return new Promise((resolve, reject) => {
          
          let provider = new firebase.auth.GoogleAuthProvider();
          
          firebase.auth().signInWithPopup(provider) // Google authentication
          .then((response) => 
          {
            let user = {
              id: response.user.uid,
              username: response.user.displayName,
              email: response.user.email,
              info: ""
            };
            
            dispatch("getUserById", user.id) // Verify if user exist
            .then((response) => 
            {
              if(!response.success)// Verify user doesn't exist
              {      
                usersCollection // Create new user
                .doc(user.id)
                .set({
                  username: user.username,
                  email: user.email
                })
                .then(() => commit('SET_USER', {id: user.id, ...user.data()}))
                .catch((error) => {                
                  reject({succes: false, data: error});
                });
              }
              resolve({success: true, data: response.user});
            });
          })
          .catch((error) => {                
            reject({succes: false, data: error});
          });        
        });
      },
      logoutAction({ commit }) {
        return new Promise((resolve, reject) => {           
          firebase.auth().signOut()
            .then(() => {
              commit("SET_USER", null);
              resolve({success: true, data: "User logged out !"});
            })
            .catch(error => {
              reject({success: false, data: error.message});
            });
        });
      },
      resetPasswordAction({commit}, email){
        return new Promise((resolve, reject) => {
          firebase.auth().sendPasswordResetEmail(email)
          .then(() => resolve({success: true}))
          .catch((error) => reject({success: false, data: error.message}))
        });
      },
    }

}