browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    editing: false,
    saves: []
  });
});

browser.runtime.onMessage.addListener(message => {
  if(message.type === "unload") {
    browser.storage.local.set({editing: false});
  }
})