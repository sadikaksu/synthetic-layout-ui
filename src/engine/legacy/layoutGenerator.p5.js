const canvas = 1024;
const us = 0.256; //0.128;
const wt = 20;

const sc = 0;

let canvasBW;

// -------------------------------- CONTROL PANEL --------------------------------
const isConsoleOn = true;
const isRotateOn = true;
const isDrawingOrderChangeOn = true;
const isDrawingRoom = true;
const isDrawingBounding = false;
const isDrawingCenter = false;
const isShowingBoundary = false;
const isSaveOn = false; // ! before turning it on => check the massGeneration and count
const isSaveBWOn = false;
const isSaveTableOn = false;
const massGenerationOn = false;
let massGenerationCount = massGenerationOn == false ? 0 : 9999;
// -------------------------------------------------------------------------------

// -------------------------------- REGULATIONS --------------------------------
const regulation = {
  minSide: { entrance: 120, kitchen: 150, bedroom: 250, bathroom: 150, living: 300, balcony: 140 },
  minArea: { entrance: 14400, kitchen: 33000, bedroom: 90000, bathroom: 40000, living: 120000, balcony: 60000 },
  maxSide: { entrance: 400, kitchen: 400, bedroom: 600, bathroom: 400, living: 700, balcony: 300 },
};
// -----------------------------------------------------------------------------

// ------------------------------- COLOR PALETTE -------------------------------
const colors = {
  fillColor: { entrance: "yellow", bathroom: "magenta", bedroom: "blue", living: "green", kitchen: "cyan", balcony: "pink" },
};

// ------------------------------ GLOBAL VARIABLES ------------------------------
let roomDrawingOrder;
let layoutRotation;
let roomDirectionList;
let netArea;
let boundingBox = {};

let room = {};
// ------------------------------------------------------------------------------

// * can be removed later? just use the room object and it's keys.
let roomList = ["bathroom", "bedroom", "kitchen", "living", "balcony"];

//shuffler(roomList);
roomList.unshift("entrance");
//roomList.push("balcony");

function generateRoom() {
  roomDrawingOrder = isDrawingOrderChangeOn ? rchoice(["clockwise", "counter"]) : "clockwise";
  layoutRotation = isRotateOn ? rchoice([0, 90, 180, 270]) : 0;

  roomDirectionList =
    roomDrawingOrder == "clockwise"
      ? [
          [-1, 1],
          [-1, -1],
          [1, -1],
          [1, 1],
        ]
      : [
          [1, 1],
          [1, -1],
          [-1, -1],
          [-1, 1],
        ];

  netArea = 0;

  roomList.forEach((key) => {
    room[key] = {};
    room[key].fc = colors.fillColor[key];

    let d1 = rstep(regulation.minSide[key], regulation.maxSide[key]);
    let d2 = rstep(Math.max(regulation.minArea[key] / d1, regulation.minSide[key]), regulation.maxSide[key]);

    room[key].w = d1;
    room[key].h = d2;

    netArea += room[key].w * room[key].h;
  });
}

function setup() {
  angleMode(DEGREES);
  rectMode(CENTER);
  pixelDensity(1);
  //randomSeed(1);
  textFont("monospace");
  noSmooth();
  createCanvas(canvas, canvas);
  canvasBW = createGraphics(canvas, canvas);
  canvasBW.angleMode(DEGREES);
  canvasBW.rectMode(CENTER);
  noLoop();
}

function calculateRoom() {
  roomList.forEach((item, index) => {
    let activeRoom = room[item];
    if (item == "living" || item == "balcony") {
    } else if (item == "entrance") {
      activeRoom.x = 0;
      activeRoom.y = 0;
    } else {
      let w = activeRoom.w;
      let h = activeRoom.h;

      let translateVector = createVector(roomDirectionList[index - 1][0], roomDirectionList[index - 1][1]);

      let roomVector = translateVector.copy();
      roomDrawingOrder == "clockwise" ? roomVector.rotate(90) : roomVector.rotate(-90);
      let delta = createVector();

      if (index % 2 != 0) {
        delta.x = (w + room.entrance.w) * translateVector.x * 0.5 + wt * translateVector.x;
        delta.y = (h - room.entrance.h) * translateVector.y * 0.5;
      } else {
        delta.x = (w - room.entrance.w) * translateVector.x * 0.5;
        delta.y = (h + room.entrance.h) * translateVector.y * 0.5 + wt * translateVector.y;
      }
      room[item].x = delta.x;
      room[item].y = delta.y;

      if (item == "kitchen") {
        let delta2 = createVector();

        if (index % 2 != 0) {
          delta2.x = (room.living.w - w) * translateVector.x * 0.5;
          delta2.y = (room.living.h + h) * translateVector.y * 0.5 + wt * translateVector.y;
        } else {
          delta2.x = (room.living.w + w) * translateVector.x * 0.5 + wt * translateVector.x;
          delta2.y = (room.living.h - h) * translateVector.y * 0.5;
        }
        room.living.x = delta.x + delta2.x;
        room.living.y = delta.y + delta2.y;
      }
      if (item == "bedroom") {
        let delta2 = createVector();
        if (index % 2 != 0) {
          delta2.x = (room.balcony.w - w) * translateVector.x * 0.5;
          delta2.y = (room.balcony.h + h) * translateVector.y * 0.5 + wt * translateVector.y;
        } else {
          delta2.x = (room.balcony.w + w) * translateVector.x * 0.5 + wt * translateVector.x;
          delta2.y = (room.balcony.h - h) * translateVector.y * 0.5;
        }
        room.balcony.x = delta.x + delta2.x;
        room.balcony.y = delta.y + delta2.y;
      }
    }
  });
}

