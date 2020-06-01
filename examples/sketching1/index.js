// https://opengameart.org/content/a-platformer-in-the-forest
/* eslint-disable no-unused-vars */
/* global connectToSharedRoom getSharedData createButton isHost*/

let globalShared;
// let user; //my shared user data
// let tempUsers={}; //object of shared users

/////////////////////////////////////////
//Important Stuff
//https://p5js.org/reference/#/p5



let canvasMarginX=40;
let canvasMarginY=60;
let colors; //list of colors.. or sample from an image

//custom setup
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
}
function GetRandomColor(){
  let r = floor(random(0, colors.length-1));
  return colors[r];
}

function drawUserRainbow(){
  let userList = userMNGR.getAllUserIds();
  let h = (windowHeight-(canvasMarginY*2)) / userList.length;
  for(let i =0; i<userList.length; i++){
    let u = userMNGR.getUserData(userList[i])
    if(u){
      fill(u.color);
      rect(0, 0+(i*h), u.x, h);
    }
  }
}
function drawCursors(){
  let userList = userMNGR.getAllUserIds();
  for(const userID of userList){
    drawCursorHistory(userID);
    drawUserCursor(userID);
  }
}
function drawUserCursor(userID){
  let userData = userMNGR.getUserData(userID);
  if(userData==null){
    console.log("user data is null")
    return;
  }
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
function drawCursorHistory(userID){
  let userData = userMNGR.getUserData(userID);
  if(userData==null || userData.path.length<1){
    // console.log("user data is null")
    return;
  }
  push();
  stroke(userData.color);
  let lastM = userData.path[0];
  for(let i =1; i<userData.path.length; i++){
    let p1 = createVector(lastM.x, lastM.y)
    let p2 = createVector(userData.path[i].x, userData.path[i].y)
    let d = p1.dist(p2);
    strokeWeight(d*.1);
    line(p1.x, p1.y,p2.x, p2.y);
    lastM = userData.path[i];
  }
  pop();
}

/////////////////////////////////////////
//DUMB P5 Stuff
let userMNGR;
function preload() {
  connectToSharedRoom(
    "wss://deepstream-server-1.herokuapp.com",
    "sketching1",
    "main"
  );
  globalShared = getSharedData("globalShared");
  userMNGR = new UserManager();
}

function setup() {
  createCanvas(windowWidth-(canvasMarginX*2), windowHeight-(canvasMarginY*2));
  sketchingSetup();
  userMNGR.setup();
  //init special user settings
  userMNGR.updateLocalUser(
    {
      'x':mouseX,
      'y':mouseY,
      'path':[], //history
      'color':GetRandomColor().toString()
    }
  )
  const clearButton = createButton("Clear User List").mousePressed(clearClicked);
  const checkbox = createCheckbox('showRaindbow', false);
  checkbox.changed(toggleRainbow);
}
let rainBowOn=false;
function toggleRainbow() {
  if (this.checked()) {
    // console.log('Checking!');
    rainBowOn=true;
  } else {
    // console.log('Unchecking!');
    rainBowOn=false;
  }
}
function clearClicked(){
  userMNGR.clearUsers();
}
function addMouseHistory(mouse){
  let local = userMNGR.getLocalUser();
  let minDis = 10;
  if(local.data.path.length>0){
    let lastMouse = createVector(local.data.path[local.data.path.length - 1].x, local.data.path[local.data.path.length - 1].y);
    let newMouse = createVector(mouse.x, mouse.y);
    if(lastMouse.dist(newMouse) > minDis){
      local.data.path.push(mouse);
    }
  }else{
    local.data.path.push(mouse);
  }
  while(local.data.path.length>20){
    local.data.path.shift();
  }
}

function draw() {
  background(0);
  noStroke();

  let mouse = {
    'x':mouseX,
    'y':mouseY
  }
  addMouseHistory(mouse);
  
  //update local user data
  userMNGR.updateLocalUser({
    'x':mouseX,
    'y':mouseY,
    'lastPing':Date.now()
  });
  if(rainBowOn){
    drawUserRainbow();
  }
  drawCursors();
}

function mousePressed(e) {
  //nothing
}

function windowResized() {
  resizeCanvas(windowWidth-(canvasMarginX*2), windowHeight-(canvasMarginY*2));
}


//*
/////////////////////////////////////
//User Manager Class
class UserManager {
  
  //called in preload
  constructor() {
    this.ns="";
    this.shared = getSharedData(this.ns + "UserManager")
    this.localUserUUID=this.uuidv4();
    
    this.localUser = getSharedData(this.ns + this.localUserUUID);
    this.remoteUsers={}; //dictionary of shared objects | only remote users (not local user)

    this.refreshUsersTimeout=4000; //4 seconds
    this.refreshTimer;
  }
  //setup
  //called from setup
  setup(initData) {
    if(initData!=null){
      this.localUser.data = initData;
    }else{
      this.localUser.data = {
        uuid:this.localUserUUID,
        lastPing:Date.now(),
      }
    }
    console.log("setting up user ids here!");
    this.shared.userIds = this.shared.userIds || [];
    this.shared.userIds.push(this.localUserUUID);
    var _this = this;
    this.refreshTimer = setInterval(function(){
        _this.refreshUsers();
      },
      2000
    );
  }
  uuidv4() {
    let base = 'xxxxxyxx';
    return base.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  refreshUsers(){
    console.log("refreshUsers() count:" + this.shared.userIds.length);
    // console.log("length: " + this.shared.userIds.length)
    for(const userID of this.shared.userIds){
      this.addRemoteUser(userID)
    }
    // let timeout=4000; //milli seconds
    if(isHost()){
      //clear out old/unused users
      let now = Date.now();
      for(let i= this.shared.userIds.length-1; i>=0; i--){
        let data = this.getUserData(this.shared.userIds[i]);
        if(data!=null){
          if(data.lastPing < now - this.refreshUsersTimeout){
            //remove from the list
            console.log('user timed out remove:' + this.shared.userIds[i]);
            this.shared.userIds.splice(i, 1);
          }
        }else{
          console.log('data is null:' + this.shared.userIds[i]);
        }
      }
    }
  }
  addRemoteUser(userID){
    // console.log('userID:' +userID);
    if(userID != this.localUserUUID && (this.remoteUsers[userID]==null || this.remoteUsers[userID]==undefined)){
      // tempUsers!=undefined 
      console.log("adding remote user:" + userID);
      // console.log(this.remoteUsers[userID]);
      this.remoteUsers[userID] = getSharedData(this.ns +userID);
      // console.log(this.remoteUsers[userID]);
    }
  }
  //main methods/accessors
  getUserData(userID){
    let u = this.getUser(userID);
    if(u){
      return u.data;
    }
    return null;
  }
  getUser(userID){
    if(userID == this.localUserUUID){
      return this.localUser;
    }
    if(this.remoteUsers[userID]!=null && this.remoteUsers[userID]!=undefined){
      return this.remoteUsers[userID];
    }
    return null;
  }
  updateLocalUser(data, merge=true){
    if(merge){
      //nothing
      for(const prop in data){
        this.getLocalUser().data[prop] = data[prop];
      }
    }else{
      this.getLocalUser.data = data;
    }
    //look at data and merge with current data.. do not replace
  }
  getLocalUser(){
    return this.getUser(this.localUserUUID);
  }
  getRemoteUsersList(){
    return this.remoteUsers;
  }
  //get string ids for all users
  getAllUserIds(){
    return this.shared.userIds;
  }
  clearUsers(){
    if(isHost()){
      console.log("clearing server before: " + this.shared.userIds.length);
      this.shared.userIds = [];
      console.log("clearing server after: " + this.shared.userIds.length);
    }else{
      console.log('only host can clear users');
    }
  }
}
/////////////////////////////////////
//*/