// Get references
let editButton = document.querySelector("#edit-btn");
let newSaveButton = document.querySelector(".new-save-btn");


async function loadState() {
  let {editingTabs} = await browser.storage.local.get("editingTabs");
  let tabs = await browser.tabs.query({active: true, currentWindow: true});
  if(editingTabs.includes(tabs[0].id)) {
    editButton.src = "/images/edit-active.png";
    let historyLength = await browser.tabs.sendMessage(tabs[0].id, {type: "getHistoryLength"});
    toggleSaveButtons(historyLength > 0);
  } else {
    toggleSaveButtons(false);
  }
}

function toggleSaveButtons(toggle) {
  // Querying elements here in case save buttons aren't populated when this file initially runs
  let saveButtons = Array.from(document.querySelectorAll(".save-btn"));
  if(toggle) {
    saveButtons.map(button => button.classList.remove("disabled"));
    newSaveButton.classList.remove("disabled");
  } else {
    saveButtons.map(button => button.classList.add("disabled"));
    newSaveButton.classList.add("disabled");
  }
}

async function toggleEditor() {
  let {editingTabs} = await browser.storage.local.get("editingTabs");
  let tabs = await browser.tabs.query({active: true, currentWindow: true});
  if(!editingTabs.includes(tabs[0].id)) {
    editButton.src = "/images/edit-active.png";
    browser.tabs.sendMessage(tabs[0].id, {type: "initialize"});
    browser.tabs.insertCSS({file: "/content/content.css"});
    browser.storage.local.set({editingTabs: [...editingTabs, tabs[0].id]});
  } else {
    editButton.src = "/images/edit-inactive.png";
    browser.tabs.sendMessage(tabs[0].id, {type: "cleanup"});
    browser.tabs.removeCSS(tabs[0].id, {file: "/content/content.css"});
    browser.storage.local.set({editingTabs: editingTabs.filter(id => id !== tabs[0].id)});
    toggleSaveButtons(false);
  }
}

async function initializeSave() {
  let tabs = await browser.tabs.query({active: true, currentWindow: true});
  browser.tabs.sendMessage(tabs[0].id, {type: "save", saveIndex: -1});
}

async function upsertSave(message) {
  const {saves} = await browser.storage.local.get("saves");
  const newSave = {
    name: "placeholder",
    changes: message.changes,
    url: message.url
  };
  if(message.saveIndex === -1) {
    saves.push(newSave);
  } else {
    saves[message.saveIndex] = newSave;
  }
  await browser.storage.local.set({saves: [...saves]})
  await populateSaves();
  toggleEditor();
}

// Runners
loadState();
editButton.addEventListener("click", toggleEditor);
newSaveButton.addEventListener("click", initializeSave);
browser.runtime.onMessage.addListener(message => {
  if(message.type === "save") {
    upsertSave(message);
  }
});