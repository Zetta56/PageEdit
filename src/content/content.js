(function() {
  let resizeDirection;
  let mouseX;
  let mouseY;
  let resizing;
  let moving;
  let selected;
  let history;

  function initialize() {
    resizeDirection = "";
    mouseX = 0;
    mouseY = 0;
    resizing = false;
    moving = false;
    selected = null;
    
    initializeHistory();
    initializeContextMenu();
    initializeCorners();

    document.body.addEventListener("mouseover", highlight);
    document.body.addEventListener("mouseout", removeHighlight);
    document.body.addEventListener("contextmenu", showContextMenu);
    // Setting capture flag to true triggers event listeners from top to
    // bottom in DOM tree (making this trigger before other click listeners)
    document.body.addEventListener("click", selectElement, true);
  }

  function initializeHistory() {
    // Triggered if opening editor again on the same page
    if(history) {
      return;
    }
    // Triggered if the user loaded a save using loadSave.js
    if(typeof loadedHistory !== "undefined") {
      history = loadedHistory;
      loadedHistory = undefined;
      return;
    }
    history = [];
  }

  function initializeContextMenu() {
    // Context Menu Container
    const container = document.createElement("div");
    container.classList.add("edit-context-container", "edit-meta", "hidden");
    document.body.appendChild(container);

    // Context Menu Items
    const items = [
      {name: "delete", label: "Delete", action: deleteSelected},
      {name: "undo", label: "Undo", action: undo},
      {name: "redo", label: "Redo", action: redo}
    ]
    for(let item of items) {
      let itemDiv = document.createElement("div");
      itemDiv.classList.add("edit-context-item", "edit-meta", item.name);
      itemDiv.textContent = item.label;
      itemDiv.addEventListener("click", item.action);
      container.appendChild(itemDiv);
    }
  }

  function initializeCorners() {
    const directions = ["top-left", "top-right", "bottom-left", "bottom-right"];
    for(let direction of directions) {
      let corner = document.createElement("div");
      corner.classList.add(direction, "edit-corner", "edit-meta", "hidden");
      corner.addEventListener("mousedown", startResize);
      document.body.appendChild(corner);
    }
  }

  // Add to a property in selected and return the result in pixels
  function getChangedValue(element, property, change) {
    return (parseInt(getComputedStyle(element)[property]) + change) + "px";
  }

  function getPositioningStyles(element) {
    return {
      top: element.style.top,
      left: element.style.left,
      width: element.style.width,
      height: element.style.height,
      marginBottom: element.style.marginBottom,
      marginRight: element.style.marginRight
    }
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

  function getDOMIndices(element) {
    currentNode = element;
    indices = [];
    // Continue looping until parent is the document body
    while(currentNode.parentNode.tagName !== "HTML") {
      // Get the currentNode's index in relation to its siblings
      index = Array.from(currentNode.parentNode.children).indexOf(currentNode);
      indices.unshift(index);
      currentNode = currentNode.parentNode;
    }
    return indices;
  }

  function hasClass(e, pattern) {
    const className = e.target.getAttribute("class");
    // This will return false if event's target has no classes
    return className ? className.includes(pattern) : false;
  }

  // Highlight hovered elements
  function highlight(e) {
    if(!selected && !hasClass(e, "edit-meta")) {
      e.target.classList.add("edit-selecting");
    }
  }

  // Stop highlighting when user stops hovering over element
  function removeHighlight(e) {
    if(!selected && !hasClass(e, "edit-meta")) {
      e.target.classList.remove("edit-selecting");
    }
  }

  // Show custom context menu at mouse location
  function showContextMenu(e) {
    e.preventDefault();
    const container = document.querySelector(".edit-context-container");
    container.classList.remove("hidden");
    container.style.left = e.x + "px";
    container.style.top = e.y + "px";
    for(let i = 0; i < container.children.length; i++) {
      container.children[i].classList.remove("disabled");
    }

    // Disable (or enable) context items
    if(history.filter(change => !change.undid && !change.fromSave).length <= 1) {
      container.querySelector(".undo").classList.add("disabled");
    }
    if(history.filter(change => change.undid && !change.fromSave).length < 1) {
      container.querySelector(".redo").classList.add("disabled");
    }
    if(!selected) {
      container.querySelector(".delete").classList.add("disabled");
    }
  }

  // Select (or de-select) an element on click
  function selectElement(e) {
    // Super Exclusions with default behaviors that shouldn't be ignored
    if(hasClass(e, "edit-context")) {
      return;
    }
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    // Hide normal right-click context menu
    const context = document.querySelector(".edit-context-container");
    if(!context.classList.contains("hidden")) {
      context.classList.add("hidden");
    }
    // Exclusions that shouldn't be selected
    if(resizing) {
      document.body.removeEventListener("mousemove", resize);
      resizing = false;
      pushHistory("resize");
      return;
    }
    if(moving) {
      document.body.removeEventListener("mousemove", move);
      moving = false;
      pushHistory("move");
      return;
    }
    if(hasClass(e, "edit-meta") || e.target.tagName === "BODY") {
      return;
    }

    // Select the element if it's different
    if(e.target !== selected) {
      // If already selecting an element, deselect it
      if(selected) {
        deselect();
      }
      selected = e.target;
      selected.classList.remove("edit-selecting");
      selected.classList.add("edit-selected");
      selected.style.position = "relative"; // This shouldn't be cleaned up, unlike classes

      // Add corners and mouse listeners
      pushHistory("select");
      positionCorners();
      selected.addEventListener("mousedown", startMove);
      selected.addEventListener("dragstart", preventDefaultDrag);
    // Continue de-selecting element if clicking the same element
    } else {
      deselect();
    }
  }

  function preventDefaultDrag(e) {
    e.preventDefault();
  }

  function deleteSelected(e) {
    if(selected) {
      pushHistory("delete", {path: getDOMIndices(selected)});
      selected.remove();
      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
      selected = null;
    }
  }

  function undo(e) {
    const notUndone = history.filter(change => !change.undid && !change.fromSave);
    if(notUndone.length >= 2) {
      const currentChange = notUndone[notUndone.length - 1];
      switch(currentChange.type) {
        case "resize":
        case "move":
          applyStyles(currentChange.element, notUndone[notUndone.length - 2].styles);
          positionCorners();
          break;
        case "delete":
          let target = document.body;
          for(let i = 0; i < currentChange.path.length; i++) {
            // Target is changed element's parent in the second to last loop
            if(i === currentChange.path.length - 1 && target.childElementCount === 0) {
                target.appendChild(currentChange.element);
            } else if(i === currentChange.path.length - 1) {
              target.insertBefore(currentChange.element, target.children[i]);
            } else {
            // Offsetting by 1 because HTMLCollection indices start from 1 instead of 0
            target = target.children[i + 1];
            }
          }
          // Simulating re-select
          selected = currentChange.element;
          selected.addEventListener("mousedown", startMove);
          selected.addEventListener("dragstart", preventDefaultDrag);
          positionCorners();
          break;
      }
      currentChange.undid = true;
    }
    document.querySelector(".edit-context-container").classList.add("hidden");
  }

  function redo(e) {
    const undone = history.filter(change => change.undid && !change.fromSave);
    if(undone.length > 0) {
      const nextChange = undone[0];
      switch(nextChange.type) {
        case "resize":
        case "move":
          applyStyles(nextChange.element, nextChange.styles);
          positionCorners();
          break;
        case "delete":
          nextChange.element.remove();
          deselect();
          break;
      }
      nextChange.undid = false;
    }
    document.querySelector(".edit-context-container").classList.add("hidden");
  }

  function positionCorners() {
    const rect = selected.getBoundingClientRect();
    const corners = document.querySelectorAll(".edit-corner");
    for(let corner of corners) {
      // Index is 0 because the direction was added first in createCorners()
      let direction = corner.classList[0];
      let vertical = direction.substring(0, direction.indexOf("-"));
      let horizontal = direction.substring(direction.indexOf("-") + 1);
      corner.classList.remove("hidden");
      corner.style.top = (rect[vertical] + window.scrollY - corner.offsetHeight / 2) + "px";
      corner.style.left = (rect[horizontal] + window.scrollX - corner.offsetWidth / 2) + "px";
    }
  }

  function startResize(e) {
    resizeDirection = e.target.classList[0];
    mouseX = e.x;
    mouseY = e.y;
    resizing = true;
    document.body.addEventListener("mousemove", resize);
  }

  function resize(e) {
    // Make sure the user is holding down left-click (value of 1)
    if(e.buttons !== 1) {
      return;
    }
    let styles = {};
    // Change vertical styles
    if(resizeDirection.includes("top") || resizeDirection.includes("bottom")) {
      let changeY = e.y - mouseY;
      mouseY = e.y;
      if(resizeDirection.includes("top")) {
        styles.height = getChangedValue(selected, "height", -changeY);
        // Margin cancels out any missing/added space in document flow resulting from changed height
        styles.marginBottom = getChangedValue(selected, "marginBottom", changeY);
        styles.top = getChangedValue(selected, "top", changeY);
      } else {
        styles.height = getChangedValue(selected, "height", changeY);
        styles.marginBottom = getChangedValue(selected, "marginBottom", -changeY);
      }
    }
    // Change horizontal styles
    if(resizeDirection.includes("left") || resizeDirection.includes("right")) {
      let changeX = e.x - mouseX;
      mouseX = e.x;
      if(resizeDirection.includes("left")) {
        styles.width = getChangedValue(selected, "width", -changeX);
        styles.marginRight = getChangedValue(selected, "marginRight", changeX);
        styles.left = getChangedValue(selected, "left", changeX);
      } else {
        styles.width = getChangedValue(selected, "width", changeX);
        styles.marginRight = getChangedValue(selected, "marginRight", -changeX);
      }
    }
    applyStyles(selected, styles);
    positionCorners();
  }

  // Initialize move variables on left click (value of 1)
  function startMove(e) {
    if(e.button === 0) {
      mouseX = e.x;
      mouseY = e.y;
      document.body.addEventListener("mousemove", move);
    }
  }

  function move(e) {
    if(!moving) {
      moving = true;
    }
    let changeX = e.x - mouseX;
    let changeY = e.y - mouseY;
    mouseX = e.x;
    mouseY = e.y;
    selected.style.left = (parseInt(getComputedStyle(selected).left) + changeX) + "px";
    selected.style.top = (parseInt(getComputedStyle(selected).top) + changeY) + "px";
    positionCorners();
  }

  // Remove drag listeners
  function deselect(e) {
    if(selected) {
      document.body.removeEventListener("mousemove", resize);
      document.body.removeEventListener("mousemove", move);
      selected.removeEventListener("mousedown", startResize);
      selected.removeEventListener("mousedown", startMove);
      selected.removeEventListener("dragstart", preventDefaultDrag);
      document.body.removeEventListener("mouseup", deselect);

      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
      selected.classList.remove("edit-selected");
      selected = null;
    }
  }

  function pushHistory(type, options) {
    if(selected) {
      // Delete all undone chnages
      const latestUndone = history.findIndex(change => change.undid);
      if(latestUndone >= 0) {
        history.splice(latestUndone);
      }
      // Delete consecutive selections from history
      const previousChange = history[history.length - 1];
      if(history.length > 0 && type === "select" && previousChange.type === "select" && !previousChange.fromSave) {
        history.pop();
      }
      history.push({ type: type, element: selected, styles: getPositioningStyles(selected),
        undid: false, ...options });
    }
  }

  function cleanChanges() {
    // Construct changes array that will be stored and loaded from a save
    changes = [];
    for(let change of history) {
      if(change.fromSave) {
        changes.push(change);
        continue;
      // Getting 'select' changes removes bloat from consecutive moves and resizes
      } else if(change.type === "select") {
        try {
          changes.push({
            path: getDOMIndices(change.element),
            styles: getPositioningStyles(change.element),
            type: change.type,
            fromSave: true
          });
        // Catch if element's DOM indices couldn't be obtained, due to element deletion
        } catch(e) {};
      } else if(change.type === "delete") {
        changes.push({ path: change.path, type: change.type, fromSave: true });
      }
    }
    return changes;
  }

  // Clean up event listeners when requested by popup
  function cleanup() {
    if(selected) {
      selected.classList.remove("edit-selecting", "edit-selected");
      deselect();
    }
    document.querySelectorAll(".edit-meta").forEach(el => el.remove());
    document.body.removeEventListener("mouseover", highlight);
    document.body.removeEventListener("mouseout", removeHighlight);
    document.body.removeEventListener("click", selectElement, true);
    document.body.removeEventListener("contextmenu", showContextMenu);
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.type) {
      case "initialize":
        initialize();
        break;
      case "getChanges":
        sendResponse(cleanChanges());
        break;
      case "getHistoryLength":
        const length = history ? history.filter(change => !change.fromSave).length : 0;
        sendResponse(length);
        break;
      case "cleanup":
        cleanup();
        break;
    }
  })

  window.onbeforeunload = e => {
    browser.runtime.sendMessage({type: "unload"});
  }
})()