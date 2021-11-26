let savesContainer = document.querySelector("#saves");

// Putting this in a function to be able to call it from other popup scripts
async function populateSaves() {
  let {saves} = await browser.storage.local.get("saves");
  savesContainer.querySelectorAll("*").forEach(child => child.remove());
  for(let i = 0; i < saves.length; i++) {
    savesContainer.insertAdjacentHTML("beforeend",
      `<div class="save">
        <img src="/images/save.png" class="save-btn" />
        <span class="load-btn">${saves[i].name}</span>
        <img src="/images/trash.png" class="trash-btn" />
      </div>`
    );

    let saveButton = savesContainer.childNodes[i].querySelector(".save-btn");
    saveButton.addEventListener("click", () => {
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.sendMessage(tabs[0].id, {type: "save", saveIndex: i});
      });
    });

    let loadButton = savesContainer.childNodes[i].querySelector(".load-btn");
    loadButton.addEventListener("click", () => {
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.sendMessage(tabs[0].id, {type: "load", saveIndex: i});
      });
    });
  }
}
populateSaves();