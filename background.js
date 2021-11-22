browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({editing: false});
});

browser.runtime.onMessage.addListener(message => {
  if(message === "unload") {
    browser.storage.local.set({editing: false});
  }
})