//declaration of images and sounds
let GuitarNeck;
let lowESound;
//these are the six string lanes
//these are like starting positions of each string 
const stringYs = [150, 211, 272, 333, 394, 455];
// string thicknesses
const stringWeights = [8, 6, 5, 4, 3, 2];
//the pitch increments of the shitty sample for the other open strings
const stringPitchSemitones = [0, 5, 10, 15, 19, 24];
// frets
const fretPositions = [50, 190, 320, 435, 545, 650, 745, 840];
// -1 means the string is not being grabbed, this is the d-fault behavior
let grabbedString = -1;
// The chosen string + fret pitch
let basePitchSemitones = 0;
// The playback speed - related to pitch 
let targetPlaybackRate = 1;

//mouseX into fret number
function fretAtX(x) {
  // if mousex is before the nut then no fret is being pressed
  if (x < fretPositions[0]) {
    return 0;
  }

  // running through the fret numbers until the clicked one is found
  for (let fretWire = 1; fretWire < fretPositions.length; fretWire++) {
    if (x < fretPositions[fretWire]) {
      return fretWire;
    }
  }

  // when the click is past all the listed wires this returns the next possible position.
  return fretPositions.length;
}

async function setup() {
  createCanvas(900, 600);
  GuitarNeck = await loadImage("Images/guitar-neck.png");
  GuitarNut = await loadImage("Images/GuitarNut.PNG");
  Logo = await loadImage("Images/GuitarAppLogo.png");
  lowESound = new Audio("Audio/Low E String On Acoustic Guitar Sound Effect.mp3");
  //had to look this guy up, but it basically fetches the sample early
  lowESound.preload = "auto";
  //these just turn off everything that would say "preserve pitch with playback speed"
  lowESound.preservesPitch = false;
  lowESound.mozPreservesPitch = false;
  lowESound.webkitPreservesPitch = false;
}

function mousePressed() {
  //which string is closest to click
  const nearestString = Math.round((mouseY - stringYs[0]) / 61);
  //this is just a big conditional checking if the click is anywhere near the strings, if not it just returns and does nothing
  const isOnString =
    mouseX >= 0 &&
    mouseX <= width &&
    nearestString >= 0 &&
    nearestString < stringYs.length &&
    Math.abs(mouseY - stringYs[nearestString]) <= 30.5;
  if (!isOnString) {
    return;
  }

  //add the bend offset of the string to the fret pitch
  const fret = fretAtX(mouseX);
  basePitchSemitones = stringPitchSemitones[nearestString] + fret;
  // 1 octave is 12 semitones, so this is the formula for the playback speed that matches the pitch
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);

  // So we don't have crazy overlap until I'm ready to expand this section, cut off the previous pluck so each click gets a new pluck
  lowESound.pause();
  lowESound.currentTime = 0;
  //set the new note's speed 
  lowESound.playbackRate = targetPlaybackRate;
  const playback = lowESound.play();
  
  //only let the user bend between the outer fretboard markers
  const isBetweenFrets = mouseX > fretPositions[0] && mouseX < fretPositions[fretPositions.length - 1];
  if (isBetweenFrets) {
    //gotta save the state of that string so that draw can bend it while the mouse is held down
    grabbedString = nearestString;
  }
}

function mouseReleased() {
  //when the string is released, this resets the bend and the playback speed to the base note, but it does this smoothly so it doesn't sound like a jump in pitch
  grabbedString = -1;
  targetPlaybackRate = Math.pow(2, basePitchSemitones / 12);
}

function draw() {
  //when a string is grabbed, the bend will follow the mouse, but is unable to cross over the neighboring strings
  if (grabbedString >= 0 && mouseIsPressed) {
    const minY = grabbedString === 0 ? stringYs[grabbedString] - 61 : stringYs[grabbedString - 1];
    const maxY = grabbedString === stringYs.length - 1
      ? stringYs[grabbedString] + 61
      : stringYs[grabbedString + 1];
    //using constrain to keep mouseY in bounds
    const draggedY = constrain(mouseY, minY, maxY);

    //just like a real guitar, bending the string either direction causes a rise in pitch
    // one full string gap of travel reaches one semitone above the fretted note, for now, on a real guitar depending on a couple factors bend's can sometimes go as high as 4 semitones above the fretted note
    const bendSemitones = Math.abs(stringYs[grabbedString] - draggedY) / 61;
    // For each semitone the playback speed is multiplied by the 12th root of 2, this is the formula for the playback speed that matches the pitch
    targetPlaybackRate = Math.pow(2, (basePitchSemitones + bendSemitones) / 12);
  }

  //making the pitch change smooth on the bend
  if (lowESound && !lowESound.paused) {
    //adapting to frames
    const smoothing = 1 - Math.exp(-deltaTime / 30);
    // inching toward the target pitch each frame
    lowESound.playbackRate += (targetPlaybackRate - lowESound.playbackRate) * smoothing;
  }

  background(140,170,190);
  // addie's incredible logo
  image(Logo, 300,-40,300,200)
  // the visual layout of the neck
    push(); 
    translate(width / 2, height / 2); 
    rotate(-HALF_PI); 
    imageMode(CENTER); 
    image(GuitarNeck, 0, 0,350,900,);
    image(GuitarNut, -5,-422,370,227,); 
    pop();
  //draw strings
    for (let i = 0; i < stringYs.length; i++) {
      // Thicker strings get thicker lines, have not yet figured out how to apply a texture to the lines to make them look more like strings, but this is a start
      strokeWeight(stringWeights[i]);
      stroke(23,25,58)
      if (mouseIsPressed && i === grabbedString) {
        // the string the user bends uses the same bounds as the audio pitch, so it can't cross over the neighboring strings
        const minY = i === 0 ? stringYs[i] - 61 : stringYs[i - 1];
        const maxY = i === stringYs.length - 1 ? stringYs[i] + 61 : stringYs[i + 1];
        const draggedY = constrain(mouseY, minY, maxY);
        //this just does the visual bend of the string from left to right, the string is drawn in two halves from the left and right edges of the canvas to the mouseXY
        line(0, stringYs[i], mouseX, draggedY);
        line(mouseX, draggedY, width, stringYs[i]);
      } else {
        // default string position when not being grabbed
        line(0, stringYs[i], width, stringYs[i]);
      }
    }

}