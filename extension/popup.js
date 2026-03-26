const $ = id => document.getElementById(id);

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $(`panel-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "emails") loadEmails();
  });
});

// Back button
$("back-btn").addEventListener("click", () => {
  $("panel-detail").classList.remove("active");
  $("panel-emails").classList.add("active");
});

// Load local tracked emails
function loadEmails() {
  chrome.storage.local.get(["tracked_emails"], ({ tracked_emails = [] }) => {
    const list = $("emails-list");
    if (!tracked_emails.length) {
      list.innerHTML = `<div class="empty">No tracked emails yet.<br>Compose in Gmail to start.</div>`;
      return;
    }
    list.innerHTML = tracked_emails.map((e, i) => `
      <div class="email-row" data-token="${e.token}" data-index="${i}">
        <div class="email-subject">${e.subject || "(no subject)"}</div>
        <div class="email-meta">
          To: ${e.recipient || "unknown"} &nbsp;·&nbsp;
          ${new Date(e.sent_at).toLocaleDateString()}
          <span class="badge pending" id="badge-${e.token}">checking...</span>
        </div>
      </div>
    `).join("");

    // Fetch open counts for each token
    tracked_emails.forEach(e => {
      chrome.runtime.sendMessage({ type: "GET_EVENTS", token: e.token }, (res) => {
        const badge = document.getElementById(`badge-${e.token}`);
        if (!badge) return;
        const count = res?.opens?.length || 0;
        if (count > 0) {
          badge.textContent = `${count} open${count > 1 ? "s" : ""}`;
          badge.className = "badge opened";
        } else {
          badge.textContent = "not opened";
          badge.className = "badge pending";
        }
      });
    });

    // Click to view detail
    list.querySelectorAll(".email-row").forEach(row => {
      row.addEventListener("click", () => showDetail(row.dataset.token, tracked_emails));
    });
  });
}

function showDetail(token, emails) {
  const email = emails.find(e => e.token === token);
  $("panel-emails").classList.remove("active");
  $("panel-detail").classList.add("active");

  $("detail-content").innerHTML = `
    <div style="font-size:13px;font-weight:500;margin-bottom:4px;">${email?.subject || "(no subject)"}</div>
    <div style="font-size:11px;color:#6b7280;margin-bottom:12px;">To: ${email?.recipient || "unknown"}</div>
    <div style="font-size:12px;font-weight:500;margin-bottom:8px;color:#374151;">Open history</div>
    <div id="events-list"><div class="empty">Loading...</div></div>
  `;

  chrome.runtime.sendMessage({ type: "GET_EVENTS", token }, (res) => {
    const events = res?.opens || [];
    const list = $("events-list");
    if (!events.length) {
      list.innerHTML = `<div class="empty">Not opened yet.</div>`;
      return;
    }
    list.innerHTML = events.map(ev => `
      <div class="event-row">
        <div class="event-loc">
          ${ev.city ? ev.city + ", " : ""}${ev.country || "Unknown location"}
          ${ev.isp ? `<span style="color:#9ca3af">· ${ev.isp}</span>` : ""}
        </div>
        <div class="event-time">${new Date(ev.opened_at).toLocaleString()}</div>
        <div style="font-size:10px;color:#d1d5db;margin-top:2px;word-break:break-all;">${ev.user_agent?.slice(0,60) || ""}</div>
      </div>
    `).join("");
  });
}

// Settings
chrome.storage.local.get(["api_key", "server_url"], ({ api_key, server_url }) => {
  if (api_key) $("api-key-input").value = api_key;
  if (server_url) $("server-url-input").value = server_url;
});

$("save-settings").addEventListener("click", () => {
  const key = $("api-key-input").value.trim();
  const url = $("server-url-input").value.trim();
  chrome.storage.local.set({ api_key: key, server_url: url }, () => {
    $("save-settings").textContent = "Saved ✓";
    setTimeout(() => { $("save-settings").textContent = "Save Settings"; }, 2000);
  });
});

// Init
loadEmails();
