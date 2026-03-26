// Immailer - Background Service Worker
const API_BASE = "https://immailer.onrender.com";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_EVENTS") {
    fetchEvents(msg.token).then(sendResponse);
    return true; // keep channel open for async
  }
  if (msg.type === "GET_ALL_EVENTS") {
    fetchAllEvents().then(sendResponse);
    return true;
  }
  if (msg.type === "SAVE_EMAIL") {
    saveEmailMeta(msg.data).then(sendResponse);
    return true;
  }
});

async function fetchEvents(token) {
  try {
    const key = await getApiKey();
    const r = await fetch(`${API_BASE}/events/${token}`, {
      headers: { "api-key": key }
    });
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchAllEvents() {
  try {
    const key = await getApiKey();
    const r = await fetch(`${API_BASE}/events`, {
      headers: { "api-key": key }
    });
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function saveEmailMeta(data) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["tracked_emails"], (result) => {
      const emails = result.tracked_emails || [];
      emails.unshift({ ...data, saved_at: new Date().toISOString() });
      chrome.storage.local.set({ tracked_emails: emails }, () => resolve({ ok: true }));
    });
  });
}

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["api_key"], (r) => resolve(r.api_key || ""));
  });
}
