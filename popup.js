const globalToggle = document.getElementById('globalToggle');
const highlightToggle = document.getElementById('highlightToggle');
const iconPosition = document.getElementById('iconPosition');
const status = document.getElementById('status');

function renderSettings(result = {}) {
  const enabled = result.enabled !== false;
  globalToggle.checked = enabled;
  highlightToggle.checked = result.highlightEnabled !== false;
  iconPosition.value = result.iconPosition === 'before' ? 'before' : 'after';
  status.textContent = enabled ? 'Enabled' : 'Disabled';
  status.style.color = enabled ? '#287a37' : '#666';
}

function saveSetting(setting) {
  chrome.storage.sync.set(setting);
}

chrome.storage.sync.get(['enabled', 'highlightEnabled', 'iconPosition'], renderSettings);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  chrome.storage.sync.get(['enabled', 'highlightEnabled', 'iconPosition'], renderSettings);
});

globalToggle.addEventListener('change', () => {
  saveSetting({ enabled: globalToggle.checked });
});
highlightToggle.addEventListener('change', () => {
  saveSetting({ highlightEnabled: highlightToggle.checked });
});
iconPosition.addEventListener('change', () => {
  saveSetting({ iconPosition: iconPosition.value });
});
