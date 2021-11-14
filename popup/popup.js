// Get popup buttons
let resizeButton = document.querySelector("#resize");

// Highlight already selected buttons on popup
browser.storage.local.get("editing").then(data => {
  if(data.editing) {
    resizeButton.classList.add("active");
  }
});

// Execute content script when clicking on a mode
resizeButton.addEventListener("click", () => {
  browser.storage.local.get("editing").then(data => {
    if(!data.editing) {
      resizeButton.classList.add("active");
      browser.tabs.executeScript({file: "../content/content.js"});
      browser.tabs.insertCSS({file: "../content/content.css"})
    } else {
      resizeButton.classList.remove("active");
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.sendMessage(tabs[0].id, "cleanup");
        browser.tabs.removeCSS(tabs[0].id, {file: "../content/content.css"});
      });
    }
    browser.storage.local.set({editing: !data.editing});
  })
});