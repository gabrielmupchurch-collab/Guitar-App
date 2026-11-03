let GuitarNeck;

async function setup() {
  createCanvas(900, 600);
  GuitarNeck = await loadImage("Images/guitar-neck.png")
}

function draw() {
  background(220);
  push(); 
  translate(width / 2, height / 2); 
  rotate(-HALF_PI); 
  imageMode(CENTER); 
  image(GuitarNeck, 0, 0,350,900,); 
  pop();
}