function drawRoom() {
  background(255);
  canvasBW.background(255);
  noStroke();
  canvasBW.noStroke();

  for (let key in room) {
    canvasBW.fill(sc);
    canvasBW.rect(room[key].x * us, room[key].y * us, (room[key].w + wt * 2) * us, (room[key].h + wt * 2) * us);
    fill(sc);
    rect(room[key].x * us, room[key].y * us, (room[key].w + wt * 2) * us, (room[key].h + wt * 2) * us);
    // key != "balcony" && rect(room[key].x * us, room[key].y * us, (room[key].w + wt * 2) * us, (room[key].h + wt * 2) * us);
    fill(room[key].fc);
    rect(room[key].x * us, room[key].y * us, room[key].w * us, room[key].h * us);

    if (isDrawingCenter) {
      fill(0);
      circle(room[key].x * us, room[key].y * us, us * 15);
    }
  }
}

function calculateBoundingBox() {
  let minX = [];
  let minY = [];
  let maxX = [];
  let maxY = [];

  for (let key in room) {
    minX.push(room[key].x - room[key].w * 0.5);
    maxX.push(room[key].x + room[key].w * 0.5);
    minY.push(room[key].y - room[key].h * 0.5);
    maxY.push(room[key].y + room[key].h * 0.5);
  }

  let leftEdge = min(minX) - wt;
  let rightEdge = max(maxX) + wt;
  let topEdge = min(minY) - wt;
  let bottomEdge = max(maxY) + wt;

  boundingBox = {
    x: (leftEdge + rightEdge) * 0.5,
    y: (topEdge + bottomEdge) * 0.5,
    w: rightEdge - leftEdge,
    h: bottomEdge - topEdge,
    area: (rightEdge - leftEdge) * (bottomEdge - topEdge),
  };
}

function drawBoundingBox() {
  noFill();
  strokeWeight(us * 10);
  stroke("gray");

  rect(boundingBox.x * us, boundingBox.y * us, boundingBox.w * us, boundingBox.h * us);
}

function draw() {
  generateRoom();
  calculateRoom();

  calculateBoundingBox();

  // drawing preparation
  push();
  canvasBW.push();
  translate(canvas * 0.5, canvas * 0.5);
  canvasBW.translate(canvas * 0.5, canvas * 0.5);
  rotate(layoutRotation);
  canvasBW.rotate(layoutRotation);
  // move everythingh to the center of the screen
  translate(-boundingBox.x * us, -boundingBox.y * us);
  canvasBW.translate(-boundingBox.x * us, -boundingBox.y * us);
  // drawing rooms
  isDrawingRoom && drawRoom();
  // drawing bounding box
  isDrawingBounding && drawBoundingBox();
  pop();
  canvasBW.pop();

  isShowingBoundary && image(canvasBW, 0, 0);

  // to update x,y,w,h infos in the object base on the layout rotation
  if (layoutRotation != 0) {
    for (let key in room) {
      if (layoutRotation == 90 || layoutRotation == 270) {
        let w = room[key].w;
        let h = room[key].h;
        room[key].w = h;
        room[key].h = w;
      }

      let x = room[key].x;
      let y = room[key].y;

      room[key].x = layoutRotation == 90 ? -1 * y : layoutRotation == 180 ? -1 * x : layoutRotation == 270 ? y : x;
      room[key].y = layoutRotation == 90 ? x : layoutRotation == 180 ? -1 * y : layoutRotation == 270 ? -1 * x : y;

      if (room[key].x == 0) {
        room[key].x = abs(room[key].x);
      }
      if (room[key].y == 0) {
        room[key].y = abs(room[key].y);
      }
    }
  }

  // Main Console for debugging
  if (isConsoleOn) {
    console.log("drawing order: " + roomDrawingOrder, "| layout rotation: " + layoutRotation);
    console.log("netArea: " + netArea / 10000, "| boundingArea: " + boundingBox.area / 10000);
    console.log("net/bounding: " + (netArea / boundingBox.area).toFixed(2), "| loss: " + (boundingBox.area - netArea) / 10000);
    console.table(room);
  }

  if (isSaveOn) {
    isSaveBWOn && canvasBW.save(`layout_bw.png`);
    setTimeout(() => {
      save(`layout.png`);
    }, 500);
  }

  if (isSaveTableOn) {
    let table = new p5.Table();

    table.addColumn("room");
    table.addColumn("fc");
    table.addColumn("x");
    table.addColumn("y");
    table.addColumn("w");
    table.addColumn("h");

    for (key in room) {
      let newRow = table.addRow();
      newRow.setString("room", key);
      newRow.setString("fc", room[key].fc);
      newRow.setNum("w", room[key].w);
      newRow.setNum("h", room[key].h);
      newRow.setNum("x", room[key].x);
      newRow.setNum("y", room[key].y);
    }

    setTimeout(() => {
      saveTable(table, "layout.csv");
    }, 500);
  }

  if (massGenerationOn && massGenerationCount > 0) {
    massGenerationCount--;
    setTimeout(() => {
      draw();
    }, 500);
  }
}

function rdec() {
  return random();
}
function rnum(a, b) {
  return a + (b - a) * rdec();
}
function rint(a, b) {
  return Math.floor(rnum(a, b + 1));
}
function rstep(a, b, step = 10) {
  return Math.floor(rnum(a / step, (b + 1) / step)) * step;
}
function rchoice(list) {
  return list[rint(0, list.length - 1)];
}
function rgaus(mean, deviation) {
  let force = 4;
  let f = 0;
  for (let j = force; j > 0; j--) {
    f += mean + rdec() * (deviation * 2) - deviation;
  }
  return f / force;
}
function shuffler(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ------------------------------- TODO --------------------------------



*/
