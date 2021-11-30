let savesContainer = document.querySelector("#saves");

async function populateSaves() {
  let {saves} = await browser.storage.local.get("saves");
  savesContainer.querySelectorAll("*").forEach(child => child.remove());
  for(let i = 0; i < saves.length; i++) {
    // Add HTML nodes
    savesContainer.insertAdjacentHTML("beforeend",
      `<div class="save">
        <img src="/images/save.png" class="save-btn" />
        <span class="load-btn">${saves[i].name}</span>
        <img src="/images/trash.png" class="remove-btn" />
      </div>`
    );
    // Add click listeners
    let saveButton = savesContainer.childNodes[i].querySelector(".save-btn");
    saveButton.addEventListener("click", async () => {
      let tabs = await browser.tabs.query({active: true, currentWindow: true});
      browser.tabs.sendMessage(tabs[0].id, {type: "save", saveIndex: i});
    });

    let loadButton = savesContainer.childNodes[i].querySelector(".load-btn");
    loadButton.addEventListener("click", async () => {
      await browser.tabs.create({ url: saves[i].url });
      let tabs = await browser.tabs.query({active: true, currentWindow: true});
      await browser.tabs.executeScript(tabs[0].id, { file: "/content/loadSave.js" });
      browser.tabs.sendMessage(tabs[0].id, {type: "load", saveIndex: i});
    });
    
    let removeButton = savesContainer.childNodes[i].querySelector(".remove-btn");
    removeButton.addEventListener("click", () => {
      let newSaves = saves.filter((save, index) => index !== i);
      browser.storage.local.set({saves: newSaves});
      savesContainer.childNodes[i].remove();
    });
  }
}
populateSaves();