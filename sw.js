importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyAsLQ_4Wsa8L_cc0EK0OzZDixwzl-wn6gI",
  authDomain: "taskflow-1315a.firebaseapp.com",
  projectId: "taskflow-1315a",
  storageBucket: "taskflow-1315a.firebasestorage.app",
  messagingSenderId: "959826771922",
  appId: "1:959826771922:web:6a8dfcf24a48673b5a120b"
});

const messaging = firebase.messaging();

// Background notifications
messaging.onBackgroundMessage(payload => {
  const notificationTitle =
    payload.notification?.title || "TaskFlow Reminder";

  const notificationOptions = {
    body: payload.notification?.body || "You have a task to complete.",
    icon: "./icon.svg",
    badge: "./icon.svg",
    data: {
      url: payload.data?.url || "./"
    }
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Notification click
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clients => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

// Offline caching
const CACHE_NAME = "taskflow-v3";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copy)
          );
        }
        return response;
      });
    }).catch(() => caches.match("./index.html"))
  );
});
