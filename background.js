browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    editingTabs: [],
    saves: []
  });
});

browser.runtime.onMessage.addListener(async (message) => {
  if(message.type === "unload") {
    const {editingTabs} = await browser.storage.local.get("editingTabs");
    let tabs = await browser.tabs.query({active: true, currentWindow: true});
    const newEditingTabs = editingTabs.filter(id => id !== tabs[0].id);
    browser.storage.local.set({editingTabs: newEditingTabs});
  }
})