(function() {
  const borderTolerance = 15;
  let borderSide = "";
  let mouseX = 0;
  let mouseY = 0;
  let dragging = false;
  let selecting = true;
  let selected = null;

  // Highlight hovered elements
  function highlight(e) {
    if(selecting) {
      e.target.style.outline = "3px dashed #6c44d7";
    }
  }
  document.body.addEventListener("mouseover", highlight);

  // Stop highlighting elements when user stops hovering
  function removeHighlight(e) {
    if(selecting) {
      e.target.style.outline = "";
    }
  }
  document.body.addEventListener("mouseout", removeHighlight);

  // Select (or de-select) an element on click
  function selectElement(e) {
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    // Stop if click event comes from resizing an element
    if(dragging) {
      dragging = false;
      return;
    }
    // Unstyle the previous element (used when clicking another element)
    if(selected) {
      selected.style.outline = "none";
      selected.style.cursor = "auto";
      selected.removeAttribute("draggable");
      document.body.removeEventListener("mousemove", showArrows);
      endResize();
    }
    // Continue de-selecting element if clicking the same element
    if(e.target === selected) {
      selecting = true;
      selected = null;
    // Select the newly clicked element if it's different (or after dragging)
    } else {
      selecting = false;
      selected = e.target;
      selected.style.outline = "4px solid #6c44d7";
      selected.setAttribute("draggable", false);
      document.body.addEventListener("mousemove", showArrows);
    }
  }
  // Setting capture flag to true triggers event listeners from top to
  // bottom in DOM tree (making this trigger before other click listeners)
  document.body.addEventListener("click", selectElement, true);

  // Change the cursor into an appropriate arrow
  function showArrows(e) {
    if(!dragging) {
      // Get side the cursor is currently hovering over
      borderSide = "";
      if(e.offsetY < borderTolerance) {
        borderSide += "n";
      } else if(e.offsetY > e.target.offsetHeight - borderTolerance) {
        borderSide += "s";
      }
      if(e.offsetX < borderTolerance) {
        borderSide += "w";
      } else if(e.offsetX > e.target.offsetWidth - borderTolerance) {
        borderSide += "e";
      }

      // Hovering over content
      if(borderSide === "") {
        selected.style.cursor = "auto";
        // Allow the user to continue dragging, but not start dragging
        selected.removeEventListener("mousedown", startResize);
        selected.removeEventListener("mouseup", endResize);
      // Hovering over a border
      } else {
        selected.style.cursor = borderSide + "-resize";
        selected.addEventListener("mousedown", startResize);
        selected.addEventListener("mouseup", endResize);
      }
    }
  }

  // Initialize dragging logic
  function startResize(e) {
    dragging = true;
    mouseX = e.x;
    mouseY = e.y;
    document.body.addEventListener("mousemove", resize);
  }

  // Remove drag listeners
  function endResize(e) {
    if(selected) {
      document.body.removeEventListener("mousemove", resize);
      selected.removeEventListener("mousedown", startResize);
      selected.removeEventListener("mouseup", endResize);
    }
  }

  // Resize the selected element
  function resize(e) {
    selected.style.position = "relative";
    // Vertical sides
    if(borderSide.includes("n") || borderSide.includes("s")) {
      let changeY = e.y - mouseY;
      let newHeight;
      // Top: add to top, subtract from height
      if(borderSide.includes("n")) {
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
    if(borderSide.includes("w") || borderSide.includes("e")) {
      let changeX = e.x - mouseX;
      let newWidth;
      // Left: add to left, subtract from width
      if(borderSide.includes("w")) {
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
  }

  // Clean up event listeners when requested by popup
  browser.runtime.onMessage.addListener(message => {
    if(message === "cleanup") {
      if(selected) {
        selected.style.outline = "none";
      }
      document.body.removeEventListener("mouseover", highlight);
      document.body.removeEventListener("mouseout", removeHighlight);
      document.body.removeEventListener("click", selectElement, true);
    }
  })
})()