// firebase-messaging-sw.js — Service Worker para push em segundo plano
// Precisa estar na RAIZ do site (mesmo nível do index.html)
// v37-11-fix: renderiza notificação mesmo quando vem só "data" (Android/iOS PWA)
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD3mylJEsupQqShsxVDFt47wcMR_n1lRhs",
  authDomain: "retro-station.firebaseapp.com",
  projectId: "retro-station",
  storageBucket: "retro-station.firebasestorage.app",
  messagingSenderId: "860166772194",
  appId: "1:860166772194:web:9a92af1068253fd89fd5bb"
});

const messaging = firebase.messaging();

function showFromPayload(payload){
  const n = payload && payload.notification;
  const d = (payload && payload.data) || {};
  const title = (n && n.title) || d.title || "Retro Station";
  const body  = (n && n.body)  || d.body  || "";
  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: d,
    tag: d.tag || ("retro-" + (d.notifId || Date.now())),
    renotify: true,
    requireInteraction: false
  };
  return self.registration.showNotification(title, options);
}

// Background handler do Firebase (quando vem com bloco "notification")
messaging.onBackgroundMessage((payload) => {
  try { showFromPayload(payload); } catch(e){ console.warn("[sw] onBackgroundMessage err", e); }
});

// Fallback: mensagens push "data-only" não disparam onBackgroundMessage em todos os browsers
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch(_){ payload = { data:{ body: event.data && event.data.text() } }; }
  // Se o Firebase SDK já vai tratar (tem "notification"), evita duplicar
  if (payload && payload.notification) return;
  event.waitUntil(showFromPayload(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window" }).then((list) => {
    for (const c of list){ if (c.url.includes(self.location.origin)){ return c.focus(); } }
    return clients.openWindow("/");
  }));
});

// Atualização imediata do SW quando o arquivo muda
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
