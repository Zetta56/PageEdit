import { populateSaves } from "/src/popup/populate.js";

let editButton = document.querySelector("#edit-btn");
let showFormButton = document.querySelector(".show-form-btn");
let createForm = document.querySelector(".create-form");
let backButton = document.querySelector(".back-btn");
let nameInput = document.querySelector(".name-input");
let createButton = document.querySelector(".create-btn");

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
    showFormButton.classList.remove("disabled");
  } else {
    saveButtons.map(button => button.classList.add("disabled"));
    showFormButton.classList.add("disabled");
  }
}

async function toggleEditor() {
  let {editingTabs} = await browser.storage.local.get("editingTabs");
  let tabs = await browser.tabs.query({active: true, currentWindow: true});
  if(!editingTabs.includes(tabs[0].id)) {
    editButton.src = "/images/edit-active.png";
    browser.tabs.sendMessage(tabs[0].id, {type: "initialize"});
    browser.tabs.insertCSS({file: "/src/content/content.css"});
    browser.storage.local.set({editingTabs: [...editingTabs, tabs[0].id]});
  } else {
    editButton.src = "/images/edit-inactive.png";
    browser.tabs.sendMessage(tabs[0].id, {type: "cleanup"});
    browser.tabs.removeCSS(tabs[0].id, {file: "/src/content/content.css"});
    browser.storage.local.set({editingTabs: editingTabs.filter(id => id !== tabs[0].id)});
    toggleSaveButtons(false);
  }
}

function toggleCreateForm(toggle) {
  if(toggle) {
    showFormButton.style.right = "100vw";
    createForm.style.left = 0;
    createForm.style.opacity = 1;
  } else {
    showFormButton.style.right = 0;
    createForm.style.left = "100vw";
    createForm.style.opacity = 0;
  }
}

async function upsertSave(saveIndex) {
  const {saves} = await browser.storage.local.get("saves");
  const tabs = await browser.tabs.query({active: true, currentWindow: true});
  const changes = await browser.tabs.sendMessage(tabs[0].id, {type: "getChanges"});
  if(saveIndex === -1) {
    saves.push({ name: nameInput.value, changes: changes, url: tabs[0].url });
    nameInput.value = "";
  } else {
    saves[saveIndex] = { name: saves[saveIndex].name, changes: changes, url: tabs[0].url };
  }
  await browser.storage.local.set({saves: saves})
  await populateSaves();
  toggleEditor();
}

// Runners
loadState();
editButton.addEventListener("click", toggleEditor);
showFormButton.addEventListener("click", () => toggleCreateForm(true));
backButton.addEventListener("click", () => toggleCreateForm(false));
createButton.addEventListener("click", () => {
  if(nameInput.value.length > 0) {
    upsertSave(-1);
    toggleCreateForm();
  }
});

export { upsertSave };