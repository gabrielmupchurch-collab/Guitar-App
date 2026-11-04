let GuitarNeck;
let lowESound;
// The six strings are ordered from thickest/lowest to thinnest/highest on the screen.
const stringYs = [150, 211, 272, 333, 394, 455];
const stringWeights = [8, 6, 5, 4, 3, 2];
// Each open string's pitch is measured in semitones above the low E sample.
// Standard tuning offsets are E=0, A=5, D=10, G=15, B=19, and high E=24.
const stringPitchSemitones = [0, 5, 10, 15, 19, 24];
// Horizontal pixel positions of the nut and visible fret wires.
const fretPositions = [50, 190, 320, 435, 545, 650, 745, 840];
// The active string index while dragging; -1 means no string is currently grabbed.
let grabbedString = -1;
// The selected open-string and fret pitch, before applying a temporary bend.
let basePitchSemitones = 0;
// The smoothed audio playback-rate destination for the current note or bend.
let targetPlaybackRate = 1;

// Convert a horizontal click position into a fret number.
// The nut-to-first-fret space is fret 0; each space after a fret wire adds one semitone.
function fretAtX(x) {
  if (x < fretPositions[1]) {
    return 0;
  }

  for (let fretWire = 2; fretWire < fretPositions.length; fretWire++) {
    if (x < fretPositions[fretWire]) {
      return fretWire - 1;
    }
  }

  return fretPositions.length - 1;
}

async function setup() {
  createCanvas(900, 600);
  textSize(20);
  // Load the neck image before drawing, and use the low E sample as the source for every string.
  GuitarNeck = await loadImage("Images/guitar-neck.png");
  GuitarNUt = await loadImage("Images/GuitarNut.PNG");
  lowESound = new Audio("Audio/Low E String On Acoustic Guitar Sound Effect.mp3");
  lowESound.preload = "auto";
  // Playback-rate changes must also change pitch, rather than preserving the sample's original pitch.
  lowESound.preservesPitch = false;
  lowESound.mozPreservesPitch = false;
  lowESound.webkitPreservesPitch = false;
}

function mousePressed() {
  // Map the click to the nearest string and ignore clicks outside the strings or canvas.
  const nearestString = Math.round((mouseY - stringYs[0]) / 61);
  const isOnString =
    mouseX >= 0 &&
    mouseX <= width &&
    nearestString >= 0 &&
    nearestString < stringYs.length &&
    Math.abs(mouseY - stringYs[nearestString]) <= 30.5;

  if (!isOnString) {
    return;
  }

  // Add the fret's semitone to that string's tuning offset.
  const fret = fretAtX(mouseX);
  basePitchSemitones = stringPitchSemitones[nearestString] + fret;
  // A semitone multiplies frequency by the twelfth root of two; playback rate applies that ratio.
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);

  // Restart the shared sample so every pluck has a clear attack at its new pitch.
  lowESound.pause();
  lowESound.currentTime = 0;
  lowESound.playbackRate = targetPlaybackRate;
  const playback = lowESound.play();
  if (playback) {
    playback.catch((error) => console.error("Could not play the guitar string sound:", error));
  }

  // Only grab the string over the fretboard, where the existing visual bend can be drawn.
  const isBetweenFrets = mouseX > fretPositions[0] && mouseX < fretPositions[fretPositions.length - 1];
  if (isBetweenFrets) {
    grabbedString = nearestString;
  }
}

function mouseReleased() {
  // Stop bending and smoothly return the pitch target to the selected fretted note.
  grabbedString = -1;
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);
}

function draw() {
  if (grabbedString >= 0 && mouseIsPressed) {
    // Keep the dragged string within the neighboring strings, matching the visual bend limits.
    const minY = grabbedString === 0 ? stringYs[grabbedString] - 61 : stringYs[grabbedString - 1];
    const maxY = grabbedString === stringYs.length - 1
      ? stringYs[grabbedString] + 61
      : stringYs[grabbedString + 1];
    const draggedY = constrain(mouseY, minY, maxY);

    // Either direction of displacement tightens the string and raises its pitch.
    // One full string spacing of movement raises it by one semitone.
    const bendSemitones = Math.abs(stringYs[grabbedString] - draggedY) / 61;
    targetPlaybackRate = Math.pow(2, (basePitchSemitones + bendSemitones) / 12);
  }

  // Ease toward the desired playback rate so bends do not sound like abrupt pitch steps.
  if (lowESound && !lowESound.paused) {
    const smoothing = 1 - Math.exp(-deltaTime / 30);
    lowESound.playbackRate += (targetPlaybackRate - lowESound.playbackRate) * smoothing;
  }

  background(220);
  text("X: " + mouseX + "  Y: " + mouseY, 10, 30);
  // Rotate the vertical neck image so its frets and string paths appear horizontal.
    push(); 
    translate(width / 2, height / 2); 
    rotate(-HALF_PI); 
    imageMode(CENTER); 
    image(GuitarNeck, 0, 0,350,900,);
    image(GuitarNut, 0,0,350,233,); 
    pop();
  // Draw every string; split the grabbed string at the pointer to visualize its bend.
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