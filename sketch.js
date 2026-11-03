let GuitarNeck;
// Each string's vertical position and drawing thickness, ordered from top to bottom.
const stringYs = [150, 211, 272, 333, 394, 455];
const stringWeights = [8, 6, 5, 4, 3, 2];
// Horizontal positions of the nut and frets; string bends can only be grabbed between them.
const fretPositions = [50, 190, 320, 435, 545, 650, 745, 840];
// Index of the string being dragged, or -1 when no string is grabbed.
let grabbedString = -1;

async function setup() {
  createCanvas(900, 600);
  textSize(20);
  GuitarNeck = await loadImage("Images/guitar-neck.png")
}

function mousePressed() {
  // Only start a drag when the click is over a string and within the fretboard.
  const isBetweenFrets = mouseX > fretPositions[0] && mouseX < fretPositions[fretPositions.length - 1];
  const nearestString = Math.round((mouseY - stringYs[0]) / 61);

  if (
    isBetweenFrets &&
    nearestString >= 0 &&
    nearestString < stringYs.length &&
    Math.abs(mouseY - stringYs[nearestString]) <= 30.5
  ) {
    grabbedString = nearestString;
  }
}

function mouseReleased() {
  // Let go of the string when the mouse button is released.
  grabbedString = -1;
}

function draw() {
  background(220);
  text("X: " + mouseX + "  Y: " + mouseY, 10, 30);
  // Rotate the guitar-neck image so it lines up with the horizontal strings.
    push(); 
    translate(width / 2, height / 2); 
    rotate(-HALF_PI); 
    imageMode(CENTER); 
    image(GuitarNeck, 0, 0,350,900,); 
    pop();
  // Draw each string, bending the grabbed one toward the current mouse position.
    for (let i = 0; i < stringYs.length; i++) {
      strokeWeight(stringWeights[i]);
      if (mouseIsPressed && i === grabbedString) {
        // Keep the bend within the neighboring strings so it cannot cross them.
        const minY = i === 0 ? stringYs[i] - 61 : stringYs[i - 1];
        const maxY = i === stringYs.length - 1 ? stringYs[i] + 61 : stringYs[i + 1];
        const draggedY = constrain(mouseY, minY, maxY);
        line(0, stringYs[i], mouseX, draggedY);
        line(mouseX, draggedY, width, stringYs[i]);
      } else {
        line(0, stringYs[i], width, stringYs[i]);
      }
    }

}