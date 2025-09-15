// ✅ Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ✅ Apna Firebase Config yaha paste karo
const firebaseConfig = {
  apiKey: "AIzaSyCjO4JfvZlPW60vDtqhHLwiqQ4YONsR0Yw",
  authDomain: "apniduniya-999.firebaseapp.com",
  projectId: "apniduniya-999",
  storageBucket: "apniduniya-999.appspot.com",
  messagingSenderId: "177190344907",
  appId: "1:177190344907:web:d057ecdc89887322b0634e",
  measurementId: "G-7H74N57WDJ"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");

let mediaRecorder;
let audioChunks = [];

// 📩 Send Text Message
async function sendMessage() {
  const text = messageInput.value;
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text,
    timestamp: Date.now()
  });
  messageInput.value = "";
}

// 📂 File Upload (Image/Video)
function chooseFile() {
  fileInput.click();
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const storageRef = ref(storage, "uploads/" + file.name);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "messages"), {
    fileUrl: url,
    fileType: file.type,
    timestamp: Date.now()
  });
});

// 🎤 Voice Note Recording
function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const fileName = "voice_" + Date.now() + ".webm";
      const storageRef = ref(storage, "uploads/" + fileName);
      await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "messages"), {
        fileUrl: url,
        fileType: "audio/webm",
        timestamp: Date.now()
      });
    });

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5000); // 5 sec recording
  });
}

// 🔄 Realtime Listener
const q = query(collection(db, "messages"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
  messagesDiv.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("message");

    if (data.text) {
      div.textContent = data.text;
    } else if (data.fileUrl) {
      if (data.fileType.startsWith("image/")) {
        div.innerHTML = `<img src="${data.fileUrl}" width="200"/>`;
      } else if (data.fileType.startsWith("video/")) {
        div.innerHTML = `<video src="${data.fileUrl}" width="250" controls></video>`;
      } else if (data.fileType.startsWith("audio/")) {
        div.innerHTML = `<audio controls src="${data.fileUrl}"></audio>`;
      }
    }

    messagesDiv.appendChild(div);
  });
});
