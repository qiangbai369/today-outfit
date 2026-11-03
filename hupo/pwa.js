'use strict';
(() => {
  if (!('serviceWorker' in navigator)) return;
  const status = document.getElementById('pwa-status');
  const action = document.getElementById('pwa-action');
  let registration, actionType, refreshing = false, lastCheck = 0;
  let hasController = !!navigator.serviceWorker.controller;
  function offer(type, label) {
    actionType = type; action.textContent = label; action.hidden = false; action.disabled = false;
  }
  function installed(worker) {
    if (registration?.waiting && registration.active) {
      offer('update', '更新'); status.textContent = '新版本已准备好';
    } else if (worker?.state === 'activated' || registration?.active) {
      document.documentElement.dataset.offlineReady = 'true';
      status.textContent = '已可离线使用';
      action.hidden = true; actionType = null;
    }
  }
  function observe(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'activated') installed(worker);
      if (worker.state === 'redundant' && !registration.waiting) {
        status.textContent = '离线准备未完成'; offer('retry', '重试离线准备');
      }
    });
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasController && !refreshing) { refreshing = true; location.reload(); }
    else { hasController = true; installed(navigator.serviceWorker.controller); }
  });
  async function check() {
    if (!registration || !navigator.onLine || Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    try { await registration.update(); if (registration.waiting) installed(); } catch { /* Keep the current offline version. */ }
  }
  action.addEventListener('click', async () => {
    if (actionType === 'update' && registration?.waiting) {
      action.disabled = true; registration.waiting.postMessage({type:'ACTIVATE_UPDATE'}); return;
    }
    action.hidden = true; status.textContent = '正在准备离线使用';
    try { if (registration) await registration.update(); else await register(); }
    catch { offer('retry','重试离线准备'); }
  });
  async function register() {
    try {
      registration = await navigator.serviceWorker.register('sw.js', {scope:'./',updateViaCache:'none'});
      registration.addEventListener('updatefound', () => observe(registration.installing));
      observe(registration.installing); installed(registration.active);
      navigator.serviceWorker.ready.then(() => installed()).catch(() => {});
    } catch { status.textContent = '离线准备未完成'; offer('retry','重试离线准备'); }
  }
  window.addEventListener('online', () => { lastCheck = 0; check(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  if (document.readyState === 'complete') register(); else window.addEventListener('load', register, {once:true});
})();
