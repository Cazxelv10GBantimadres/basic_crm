// firebase-config.js

// Inicializa Firebase con la sintaxis compat
const firebaseConfig = {
  apiKey: "AIzaSyD7lqpNx4SKzL0dDoeqCRYW70mekBar4Ls",
  authDomain: "boda-colo-colo.firebaseapp.com",
  databaseURL: "https://boda-colo-colo-default-rtdb.firebaseio.com",
  projectId: "boda-colo-colo",
  storageBucket: "boda-colo-colo.firebasestorage.app",
  messagingSenderId: "549613787959",
  appId: "1:549613787959:web:b794ed34921149065758b2",
  measurementId: "G-E9RKHXYDYC"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);

// Accesos globales
const auth = firebase.auth();
const db = firebase.firestore();
