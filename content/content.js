(function() {
  let resizeDirection = "";
  let mouseX = 0;
  let mouseY = 0;
  let dragging = false;
  let selected = null;
  createMetaElements();

  // Initialize context menu and resize corners
  function createMetaElements() {
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

    // Resize Corners
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

    // Disable (or enable) context items
    const deleteItem = container.querySelector(".delete");
    if(!selected) {
      deleteItem.classList.add("disabled");
    } else {
      deleteItem.classList.remove("disabled");
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
    // Exclusions that shouldn't be selected
    if(dragging || e.target.className.includes("edit-meta") || e.target.tagName === "BODY") {
      document.body.removeEventListener("mousemove", resize);
      document.body.removeEventListener("mousemove", move);
      dragging = false;
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
      // Positioning is separate because it shouldn't be cleaned up
      selected.style.position = "relative";

      // Add corners and mouse listeners
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
    console.log("delete")
    if(selected) {
      selected.remove();
      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
      selected = null;
    }
  }

  function undo(e) {
    console.log("undo");
    document.querySelector(".edit-context-container").classList.add("hidden");
  }

  function redo(e) {
    console.log("redo");
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

  // Initialize resize variables
  function startResize(e) {
    resizeDirection = e.target.classList[0];
    mouseX = e.x;
    mouseY = e.y;
    dragging = true;
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
        selected.style.marginBottom = getChangedValue("marginBottom", changeY);
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
    if(!dragging) {
      dragging = true;
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
  function cleanup(message) {
    if(message === "cleanup") {
      if(selected) {
        deselect();
        selected.classList.remove("edit-selecting", "edit-selected");
      }
      document.querySelectorAll(".edit-meta").forEach(el => el.remove());
      document.body.removeEventListener("mouseover", highlight);
      document.body.removeEventListener("mouseout", removeHighlight);
      document.body.removeEventListener("click", selectElement, true);
      document.body.removeEventListener("contextmenu", showContextMenu);
      browser.runtime.onMessage.removeListener(cleanup);
    }
  }
  browser.runtime.onMessage.addListener(cleanup)
})()