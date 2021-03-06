// This file will be injected before content.js when loading a save
(function() {
  loadedHistory = [];

  function getElementByDOMIndices(indices) {
    currentNode = document.body;
    for(let index of indices) {
      currentNode = currentNode.children[index];
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

  async function loadChanges(changes) {
    for(let change of changes) {
      let target = getElementByDOMIndices(change.path);
      switch(change.type) {
        case "select":
          target.style.position = "relative";
          applyStyles(target, change.styles);
          break;
        case "delete":
          target.remove();
      }
    }
    loadedHistory = changes;
  }
  
  browser.runtime.onMessage.addListener(message => {
    switch(message.type) {
      case "load":
        loadChanges(message.changes);
        break;
    }
  });
})();