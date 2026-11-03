let GuitarNeck;

async function setup() {
  createCanvas(400, 900);
  GuitarNeck = await loadImage("Images/guitar-neck.png")
}

function draw() {
  background(220);
  image(GuitarNeck, 0, 0,400,900,);
}