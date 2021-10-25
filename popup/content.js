(function() {
  borderWidth = 20;
  borderSide = "";
  mouseX = 0;
  mouseY = 0;
  dragging = false;
  selecting = true;
  selected = null;

  function handleMouseOver(e) {
    if(selecting) {
      e.target.style.outline = "3px solid #6c44d7";
    }    
  }
  function handleMouseOut(e) {
    if(selecting) {
      e.target.style.outline = "";
    }
  }
  function handleClick(e) {
    // Stop the clicked element's normal click behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    // Unstyle the previously clicked element (useful when switching elements)
    if(selected) {
      selected.style.outline = "none";
      selected.removeEventListener("mousemove", showArrows);
      endDrag();
    }
    // Deselect element if clicking the same element
    if(e.target === selected && !dragging) {
      selecting = true;
      selected = null;
    // Select the clicked element if it's different
    } else {
      dragging = false;
      selecting = false;
      selected = e.target;
      selected.style.outline = "5px dashed brown";
      selected.addEventListener("mousemove", showArrows)
    }
  }

  function showArrows(e) {
    borderSide = "";
    // Check top and bottom borders
    if(e.offsetY < borderWidth) {
      borderSide += "n";
    } else if(e.offsetY > e.target.offsetHeight - borderWidth) {
      borderSide += "s";
    }
    // Check left and right borders
    if(e.offsetX < borderWidth) {
      borderSide += "w";
    } else if(e.offsetX > e.target.offsetWidth - borderWidth) {
      borderSide += "e";
    }

    // Hovering over content
    if(borderSide === "") {
      selected.style.cursor = "auto";
      // Allow the user to continue dragging, but not start dragging
      selected.removeEventListener("mousedown", startDrag);
      selected.removeEventListener("mouseup", endDrag);
    // Hovering over a border
    } else {
      selected.style.cursor = borderSide + "-resize";
      selected.addEventListener("mousedown", startDrag);
      selected.addEventListener("mouseup", endDrag);
    }
  }

  function startDrag(e) {
    mouseX = e.x;
    mouseY = e.y;
    dragging = true;
    if(borderSide.includes("n") || borderSide.includes("s")) {
      document.body.addEventListener("mousemove", resizeY);
    }
    if(borderSide.includes("w") || borderSide.includes("e")) {
      document.body.addEventListener("mousemove", resizeX);
    }
  }

  function endDrag(e) {
    if(selected) {
      document.body.removeEventListener("mousemove", resizeX);
      document.body.removeEventListener("mousemove", resizeY);
      selected.removeEventListener("mousedown", startDrag);
      selected.removeEventListener("mouseup", endDrag);
    }
  }

  // function resize(e) {
  //   const changeX = e.x - mouseX;
  //   mouseX = e.x;
  //   selected.style.position = "relative";
  //   selected.style.width = (parseInt(getComputedStyle(selected, '').width) + changeX) + "px";
  // }

  function resizeX(e) {
    const changeX = e.x - mouseX;
    mouseX = e.x;
    selected.style.width = (parseInt(getComputedStyle(selected, '').width) + changeX) + "px";
  }

  function resizeY(e) {
    const changeY = e.y - mouseY;
    mouseY = e.y;
    selected.style.height = (parseInt(getComputedStyle(selected, '').height) + changeY) + "px";
  }

  document.body.addEventListener("mouseover", handleMouseOver);
  document.body.addEventListener("mouseout", handleMouseOut);
  // Setting capture flag to true to trigger event listeners from top to
  // bottom in DOM tree (making this one of the first to trigger)
  document.body.addEventListener("click", handleClick, true);
})()