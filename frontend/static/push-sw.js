/* eslint-disable no-undef */

'use strict';

var DEFAULT_TITLE = 'Chhath Puja';
var DEFAULT_ICON = '/icons/icon-192.png';
var DEFAULT_BADGE = '/icons/icon-192.png';

var NOTIF_DB = 'chhath-notifications';
var NOTIF_DB_VERSION = 1;
var NOTIF_STORE = 'items';
var NOTIF_MAX = 50;

function openNotifDb() {
  return new Promise(function (resolve, reject) {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no indexedDB'));
      return;
    }
    var req = indexedDB.open(NOTIF_DB, NOTIF_DB_VERSION);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(NOTIF_STORE)) {
        var store = db.createObjectStore(NOTIF_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('receivedAt', 'receivedAt');
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error || new Error('indexedDB open failed'));
    };
  });
}

function trimNotifications(db) {
  return new Promise(function (resolve) {
    var tx = db.transaction(NOTIF_STORE, 'readwrite');
    var store = tx.objectStore(NOTIF_STORE);
    var countReq = store.count();
    countReq.onsuccess = function () {
      var extra = countReq.result - NOTIF_MAX;
      if (extra <= 0) {
        resolve();
        return;
      }
      var removed = 0;
      var cursorReq = store.openCursor();
      cursorReq.onsuccess = function () {
        var cursor = cursorReq.result;
        if (!cursor || removed >= extra) {
          resolve();
          return;
        }
        cursor.delete();
        removed++;
        cursor.continue();
      };
      cursorReq.onerror = function () {
        resolve();
      };
    };
    countReq.onerror = function () {
      resolve();
    };
  });
}

function saveNotification(item) {
  return openNotifDb()
    .then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(NOTIF_STORE, 'readwrite');
        tx.objectStore(NOTIF_STORE).add(item);
        tx.oncomplete = function () {
          resolve(db);
        };
        tx.onerror = function () {
          reject(tx.error || new Error('inbox write failed'));
        };
        tx.onabort = function () {
          reject(tx.error || new Error('inbox write aborted'));
        };
      });
    })
    .then(function (db) {
      return trimNotifications(db);
    });
}

function notifyPages(type) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (list) {
      for (var i = 0; i < list.length; i++) list[i].postMessage({ type: type });
      return undefined;
    })
    .catch(function () {
      return undefined;
    });
}

self.addEventListener('push', function (event) {
  var payload = {};
  if (event.data) {
    try {
      payload = event.data.json() || {};
    } catch (e) {
      try {
        payload = { body: event.data.text() };
      } catch (e2) {
        payload = {};
      }
    }
  }

  var title = (payload.title || DEFAULT_TITLE).toString();
  var body = (payload.body || '').toString();
  var url = (payload.url || '/').toString();
  var tag = (payload.tag || 'chhath').toString();

  var options = {
    body: body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: tag,
    renotify: false,
    requireInteraction: false,
    data: { url: url }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      saveNotification({
        title: title,
        body: body,
        url: url,
        tag: tag,
        receivedAt: Date.now(),
        read: 0
      })
        .then(function () {
          return notifyPages('push-received');
        })
        .catch(function () {
          return undefined;
        })
    ])
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ('focus' in client) {
            if ('navigate' in client && target && target !== '/') {
              return client.focus().then(function (focused) {
                return focused && focused.navigate ? focused.navigate(target) : focused;
              });
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
        return undefined;
      })
      .catch(function () {
      })
  );
});

var SYNC_TAG = 'chhath-refresh';
var PERIODIC_TAG = 'chhath-periodic-refresh';

function refreshPortalCache() {
  var FALLBACK_API = 'https://chhath-public-worker.shaharpura.com';
  return fetch(FALLBACK_API + '/?action=dataVersion', { cache: 'no-store' })
    .then(function (res) {
      if (!res || !res.ok) return undefined;
      return res.json().catch(function () {
        return null;
      });
    })
    .then(function (v) {
      var q = v && v.v != null ? '&v=' + encodeURIComponent(v.v) : '';
      return fetch(FALLBACK_API + '/?action=portalData' + q);
    })
    .then(function () {
      return undefined;
    })
    .catch(function () {
      return undefined;
    });
}

self.addEventListener('sync', function (event) {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(refreshPortalCache());
});

self.addEventListener('periodicsync', function (event) {
  if (event.tag !== PERIODIC_TAG) return;
  event.waitUntil(refreshPortalCache());
});

self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    (function () {
      var oldSub = event.oldSubscription || null;
      var appServerKey =
        (event.newSubscription && event.newSubscription.options && event.newSubscription.options.applicationServerKey) ||
        (oldSub && oldSub.options && oldSub.options.applicationServerKey) ||
        null;

      var ready = event.newSubscription
        ? Promise.resolve(event.newSubscription)
        : appServerKey
          ? self.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appServerKey
            })
          : Promise.resolve(null);

      return ready
        .then(function (sub) {
          if (!sub) return undefined;
          return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
              list[i].postMessage({ type: 'push-subscription-changed', subscription: sub.toJSON() });
            }
            return undefined;
          });
        })
        .catch(function () {
        });
    })()
  );
});
