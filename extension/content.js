// Immailer - Gmail Content Script
const API_BASE = "https://immailer.onrender.com";
const PIXEL_PATH = "/px/";

function generateToken() {
  return "im_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function buildPixelUrl(token) {
  return `${API_BASE}${PIXEL_PATH}${token}`;
}

function injectImmailerBar(composeBox) {
  if (composeBox.querySelector(".immailer-bar")) return;

  const token = generateToken();
  const pixelUrl = buildPixelUrl(token);

  const bar = document.createElement("div");
  bar.className = "immailer-bar";
  bar.style.cssText = `
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; background: #f0faf5;
    border-top: 1px solid #d1e7dd; font-size: 12px;
    font-family: sans-serif; color: #0d6832;
  `;

  const dot = document.createElement("span");
  dot.style.cssText = "width:8px;height:8px;border-radius:50%;background:#1a8a4a;display:inline-block;";

  const label = document.createElement("span");
  label.textContent = "Immailer tracking ON";

  const tokenSpan = document.createElement("span");
  tokenSpan.style.cssText = "margin-left:auto;color:#6c757d;font-size:11px;font-family:monospace;";
  tokenSpan.textContent = token;

  bar.appendChild(dot);
  bar.appendChild(label);
  bar.appendChild(tokenSpan);
  composeBox.appendChild(bar);

  // Store token on compose box for later retrieval
  composeBox.dataset.immailerToken = token;
  composeBox.dataset.immailerPixel = pixelUrl;

  // Hook send button
  hookSendButton(composeBox, token, pixelUrl);
}

function hookSendButton(composeBox, token, pixelUrl) {
  // Watch for send button click within compose
  composeBox.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-tooltip="Send"]') ||
                e.target.closest('[aria-label="Send"]');
    if (!btn) return;

    // Inject pixel into compose body before send
    const body = composeBox.querySelector('[contenteditable="true"][role="textbox"]') ||
                 composeBox.querySelector(".Am.Al.editable");
    if (body) {
      const pixel = document.createElement("img");
      pixel.src = pixelUrl;
      pixel.width = 1;
      pixel.height = 1;
      pixel.style.cssText = "display:block;width:1px;height:1px;opacity:0;position:absolute;";
      pixel.alt = "";
      body.appendChild(pixel);
    }

    // Extract metadata and save
    const subject = composeBox.querySelector('[name="subjectbox"]')?.value || "";
    const to = composeBox.querySelector('[email]')?.getAttribute("email") ||
               composeBox.querySelector('input[name="to"]')?.value || "";

    chrome.runtime.sendMessage({
      type: "SAVE_EMAIL",
      data: { token, subject, recipient: to, platform: "gmail", sent_at: new Date().toISOString() }
    });
  }, true);
}

// Watch DOM for Gmail compose windows
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      // Gmail compose wrapper class
      const compose = node.classList?.contains("nH") ? node :
                      node.querySelector?.(".nH.Hd");
      if (compose) injectImmailerBar(compose);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
