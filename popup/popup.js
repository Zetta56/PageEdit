// Get popup buttons
let resizeButton = document.querySelector("#resize");
browser.storage.local.get("selectedMode").then(data => {
  if(data.selectedMode === "resize") {
    resize.classList.add("selected-mode");
  }
});
// Execute content script when clicking on a mode
resizeButton.addEventListener("click", () => {
  browser.storage.local.get("selectedMode").then(data => {
    if(data.selectedMode !== "resize") {
      resizeButton.classList.add("selected-mode");
      browser.storage.local.set({selectedMode: "resize"});
      browser.tabs.executeScript({file: "../content/resize.js"})
    } else {
      resizeButton.classList.remove("selected-mode");
      browser.storage.local.set({selectedMode: ""});
      browser.tabs.query({active: true, currentWindow: true}, tabs => {
        browser.tabs.sendMessage(tabs[0].id, "cleanup");
      })
    }
  })
});