import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

var firebaseConfig = {
    apiKey: "AIzaSyCrIEOsT0nuPRd_FyPk5iAVeLfQv7iMCl8",
    authDomain: "pissina-70320.firebaseapp.com",
    projectId: "pissina-70320",
    storageBucket: "pissina-70320.appspot.com",
    messagingSenderId: "918749722083",
    appId: "1:918749722083:web:4c9ce3908dc0baee241cd6",
    measurementId: "G-X1LHYG3RLC"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
// firebase.analytics();
const timestamp = firebase.firestore.FieldValue.serverTimestamp();

export {timestamp};
export default firebaseApp.firestore();