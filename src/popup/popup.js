// Get popup references
const editButton = document.querySelector("#edit-btn");
const showFormButton = document.querySelector(".show-form-btn");
const createForm = document.querySelector(".create-form");
const backButton = document.querySelector(".back-btn");
const nameInput = document.querySelector(".name-input");
const createButton = document.querySelector(".create-btn");
const savesContainer = document.querySelector("#saves");
const saveTemplate = document.querySelector("#save-template");

// Decide whether save buttons and edit button are on/off
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

function populateSaves() {
  browser.storage.local.get("saves").then(({saves}) => {
    savesContainer.querySelectorAll("*").forEach(child => child.remove());
    for(let i = 0; i < saves.length; i++) {
      // Add HTML nodes
      let clone = saveTemplate.content.cloneNode(true);
      let saveButton = clone.querySelector(".save-btn");
      let loadButton = clone.querySelector(".load-btn");
      let removeButton = clone.querySelector(".remove-btn");
      loadButton.textContent = saves[i].name;
      loadButton.title = saves[i].name;
      savesContainer.appendChild(clone);
      
      // Add click listeners
      saveButton.addEventListener("click", () => upsertSave(i));
      loadButton.addEventListener("click", async () => {
        // This entire function will run before content.js is executed on the new tab
        let tab = await browser.tabs.create({ url: saves[i].url });
        await browser.tabs.executeScript(tab.id, { file: "/src/content/loadSave.js" });
        await browser.tabs.sendMessage(tab.id, {type: "load", changes: saves[i].changes});
        window.close();
      });
      removeButton.addEventListener("click", async () => {
        savesContainer.removeChild(savesContainer.childNodes[i]);
        let newSaves = saves.filter((save, index) => index !== i);
        await browser.storage.local.set({saves: newSaves});
        // Reloading saves to update their indices
        populateSaves();
        loadState();
      });
    }
  });
}

function toggleSaveButtons(toggle) {
  // Getting saveButtons in here in case any save has been created since popup load
  const saveButtons = Array.from(document.querySelectorAll(".save-btn"));
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
  populateSaves();
  toggleEditor();
}

// Runners
populateSaves();
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