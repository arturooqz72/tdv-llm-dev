/* firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCYWEhFZc2GLqz2v56gKGzpGGltf9PLsqE",
  authDomain: "tdv-chat.firebaseapp.com",
  projectId: "tdv-chat",
  storageBucket: "tdv-chat.firebasestorage.app",
  messagingSenderId: "425165506142",
  appId: "1:425165506142:web:c89df5c636771757f996cf"
});

const messaging = firebase.messaging();

/* 🔔 Notificaciones en segundo plano */
messaging.onBackgroundMessage((payload) => {
  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "TEAM DESVELADOS LLDM";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "Tienes una notificación.";

  const icon =
    payload?.notification?.icon ||
    payload?.data?.icon ||
    "/pwa-192x192.png";

  const url =
    payload?.data?.url ||
    payload?.data?.click_action ||
    "/";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/pwa-192x192.png",
    data: { url },
    tag: "tdv-notification",
    renotify: true
  });
});

/* 👆 Cuando el usuario toca la notificación */
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
