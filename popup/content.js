(function() {
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
    // Unstyle the previously clicked element
    if(selected) {
      selected.style.outline = "none";
    }
    // Deselect element if it's clicked again
    if(e.target === selected) {
      selecting = true;
      selected = null;
    // Select the clicked element
    } else {
      selecting = false;
      selected = e.target;
      e.target.style.outline = "5px solid brown";
    }
    
  }

  document.body.addEventListener("mouseover", handleMouseOver);
  document.body.addEventListener("mouseout", handleMouseOut);
  // Setting capture flag to true to trigger event listeners from top to
  // bottom (making this one of the first to trigger)
  document.body.addEventListener("click", handleClick, true);
})()