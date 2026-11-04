let GuitarNeck;
let lowESound;
// These are the six string lanes, top to bottom: chunky low E through skinny high E.
// Each number is the Y pixel where that string hangs out when nobody is bending it.
const stringYs = [150, 211, 272, 333, 394, 455];
// The thick strings get a little more visual weight; the skinny ones stay skinny.
const stringWeights = [8, 6, 5, 4, 3, 2];
// We only have a low-E recording, so the other open strings get pitched up from it.
// These are semitone steps from low E: E=0, A=5, D=10, G=15, B=19, high E=24.
const stringPitchSemitones = [0, 5, 10, 15, 19, 24];
// X pixels for the nut and fret wires, from the left side toward the right.
const fretPositions = [50, 190, 320, 435, 545, 650, 745, 840];
// Which string is currently grabbed? -1 means "none, we're just chilling."
let grabbedString = -1;
// The chosen string + fret pitch, before any bend gets layered on top.
let basePitchSemitones = 0;
// The playback speed (and therefore pitch) we're smoothly aiming for.
let targetPlaybackRate = 1;

// Turn the mouse's X position into a fret number.
// Left of the nut is the open string (fret 0); every fret space to the right adds a half-step.
function fretAtX(x) {
  // Still before the nut? No fret pressed, so keep the open-string pitch.
  if (x < fretPositions[0]) {
    return 0;
  }

  // Walk across the fret wires until we find the first one to the right of the click.
  for (let fretWire = 1; fretWire < fretPositions.length; fretWire++) {
    if (x < fretPositions[fretWire]) {
      // The space ending at this wire is the fret number for the note we want.
      return fretWire;
    }
  }

  // Click is past all the listed wires, so use the next fret after the last one.
  return fretPositions.length;
}

async function setup() {
  // Make a 900-by-600 playground for the guitar.
  createCanvas(900, 600);
  // Text is here for the little mouse-position readout.
  // Load the neck image before drawing, and use the low E sample as the source for every string.
  GuitarNeck = await loadImage("Images/guitar-neck.png");
  // These two pictures are extra decoration layered over the neck.
  GuitarNut = await loadImage("Images/GuitarNut.PNG");
  Logo = await loadImage("Images/GuitarAppLogo.png");
  // One recording does double duty: we speed it up for every other note.
  lowESound = new Audio("Audio/Low E String On Acoustic Guitar Sound Effect.mp3");
  // Ask the browser to fetch the clip early, instead of waiting until the first pluck.
  lowESound.preload = "auto";
  // Important bit: changing playback speed should change pitch too, not keep the old pitch.
  // These spellings cover the different browser engines.
  lowESound.preservesPitch = false;
  lowESound.mozPreservesPitch = false;
  lowESound.webkitPreservesPitch = false;
}

function mousePressed() {
  // Work out which string row is closest to the click.
  const nearestString = Math.round((mouseY - stringYs[0]) / 61);
  // A click only counts if it's on the canvas and close enough to an actual string.
  const isOnString =
    mouseX >= 0 &&
    mouseX <= width &&
    nearestString >= 0 &&
    nearestString < stringYs.length &&
    Math.abs(mouseY - stringYs[nearestString]) <= 30.5;

  // Missed the strings? Nothing to play or grab, so bail out.
  if (!isOnString) {
    return;
  }

  // Get the fret number, then add it to the tuning offset for this string.
  const fret = fretAtX(mouseX);
  basePitchSemitones = stringPitchSemitones[nearestString] + fret;
  // Twelve semitones make an octave, so this turns the half-step count into a speed multiplier.
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);

  // Cut off the previous pluck and rewind, so this click gets a fresh attack.
  lowESound.pause();
  lowESound.currentTime = 0;
  // Set the new note's speed before we start the sample again.
  lowESound.playbackRate = targetPlaybackRate;
  const playback = lowESound.play();
  // Browsers can reject audio playback; log that failure rather than hiding it.
  if (playback) {
    playback.catch((error) => console.error("Could not play the guitar string sound:", error));
  }

  // Only let the user bend between the outer fretboard markers.
  const isBetweenFrets = mouseX > fretPositions[0] && mouseX < fretPositions[fretPositions.length - 1];
  if (isBetweenFrets) {
    // Save this string's index so draw() knows which line and pitch to bend.
    grabbedString = nearestString;
  }
}

function mouseReleased() {
  // Let go of the string; the next frames will ease the sound back to its fretted note.
  grabbedString = -1;
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);
}

function draw() {
  // While we're holding a string, update the bend based on how far the mouse has moved.
  if (grabbedString >= 0 && mouseIsPressed) {
    // Keep it between neighboring strings so the drawing doesn't cross over them.
    const minY = grabbedString === 0 ? stringYs[grabbedString] - 61 : stringYs[grabbedString - 1];
    const maxY = grabbedString === stringYs.length - 1
      ? stringYs[grabbedString] + 61
      : stringYs[grabbedString + 1];
    // Clamp the mouse position to those limits; constrain() keeps it in bounds.
    const draggedY = constrain(mouseY, minY, maxY);

    // Up OR down counts as a bend up in pitch, so use distance, not direction.
    // One full string gap of travel reaches one semitone above the fretted note.
    const bendSemitones = Math.abs(stringYs[grabbedString] - draggedY) / 61;
    // Fold that bend on top of the selected string-and-fret note.
    targetPlaybackRate = Math.pow(2, (basePitchSemitones + bendSemitones) / 12);
  }

  // Don't teleport to the target speed: ease toward it so the bend sounds smooth.
  if (lowESound && !lowESound.paused) {
    // This smoothing amount adapts to frame time, so it behaves nicely at different frame rates.
    const smoothing = 1 - Math.exp(-deltaTime / 30);
    // Move just partway from the current speed toward the target speed each frame.
    lowESound.playbackRate += (targetPlaybackRate - lowESound.playbackRate) * smoothing;
  }

  // Paint the background fresh each frame before drawing the guitar stuff over it.
  background(140,170,190);
  // Pop the logo near the top. The slightly negative Y nudges it up into place.
  image(Logo, 300,-40,300,200)
  // The neck picture starts upright; spin the drawing space so it lies sideways.
    push(); 
    translate(width / 2, height / 2); 
    rotate(-HALF_PI); 
    imageMode(CENTER); 
    // Draw the neck and its nut while the rotated coordinate setup is active.
    image(GuitarNeck, 0, 0,350,900,);
    image(GuitarNut, -5,-422,370,227,); 
    pop();
  // Now draw the strings on top of the neck.
    for (let i = 0; i < stringYs.length; i++) {
      // Thicker strings get thicker lines, just like the guitar.
      strokeWeight(stringWeights[i]);
      stroke(23,25,58)
      if (mouseIsPressed && i === grabbedString) {
        // This is the one we're bending: use the same safe vertical limits as the audio.
        const minY = i === 0 ? stringYs[i] - 61 : stringYs[i - 1];
        const maxY = i === stringYs.length - 1 ? stringYs[i] + 61 : stringYs[i + 1];
        const draggedY = constrain(mouseY, minY, maxY);
        // Draw from the left edge to the pointer, then from the pointer back to the right edge.
        line(0, stringYs[i], mouseX, draggedY);
        line(mouseX, draggedY, width, stringYs[i]);
      } else {
        // Not grabbed? Keep the string as one straight line in its resting spot.
        line(0, stringYs[i], width, stringYs[i]);
      }
    }

}