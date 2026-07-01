export function storageGet(key) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          resolve({});
          return;
        }
        resolve(result || {});
      });
    } catch (err) {
      resolve({});
    }
  });
}

export function storageSet(items) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(items, () => {
        resolve(!chrome.runtime.lastError);
      });
    } catch (err) {
      resolve(false);
    }
  });
}
