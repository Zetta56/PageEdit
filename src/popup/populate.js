// This file will run before popup.js
import { upsertSave, loadState } from "/src/popup/popup.js";

const savesContainer = document.querySelector("#saves");
const saveTemplate = document.querySelector("#save-template");

async function populateSaves() {
  let {saves} = await browser.storage.local.get("saves");
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
    // Running this only on-click prevents circular function calls to upsertSave
    saveButton.addEventListener("click", () => upsertSave(i));
    loadButton.addEventListener("click", async () => {
      let tab = await browser.tabs.create({ url: saves[i].url });
      await browser.tabs.executeScript(tab.id, { file: "/src/content/loadSave.js" });
      await browser.tabs.sendMessage(tab.id, {type: "load", saveIndex: i});
      window.close();
    });
    removeButton.addEventListener("click", async () => {
      savesContainer.removeChild(savesContainer.childNodes[i]);
      let newSaves = saves.filter((save, index) => index !== i);
      await browser.storage.local.set({saves: newSaves});
      await populateSaves();
      loadState();
    });
  }
}
populateSaves();

export { populateSaves };