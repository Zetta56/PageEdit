browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({editing: false});
})