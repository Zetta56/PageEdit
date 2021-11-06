(function() {
  let resizeDirection = "";
  let mouseX = 0;
  let mouseY = 0;
  let dragging = false;
  let selecting = true;
  let selected = null;

  // Highlight hovered elements
  function highlight(e) {
    if(selecting) {
      e.target.classList.add("edit-selecting");
    }
  }
  document.body.addEventListener("mouseover", highlight);

  // Stop highlighting elements when user stops hovering
  function removeHighlight(e) {
    if(selecting) {
      e.target.classList.remove("edit-selecting");
    }
  }
  document.body.addEventListener("mouseout", removeHighlight);

  // Select (or de-select) an element on click
  function selectElement(e) {
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    // Stop if click event comes from resizing an element
    if(dragging || e.target.className.includes("edit-meta")) {
      dragging = false;
      return;
    }
    // Unstyle the previous element (used when clicking another element)
    if(selected) {
      document.querySelectorAll(".edit-corner").forEach(corner => corner.remove());
      selected.classList.remove("edit-selected");
      selected.removeAttribute("draggable");
      endDrag();
    }
    // Continue de-selecting element if clicking the same element
    if(e.target === selected) {
      selecting = true;
      selected = null;
    // Select the newly clicked element if it's different (or after dragging)
    } else {
      selecting = false;
      selected = e.target;
      // Positioning is separate because it shouldn't be cleaned up
      selected.style.position = "relative";
      selected.classList.remove("edit-selecting");
      selected.classList.add("edit-selected");
      selected.setAttribute("draggable", false);

      // Add corners and mouse listeners
      createCorners();
      selected.addEventListener("mousedown", startMove);
      document.body.addEventListener("mouseup", endDrag);
    }
  }
  // Setting capture flag to true triggers event listeners from top to
  // bottom in DOM tree (making this trigger before other click listeners)
  document.body.addEventListener("click", selectElement, true);

  function createCorners() {
    // These 'directions' will be used to access properties in DOMRect
    let directions = ["top-left", "top-right", "bottom-left", "bottom-right"];
    for(let direction of directions) {
      let corner = document.createElement("div");
      corner.classList.add(direction, "edit-corner", "edit-meta");
      corner.addEventListener("mousedown", startResize);
      document.body.addEventListener("mouseup", endDrag);
      document.body.appendChild(corner);
    }
    positionCorners();
  }

  function positionCorners() {
    let rect = selected.getBoundingClientRect();
    let corners = document.querySelectorAll(".edit-corner");
    for(let corner of corners) {
      // Index is 0 because the direction was added first in createCorners()
      let direction = corner.classList[0];
      let vertical = direction.substring(0, direction.indexOf("-"));
      let horizontal = direction.substring(direction.indexOf("-") + 1);
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
      let changeY = e.y - mouseY;
      let newHeight;
      // Top: add to top, subtract from height
      if(resizeDirection.includes("top")) {
        selected.style.top = (parseInt(getComputedStyle(selected).top) + changeY) + "px";
        newHeight = (parseInt(getComputedStyle(selected).height) - changeY) + "px";
      // Bottom: add to height
      } else {
        newHeight = (parseInt(getComputedStyle(selected).height) + changeY) + "px";
      }
      // Set new heights and mouse position
      selected.style.height = newHeight;
      selected.style.minHeight = newHeight;
      selected.style.maxHeight = newHeight;
      mouseY = e.y;
    }

    // Horizontal sides
    if(resizeDirection.includes("left") || resizeDirection.includes("right")) {
      let changeX = e.x - mouseX;
      let newWidth;
      // Left: add to left, subtract from width
      if(resizeDirection.includes("left")) {
        selected.style.left = (parseInt(getComputedStyle(selected).left) + changeX) + "px";
        newWidth = (parseInt(getComputedStyle(selected).width) - changeX) + "px";
      // Right: add to width
      } else {
        newWidth = (parseInt(getComputedStyle(selected, '').width) + changeX) + "px";
      }
      // Set new widths
      selected.style.width = newWidth;
      selected.style.minWidth = newWidth;
      selected.style.maxWidth = newWidth;
      mouseX = e.x;
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
  function endDrag(e) {
    if(selected) {
      selected.removeEventListener("mousedown", startResize);
      document.body.removeEventListener("mousemove", resize);
      selected.removeEventListener("mousedown", startMove);
      document.body.removeEventListener("mousemove", move);
      document.body.removeEventListener("mouseup", endDrag);
    }
  }

  // Clean up event listeners when requested by popup
  browser.runtime.onMessage.addListener(message => {
    if(message === "cleanup") {
      if(selected) {
        selected.classList.remove("edit-selecting", "edit-selected");
      }
      document.body.removeEventListener("mouseover", highlight);
      document.body.removeEventListener("mouseout", removeHighlight);
      document.body.removeEventListener("click", selectElement, true);
    }
  })
})()