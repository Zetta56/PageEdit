// Get popup buttons
let resizeButton = document.querySelector("#resize");
// Execute content script when clicking on a mode
resizeButton.addEventListener("click", () => {
  browser.tabs.executeScript({file: "content.js"})
});