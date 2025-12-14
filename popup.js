// Popup script for Date Highlighter settings

const globalToggle = document.getElementById('globalToggle');
const highlightToggle = document.getElementById('highlightToggle');
const iconPosition = document.getElementById('iconPosition');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['enabled', 'highlightEnabled', 'iconPosition'], (result) => {
  const enabled = result.enabled !== false; // Default to true
  const highlightEnabled = result.highlightEnabled !== false; // Default to true
  const position = result.iconPosition || 'after'; // Default to after

  globalToggle.checked = enabled;
  highlightToggle.checked = highlightEnabled;
  iconPosition.value = position;
  updateStatus(enabled);
});

// Handle global toggle change
globalToggle.addEventListener('change', async () => {
  const enabled = globalToggle.checked;
  await chrome.storage.sync.set({ enabled });
  updateStatus(enabled);
  notifyContentScript({ action: 'toggle', enabled });
});

// Handle highlight toggle change
highlightToggle.addEventListener('change', async () => {
  const highlightEnabled = highlightToggle.checked;
  await chrome.storage.sync.set({ highlightEnabled });
  notifyContentScript({ action: 'updateSettings', highlightEnabled });
});

// Handle icon position change
iconPosition.addEventListener('change', async () => {
  const position = iconPosition.value;
  await chrome.storage.sync.set({ iconPosition: position });
  notifyContentScript({ action: 'updateSettings', iconPosition: position });
});

async function notifyContentScript(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Tab might not have content script loaded
    });
  }
}

function updateStatus(enabled) {
  status.textContent = enabled ? 'Enabled on this page' : 'Disabled';
  status.style.color = enabled ? '#4CAF50' : '#999';
}
