browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({selectedMode: ""});
})