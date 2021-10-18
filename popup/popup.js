// Get popup buttons
let resizeButton = document.querySelector("#resize");
resizeButton.addEventListener("click", () => {
  browser.tabs.executeScript({file: "content.js"})
});