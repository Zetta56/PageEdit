(function() {
  let resizeDirection = "";
  let mouseX = 0;
  let mouseY = 0;
  let dragging = false;
  let selecting = true;
  let selected = null;
  createMetaElements();

  // Initialize context menu and resize corners
  function createMetaElements() {
    let container = document.createElement("div");
    container.classList.add("edit-context-container", "edit-meta");
    document.body.appendChild(container);

    let deleteItem = document.createElement("div");
    deleteItem.classList.add("edit-context-item", "edit-meta");
    deleteItem.innerHTML = "Delete";
    deleteItem.addEventListener("click", deleteSelected);
    container.appendChild(deleteItem);

    let directions = ["top-left", "top-right", "bottom-left", "bottom-right"];
    for(let direction of directions) {
      let corner = document.createElement("div");
      corner.classList.add(direction, "edit-corner", "edit-meta", "hidden");
      corner.addEventListener("mousedown", startResize);
      document.body.addEventListener("mouseup", deselectListeners);
      document.body.appendChild(corner);
    }
  }

  // Add to a property in selected and return the result in pixels
  function getChangedValue(propertyName, change) {
    return (parseInt(getComputedStyle(selected)[propertyName]) + change) + "px";
  }

  // Highlight hovered elements
  function highlight(e) {
    if(selecting) {
      e.target.classList.add("edit-selecting");
    }
  }
  document.body.addEventListener("mouseover", highlight);

  // Stop highlighting when user stops hovering over element
  function removeHighlight(e) {
    if(selecting) {
      e.target.classList.remove("edit-selecting");
    }
  }
  document.body.addEventListener("mouseout", removeHighlight);

  // Select (or de-select) an element on click
  function selectElement(e) {
    // Ignore context menu
    if(e.target.className.includes("edit-context-menu") || e.target.className.includes("edit-context-item")) {
      return;
    }
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    // Unstyle the previous element (used when clicking another element)
    if(selected) {
      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
      selected.classList.remove("edit-selected");
      deselectListeners();
    }
    // Select the element if it's different or right after dragging
    if(e.target !== selected || dragging) {
      // Don't change targets if click comes from drag
      if(dragging) {
        dragging = false;
      } else {
        selected = e.target;
      }
      selecting = false;
      // Positioning is separate because it shouldn't be cleaned up
      selected.style.position = "relative";
      selected.classList.remove("edit-selecting");
      selected.classList.add("edit-selected");

      // Add corners and mouse listeners
      positionCorners();
      selected.addEventListener("mousedown", startMove);
      selected.addEventListener("contextmenu", showContextMenu);
      selected.addEventListener("dragstart", preventDefaultDrag);
      document.body.addEventListener("mouseup", deselectListeners);
    // Continue de-selecting element if clicking the same element
    } else {
      selecting = true;
      selected = null;
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
      selected.remove();
      document.querySelector(".edit-context-container").classList.add("hidden");
      document.querySelectorAll(".edit-corner").forEach(corner => corner.classList.add("hidden"));
    }
  }

  // Show context menu at mouse pointer
  function showContextMenu(e) {
    e.preventDefault();
    let container = document.querySelector(".edit-context-container");
    container.classList.remove("hidden");
    container.style.left = e.x + "px";
    container.style.top = e.y + "px";
  }

  function positionCorners() {
    let rect = selected.getBoundingClientRect();
    let corners = document.querySelectorAll(".edit-corner");
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

  // Initialize move variables
  function startMove(e) {
    mouseX = e.x;
    mouseY = e.y;
    dragging = true;
    document.body.addEventListener("mousemove", move);
  }

  function move(e) {
    let changeX = e.x - mouseX;
    let changeY = e.y - mouseY;
    mouseX = e.x;
    mouseY = e.y;
    selected.style.left = (parseInt(getComputedStyle(selected).left) + changeX) + "px";
    selected.style.top = (parseInt(getComputedStyle(selected).top) + changeY) + "px";
    positionCorners();
  }

  // Remove drag listeners
  function deselectListeners(e) {
    if(selected) {
      selected.removeEventListener("mousedown", startResize);
      document.body.removeEventListener("mousemove", resize);
      selected.removeEventListener("mousedown", startMove);
      document.body.removeEventListener("mousemove", move);
      selected.removeEventListener("dragstart", preventDefaultDrag);
      document.body.removeEventListener("mouseup", deselectListeners);
    }
  }

  // Clean up event listeners when requested by popup
  function cleanup(message) {
    if(message === "cleanup") {
      if(selected) {
        deselectListeners();
        selected.classList.remove("edit-selecting", "edit-selected");
        selected = null;
        selecting = true;
      }
      document.querySelectorAll(".edit-meta").forEach(el => el.remove());
      document.body.removeEventListener("mouseover", highlight);
      document.body.removeEventListener("mouseout", removeHighlight);
      document.body.removeEventListener("click", selectElement, true);
      browser.runtime.onMessage.removeListener(cleanup);
    }
  }
  browser.runtime.onMessage.addListener(cleanup)
})()