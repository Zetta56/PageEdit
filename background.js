browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    editingTabs: [],
    saves: []
  });
});

browser.runtime.onMessage.addListener(async (message) => {
  if(message.type === "unload") {
    console.log("a")
    const {editingTabs} = await browser.storage.local.get("editingTabs");
    const newEditingTabs = editingTabs.filter(id => id !== tabs[0].id);
    browser.storage.local.set({editingTabs: newEditingTabs});
  }
})