import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import "firebase/analytics";
import "firebase/app-check";

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
firebase.analytics();
const appCheck = firebase.appCheck();
// Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
// key is the counterpart to the secret key you set in the Firebase console.
appCheck.activate(
  '6LfJpAgcAAAAAJdLVgSZXFpnOHpRI8_HgDxKIOLR',

  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  true);
const timestamp = firebase.firestore.FieldValue.serverTimestamp();

export {timestamp};
export default firebaseApp.firestore();