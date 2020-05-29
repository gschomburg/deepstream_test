// https://opengameart.org/content/a-platformer-in-the-forest
/* eslint-disable no-unused-vars */
/* global connectToSharedRoom getSharedData createButton isHost*/

let shared;
let user; //my shared user data
let tempUsers={}; //object of shared users

/////////////////////////////////////////
//Important Stuff
//https://p5js.org/reference/#/p5

let canvasMarginX=40;
let canvasMarginY=60;
let colors; //list of colors.. or sample from an image
let myUUID;
let userChecker;

function ClearUsers(){
  if(isHost()){
    console.log("clearing server");
    shared.userIds = [];
  }else{
    console.log('only host can clear users');
  }
}
//dum uid
function uuidv4() {
  // let base = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let base = 'xxxxxyxx';
  return base.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
//my setup
function sketchingSetup(){
  colors = [
    color('#6a6f6b'),
    color('#787396'),
    color('#6c88a1'),
    color('#6c9a9c'),
    color('#74b78a'),
    color('#b6b653'),
    color('#d38b36'),
    color('#b25130'),
    color('#6d3838'),
    color('#232b38')
  ];
  userChecker = setInterval(checkUsers, 1000);
}
function GetRandomColor(){
  let r = floor(random(0, colors.length-1));
  return colors[r];
}

function checkUsers(){
  console.log("checking users: " + shared.userIds.length)
  for(const userID of shared.userIds){
    setupOtherUsers(userID)
  }
  let timeout=4000; //milli seconds
  if(isHost()){
    //clear out old/unused users
    let now = Date.now();
    for(let i= shared.userIds.length-1; i>=0; i--){
      let data = getUserData(shared.userIds[i]);
      if(data!=null){
        if(data.lastPing < now - timeout){
          //remove from the list
          shared.userIds.splice(i, 1);
        }
      }else{
        console.log('data is null:' + shared.userIds[i]);
      }
    }
  }

  //look through all the users
  //clear out unused users and setup any new ones
}
function setupOtherUsers(userID){
  //check if already getting this user
  // if(tempUsers==undefined ){
  //   console.log("temp users undefinde");
  // }
  console.log('userID:' +userID);
  // if(tempUsers[userID]==null ){
  //   console.log("tempUsers[userID]==null");
  // }
  // if(tempUsers[userID]=={} ){
  //   console.log("tempUsers[userID]=={}");
  // }
  if(userID != myUUID && (tempUsers[userID]==null || tempUsers[userID]==undefined)){
    // tempUsers!=undefined 
    console.log("setting up user:" + userID);
    console.log(tempUsers[userID]);
    tempUsers[userID] = getSharedData(userID);
    console.log(tempUsers[userID]);
  }
}
function setupUser(userID){
  if(this[userID]==null){
    console.log("getting user");
  }
}
function getUserData(userID){
  //get valid user data
  if(userID == myUUID){
    return user.data;
  }
  if(tempUsers[userID]!=null && tempUsers[userID]!=undefined){
    return tempUsers[userID].data;
  }
  return null;
}
function drawUserRainbow(){
  let h = (windowHeight-(canvasMarginY*2)) / shared.userIds.length;
  for(let i =0; i<shared.userIds.length; i++){
    let u = getUserData(shared.userIds[i])
    if(u){
      fill(u.color);
      rect(0, 0+(i*h), u.x, h);
    }
  }
}
function drawUserCursor(userID){
  let userData = getUserData(userID);
  if(userData==null) return;
  push();
    // console.log(userData.color);
    fill(userData.color);
    let radius = 20;
    ellipse(userData.x, userData.y, radius, radius);
  //////////////////
    // fill(230);
    // rect(userData.x, userData.y, 110, 20, 5);
    fill(255);
    textSize(16);
    // textFont("Avenir");
    textAlign(LEFT);
    text("user:" + userData.uuid, userData.x+radius+2, userData.y+4);
  pop();
}

/////////////////////////////////////////
//DUMB P5 Stuff

function preload() {
  connectToSharedRoom(
    "wss://deepstream-server-1.herokuapp.com",
    "sketching1",
    "main"
  );
  shared = getSharedData("globals");
  myUUID = uuidv4();

  //make a shared that is named for this uuid
  user = getSharedData(myUUID);
  // console.log("new uid: " + uuidv4()); 
}

function setup() {
  createCanvas(windowWidth-(canvasMarginX*2), windowHeight-(canvasMarginY*2));
  sketchingSetup();
  // this should be the first time this is created
  // and user data is unique to me so I should not need to check
  // let c = GetRandomColor();
  user.data = {
    uuid:myUUID,
    lastPing:Date.now(),
    x: mouseX,
    y: mouseY,
    color: GetRandomColor().toString()
  }
  //users is string list of ids
  shared.userIds = shared.userIds || [];
  shared.userIds.push(myUUID);
  // set defaults on shared data
  // shared.x = shared.x || 0;
  // shared.y = shared.y || 0;
  // shared.clickHistory = shared.clickHistory || [];

  //console.log("start as host?", isHost());
  // make the clear button
  const clearButton = createButton("Clear User List").mousePressed(ClearUsers);
  // () => {
  //   if (selectedTeam != "Observer") {
  //     shared.currentTurn = "Blue";
  //     shared.boardState = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  //   }
  // });
}

function draw() {
  background(0);
  noStroke();
  //update user data
  user.data.x=mouseX;
  user.data.y=mouseY;

  user.data.lastPing = Date.now();

  // read shared data
  // let i =0;
  drawUserRainbow();
  for(const userID of shared.userIds){
    drawUserCursor(userID);
    // i++;
    // if(i>colors.length-1) i =0;
  }
  

  // fill("#6666ff");
  // for (const p of shared.clickHistory) {
  //   ellipse(p.x, p.y, 20, 20);
  // }
}

function mousePressed(e) {
  // write shared data
  // shared.x = mouseX;
  // shared.y = mouseY;
  // shared.clickHistory.push({ x: mouseX, y: mouseY });
}

function windowResized() {
  resizeCanvas(windowWidth-(canvasMarginX*2), windowHeight-(canvasMarginY*2));
}
