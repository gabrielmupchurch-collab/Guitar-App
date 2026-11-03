let GuitarNeck;

async function setup() {
  createCanvas(900, 400);
  GuitarNeck = await loadImage("Images/guitar-neck.png")
}

function draw() {
  background(220);
  push(); 

  // 2. Move the origin (0,0) to where you want the image center to be
  translate(width / 2, height / 2); 

  // 3. Rotate by 90 degrees (HALF_PI radians)
  rotate(HALF_PI); 

  // 4. Change image mode to CENTER so it draws relative to its own middle
  imageMode(CENTER); 

  // 5. Draw the image at the new (0,0) origin
  image(GuitarNeck, 0, 0,400,900,); 

  // 6. Restore the original drawing state
  pop();

}