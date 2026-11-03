let GuitarNeck;

async function setup() {
  createCanvas(900, 600);
  textSize(20);
  GuitarNeck = await loadImage("Images/guitar-neck.png")
}

function draw() {
  background(220);
  text("X: " + mouseX + "  Y: " + mouseY, 10, 30);
  //guitar neck
    push(); 
    translate(width / 2, height / 2); 
    rotate(-HALF_PI); 
    imageMode(CENTER); 
    image(GuitarNeck, 0, 0,350,900,); 
    pop();
  //strings -- start at 150, 61px between each string
    rectMode(CENTER);
    rect(450,150,900,2);
    rect(450,211,900,3);
    rect(450,272,900,4);
    rect(450,333,900,5);
    rect(450,394,900,6);
    rect(450,455,900,7);

}
//nutx=50
//firstFretX = 190
//secondFretX = 320
//thirdFretX = 435
//fourthFretX = 545
//fifthFretX = 650
//sixthFretX = 745
//seventhFretX = 840