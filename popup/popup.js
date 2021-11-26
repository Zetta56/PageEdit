// Get references
let editButton = document.querySelector("#edit-btn");
let saves = document.querySelectorAll(".save");
let newSaveButton = document.querySelector(".new-save-btn");

function toggleSaveButtons(toggle) {
  // Converting to array to gain access to 'map' function
  let saveButtons = Array.from(document.querySelectorAll(".save-btn"));
  if(toggle) {
    saveButtons.map(button => button.classList.remove("disabled"));
    newSaveButton.classList.remove("disabled");
  } else {
    saveButtons.map(button => button.classList.add("disabled"));
    newSaveButton.classList.add("disabled");
  }
}

async function loadState() {
  let {editing} = await browser.storage.local.get("editing");
  if(editing) {
    editButton.src = "/images/edit-active.png";
    let tabs = await browser.tabs.query({active: true, currentWindow: true});
    let history = await browser.tabs.sendMessage(tabs[0].id, {type: "getHistory"});
    toggleSaveButtons(history.length > 0);
  } else {
    toggleSaveButtons(false);
  }
}
loadState();

// Add event listeners
newSaveButton.addEventListener("click", () => {
  browser.tabs.query({active: true, currentWindow: true}, tabs => {
    browser.tabs.sendMessage(tabs[0].id, {type: "save", saveIndex: -1});
  });
});
editButton.addEventListener("click", async () => {
  let {editing} = await browser.storage.local.get("editing");
  let tabs = await browser.tabs.query({active: true, currentWindow: true});
  if(!editing) {
    editButton.src = "/images/edit-active.png";
    browser.tabs.executeScript({file: "/content/content.js"});
    browser.tabs.insertCSS({file: "/content/content.css"});
  } else {
    editButton.src = "/images/edit-inactive.png";
    browser.tabs.sendMessage(tabs[0].id, {type: "cleanup"});
    browser.tabs.removeCSS(tabs[0].id, {file: "/content/content.css"});
    toggleSaveButtons(false);
  }
  browser.storage.local.set({editing: !editing});
});

browser.runtime.onMessage.addListener(async (message) => {
  if(message.type === "save") {
    const {saves} = await browser.storage.local.get("saves");
    if(message.saveIndex === -1) {
      saves.push({ name: "placeholder", changes: message.changes });
    } else {
      saves[message.saveIndex] = { name: "placeholder", changes: message.changes };
    }
    await browser.storage.local.set({saves: [...saves]})
    await populateSaves();
    loadState();
  }
});