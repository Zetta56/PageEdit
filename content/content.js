(function() {
  let resizeDirection = "";
  let mouseX = 0;
  let mouseY = 0;
  let resizing = false;
  let moving = false;
  let selected = null;
  let history = [];
  initializeContext();
  initializeCorners();

  function initializeContext() {
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
      itemDiv.innerHTML = item.label;
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
  function getChangedValue(propertyName, change) {
    return (parseInt(getComputedStyle(selected)[propertyName]) + change) + "px";
  }

  // Highlight hovered elements
  function highlight(e) {
    if(!selected && !e.target.className.includes("edit-meta")) {
      e.target.classList.add("edit-selecting");
    }
  }
  document.body.addEventListener("mouseover", highlight);

  // Stop highlighting when user stops hovering over element
  function removeHighlight(e) {
    if(!selected && !e.target.className.includes("edit-meta")) {
      e.target.classList.remove("edit-selecting");
    }
  }
  document.body.addEventListener("mouseout", removeHighlight);

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
    const committed = history.filter(change => !change.undid);
    if(committed.length <= 1) {
      container.querySelector(".undo").classList.add("disabled");
    }
    if(history.length <= 1) {
      container.querySelector(".redo").classList.add("disabled");
    }
    if(!selected) {
      container.querySelector(".delete").classList.add("disabled");
    }
  }
  document.body.addEventListener("contextmenu", showContextMenu);

  // Select (or de-select) an element on click
  function selectElement(e) {
    // Super Exclusions with default behaviors that shouldn't be ignored
    if(e.target.className.includes("edit-context")) {
      return;
    }
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    const context = document.querySelector(".edit-context-container");
    if(!context.classList.contains("hidden")) {
      context.classList.add("hidden");
    }
    // Exclusions that shouldn't be selected
    if(resizing) {
      document.body.removeEventListener("mousemove", resize);
      resizing = false;
      saveChanges("resize");
      return;
    }
    if(moving) {
      document.body.removeEventListener("mousemove", move);
      moving = false;
      saveChanges("move");
      return;
    }
    if(e.target.className.includes("edit-meta") || e.target.tagName === "BODY") {
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
      saveChanges("select");
      positionCorners();
      selected.addEventListener("mousedown", startMove);
      selected.addEventListener("dragstart", preventDefaultDrag);
    // Continue de-selecting element if clicking the same element
    } else {
      deselect();
    }
  }
  // Setting capture flag to true triggers event listeners from top to
  // bottom in DOM tree (making this trigger before other click listeners)
  document.body.addEventListener("click", selectElement, true);

  function preventDefaultDrag(e) {
    e.preventDefault();
  }

  function deleteSelected(e) {
    if(selected) {
      saveChanges("delete", { parent: selected.parentNode, sibling: selected.nextSibling });
      selected.remove();
      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
      selected = null;
    }
  }

  function undo(e) {
    const committed = history.filter(change => !change.undid);
    if(committed.length >= 2) {
      const currentChange = committed[committed.length - 1];
      switch(currentChange.type) {
        case "resize":
        case "move":
          const previousRect = committed[committed.length - 2].rect;
          const parentRect = currentChange.element.parentNode.getBoundingClientRect();
          currentChange.element.style.top = (previousRect.top - parentRect.top) + "px";
          currentChange.element.style.left = (previousRect.left - parentRect.left) + "px";
          currentChange.element.style.width = previousRect.width + "px";
          currentChange.element.style.minWidth = previousRect.width + "px";
          currentChange.element.style.maxWidth = previousRect.width + "px";
          currentChange.element.style.height = previousRect.height + "px";
          currentChange.element.style.minHeight = previousRect.height + "px";
          currentChange.element.style.maxHeight = previousRect.height + "px";
          positionCorners();
          break;
        case "delete":
          // Try to re-insert the deleted element in the correct order
          if(currentChange.sibling) {
            currentChange.parent.insertBefore(currentChange.element, currentChange.sibling);
          } else {
            currentChange.parent.appendChild(currentChange.element);
          }
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
    const latestUndone = history.findIndex(change => change.undid);
    if(latestUndone >= 0) {
      const nextChange = history[latestUndone];
      switch(nextChange.type) {
        case "resize":
        case "move":
          const nextRect = nextChange.rect;
          const parentRect = nextChange.element.parentNode.getBoundingClientRect();
          nextChange.element.style.top = (nextRect.top - parentRect.top) + "px";
          nextChange.element.style.left = (nextRect.left - parentRect.left) + "px";
          nextChange.element.style.width = nextRect.width + "px";
          nextChange.element.style.minWidth = nextRect.width + "px";
          nextChange.element.style.maxWidth = nextRect.width + "px";
          nextChange.element.style.height = nextRect.height + "px";
          nextChange.element.style.minHeight = nextRect.height + "px";
          nextChange.element.style.maxHeight = nextRect.height + "px";
          positionCorners();
          break;
        case "delete":
          nextChange.element.remove();
          document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
          selected = null;
          break;
      }
      nextChange.undid = false;
    }
    document.querySelector(".edit-context-container").classList.add("hidden");
  }

  function saveChanges(type, options) {
    if(selected) {
      // Delete all undone chnages
      const latestUndone = history.findIndex(change => change.undid);
      if(latestUndone >= 0) {
        history.splice(latestUndone);
      }
      // Delete consecutive selections from history
      if(history.length > 0 && history[history.length - 1].type === "select" && type === "select") {
        history.pop();
      }
      // Cap history length;
      if(history.length >= 10) {
        history.shift();
      }
      history.push({ type: type, element: selected, rect: selected.getBoundingClientRect(),
        undid: false, ...options });
    }
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

  // Initialize resize variables
  function startResize(e) {
    resizeDirection = e.target.classList[0];
    mouseX = e.x;
    mouseY = e.y;
    resizing = true;
    document.body.addEventListener("mousemove", resize);
  }

  // Resize the selected element
  function resize(e) {
    // Make sure the user is holding down left-click (value of 1)
    if(e.buttons !== 1) {
      return;
    }
    // Vertical sides
    if(resizeDirection.includes("top") || resizeDirection.includes("bottom")) {
      let newHeight;
      let changeY = e.y - mouseY;
      mouseY = e.y;
      // Top: add to top, subtract from height
      if(resizeDirection.includes("top")) {
        newHeight = getChangedValue("height", -changeY);
        selected.style.top = getChangedValue("top", changeY);
        selected.style.marginBottom = -newHeight;
      // Bottom: add to height
      } else {
        newHeight = getChangedValue("height", changeY);
      }
      // Set new heights and mouse position
      selected.style.height = newHeight;
      selected.style.minHeight = newHeight;
      selected.style.maxHeight = newHeight;
    }

    // Horizontal sides
    if(resizeDirection.includes("left") || resizeDirection.includes("right")) {
      let newWidth;
      let changeX = e.x - mouseX;
      mouseX = e.x;
      // Left: add to left, subtract from width
      if(resizeDirection.includes("left")) {
        newWidth = getChangedValue("width", -changeX);
        selected.style.left = getChangedValue("left", changeX);
        selected.style.marginRight = getChangedValue("marginRight", changeX);
      // Right: add to width
      } else {
        newWidth = getChangedValue("width", changeX);
      }
      // Set new widths
      selected.style.width = newWidth;
      selected.style.minWidth = newWidth;
      selected.style.maxWidth = newWidth;
    }
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
    browser.runtime.onMessage.removeListener(cleanup);
  }

  browser.runtime.onMessage.addListener(message => {
    if(message === "cleanup") {
      cleanup();
    }
  })

  window.onbeforeunload = e => {
    browser.runtime.sendMessage("unload");
  }
})()