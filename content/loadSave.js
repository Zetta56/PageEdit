(function() {
  function getElementByDOMIndices(indices) {
    currentNode = document.body;
    for(let index of indices) {
      currentNode = Array.from(currentNode.children)[index];
    }
    return currentNode;
  }

  function applyStyles(element, styles) {
    for(let property in styles) {
      if(property === "width") {
        element.style.minWidth = styles.width;
        element.style.maxWidth = styles.width;
      }
      if(property === "height") {
        element.style.minHeight = styles.height;
        element.style.maxHeight = styles.height;
      }
      element.style[property] = styles[property];
    }
  }
  
  browser.runtime.onMessage.addListener(async (message) => {
    if(message.type === "load") {
      const {saves} = await browser.storage.local.get("saves")
      for(let change of saves[message.saveIndex].changes) {
        let target = getElementByDOMIndices(change.path);
        target.style.position = "relative";
        applyStyles(target, change.styles);
      }
    }
  });
})();