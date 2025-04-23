
let animals = document.querySelectorAll(".animal");
let game = true;
while (game) {
    let currentLeft;
        
    }

function moveRight() {
    animals.forEach(animal => {
        let currentLeft = parseInt(animal.style.left) || 0; // Get current left position, default to 0 if not set
        animal += 10; // Increment position by 10 pixels (adjust as needed)
        animal.style.left = currentLeft + "px"; // Update the left position
    });       
}


// For later maybe
// setInterval(moveSquareRight, 100); 