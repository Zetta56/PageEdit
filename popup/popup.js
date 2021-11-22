// Get popup buttons
let editButton = document.querySelector("#edit");

// Highlight already selected buttons on popup
browser.storage.local.get("editing").then(data => {
  if(data.editing) {
    editButton.classList.add("active");
  }
});

// Execute content script when clicking on a mode
editButton.addEventListener("click", () => {
  browser.storage.local.get("editing").then(data => {
    if(!data.editing) {
      editButton.classList.add("active");
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.executeScript({file: "/content/content.js"});
        browser.tabs.insertCSS({file: "/content/content.css"});
      });
    } else {
      editButton.classList.remove("active");
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.sendMessage(tabs[0].id, "cleanup");
        browser.tabs.removeCSS(tabs[0].id, {file: "/content/content.css"});
      });
    }
    browser.storage.local.set({editing: !data.editing});
  })
});