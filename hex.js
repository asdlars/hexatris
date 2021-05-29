/*global Phaser*/
/* hexagonal tetris in vertical alignment */
  console.info("Welcome to Hexatris :3");
const config = {
    type: Phaser.AUTO,
    parent: 'TutContainer',
    width: 600,
    height: 1000,
    backgroundColor: '#000000',
    inputKeyboard: true,
    loaderCrossOrigin: "Anonymous",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    //  Open the Dev Tools
    //  The version of your game appears after the title in the banner
    title: 'Hexatris',
    version: '0.1'
};

const game = new Phaser.Game(config);
console.log("POST INIT", game);

function BlockData(topB,topRightB,bottomRightB,bottomB,bottomLeftB,topLeftB){
    //console.log("BlockData");
    this.tBlock=topB;
    this.trBlock=topRightB;
    this.brBlock=bottomRightB;
    this.bBlock=bottomB;
    this.blBlock=bottomLeftB;
    this.tlBlock=topLeftB;
    this.mBlock=1;
}
//Square
var block1  = new BlockData(1,1,0,0,0,1);
var block1Colour = "0xf6ff07";
//Small u
var block2  = new BlockData(0,1,0,0,0,1);
var block2Colour = "0xff0000";
//Radial
var block3  = new BlockData(1,0,1,0,1,0);
var block3Colour = "0xdb0de2";
//L der
var block4  = new BlockData(1,1,0,1,0,0);
var block4Colour = "0xffa500";
//L izq
var block5  = new BlockData(1,0,0,1,0,1);
var block5Colour = "0x0a1afc";
//Bone
var block6  = new BlockData(0,1,1,0,1,1);
var block6Colour = "0xfc0a7b";
//Linea
var block7  = new BlockData(1,0,0,1,0,0);
var block7Colour = "0x0afcf4";
//Punto
var block8  = new BlockData(1,1,0,0,0,0);
var block8Colour = "0xf6f6f6";

var currentBlock= new BlockData(0,0,0,0,0,0);
var prevBlock= new BlockData(0,0,0,0,0,0);

var levelData=
[
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0]
];

var bmpText;
var hexTileHeight=52;
var hexTileWidth=61;
var infoTxt;
var gameScene;//this is the render texture onto which we draw level
var hexSprite;
var score;
var clockWise=true;

var verticalOffset=hexTileHeight;
var horizontalOffset=hexTileWidth*3/4;
var startX;
var startY;
var startXInit=hexTileWidth/2;
var startYInit=hexTileHeight/2;
var axialPoint= new Phaser.Geom.Point();
var cubicZ;

var currentBlockType
var blockMidRowValue;
var blockMidColumnValue;
var needsRender;
var needsClearing;
var elapsedTime;
var blockPresent;
var tickerSpeed = 1200;


function preload() {
    console.log("PRELOAD");
    this.load.crossOrigin='Anonymous';//cross origin fix
    //load all necessary assets
    this.load.bitmapFont('font', 'res/font.png?dl=0', 'res/font.xml?dl=0');
    this.load.image('hex', 'res/hex.png?dl=0');
}

function create() {
    bmpText = this.add.bitmapText(10, 10, 'font', 'Hexatris\nA/D or the Arrows to move sideways\nZ/X to rotate\nTap S or Down arrow to drop one row\nTap W or UP to Drop all the way down.', 18);
    //this.stage.backgroundColor = '#000000';
    this.input.keyboard.on('keyup-W', function () {
        dropAllTheWay();
    });
    this.input.keyboard.on('keyup-UP', function () {
        dropAllTheWay();
    });
    this.input.keyboard.on('keyup-X', function () {
        rotateClockWise();
    });
    this.input.keyboard.on('keyup-Z', function () {
        rotateAntiClockWise();
    });
    this.input.keyboard.on('keyup-A', function () {
        moveLeft();
    });
    this.input.keyboard.on('keyup-LEFT', function () {
        moveLeft();
    });
    this.input.keyboard.on('keyup-D', function () {
        moveRight();
    });
    this.input.keyboard.on('keyup-RIGHT', function () {
        moveRight();
    });
    this.input.keyboard.on('keyup-S', function () {
        dropDown();
    });
    this.input.keyboard.on('keyup-DOWN', function () {
        dropDown();
    });

    hexSprite=this.add.image(-500, -300, 'hex');
    hexSprite.setOrigin(0.5, 0.5);

    hexSprite.rotation=Math.PI/2;

    gameScene=this.add.renderTexture(40, 115, 600,1000);
    infoTxt=this.add.text(300,40,'0');
    infoTxt.setDepth(20);
    infoTxt.setOrigin(0.5, 0.5);

    //Timer event to handle ticks
    ticker = new Phaser.Time.TimerEvent({ delay: tickerSpeed });
    this.time.addEvent(ticker);

    // Maintain aspect ratio
    //game.scale.scaleMode = Phaser.Scale.ScaleManager.SHOW_ALL;
    score=0;
    blockPresent=false;
    releaseBlock();
    needsRender=true;
    needsClearing=false;
    elapsedTime=0.0;
}
function update(){
    //elapsedTime+=this.time.elapsed;
    var tickerSpeed = 1200-(score*2);
    var elapsedTime = ticker.getProgress();
    //prepare tickerSpeed
    if (tickerSpeed<=100) {
      tickerSpeed = 100;
    }


    if(elapsedTime==1){
        elapsedTime=0.0;
        ticker = new Phaser.Time.TimerEvent({ delay: tickerSpeed });
        this.time.addEvent(ticker);
        dropDown();
        if(needsClearing){
            clearRows();
        }
        needsRender=true;
    }
    if(needsRender){
        //check for collision / bottom
        if(!canMove(1,0)){
            paintBlock(false,true);
            blockPresent=false;
            checkAndMarkRows();
            if(!needsClearing){
                releaseBlock();
            }
        }
        renderScene();
    }
}

function getColour() {
		var letters = "0123456789ABCDEF";
    var color = '0x';
    for (var i = 0; i < 2; i++)
       color += letters[(Math.floor(Math.random() * 16))];
    color += '0000';
 return color;

}

function renderScene(){
    paintBlock();
    gameScene.clear();//clear the previous frame then draw again

    for (var i = 0; i < levelData.length; i++)
    {
        startX=startXInit;
        startY=2*startYInit+(i*verticalOffset);
        for (var j = 0; j < levelData[0].length; j++)
        {
            if(j%2!=0){
                startY=startY+startYInit;
            }else{
                startY=startY-startYInit;
            }
            axialPoint.x=i;
            axialPoint.y=j;
            hexSprite.tint='0xffffff';
            if(levelData[i][j]>-1){
                axialPoint=offsetToAxial(axialPoint);
                cubicZ=calculateCubicZ(axialPoint);
                this.temporal = currentBlockType+"Colour";
                if(levelData[i][j]==1){
                  hexSprite.tint = this[temporal];
                }else if(levelData[i][j]==2){
                  hexSprite.tint = this[temporal];
                }else if(levelData[i][j]>2){
                    hexSprite.tint='0x00ffff';
                }
                gameScene.draw(hexSprite,startX, startY);
            }
            startX+=horizontalOffset;
        }

    }
    needsRender=false;
}
function releaseBlock(){
    if(blockPresent)return;
    blockMidRowValue=1;
    blockMidColumnValue=5;
    var whichBlock= Math.floor(1+(Math.random()*7));
    console.log("BLOCK ::: ",whichBlock);
    switch (whichBlock) {//assign blocks
        case 1:
            currentBlock=block1;
            break;
        case 2:
            currentBlock=block2;
            blockMidRowValue=0;
            break;
        case 3:
            currentBlock=block3;
            break;
        case 4:
            currentBlock=block4;
            break;
        case 5:
            currentBlock=block5;
            break;
        case 6:
            currentBlock=block6;
            blockMidRowValue=0;
            break;
        case 7:
            currentBlock=block7;
            break;
        case 8:
            currentBlock=block8;
            break;
        default:

    }
    currentBlockType = "block"+whichBlock;
    if(canMove(0,0)){
        blockPresent=true;
    }else{
       console.log("Game Over!");
    }
    //console.log(whichBlock);
}
//let us use cubic coordinates to simplify the block painting
function paintBlock(erase, cement){
    if(!blockPresent)return;
    var store=clockWise;
    clockWise=true;
    var val=1;
    if(cement){
        val=2;
    }
    changeLevelData(blockMidRowValue,blockMidColumnValue,val,erase);

    var rotatingTile=new Phaser.Geom.Point(blockMidRowValue-1,blockMidColumnValue);
    if(currentBlock.tBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.tBlock,erase);
    }
    var midPoint=new Phaser.Geom.Point(blockMidRowValue,blockMidColumnValue);
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.trBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.trBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.brBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.brBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.bBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.bBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.blBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.blBlock,erase);
    }
    midPoint.x=blockMidRowValue;
    midPoint.y=blockMidColumnValue;
    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
    if(currentBlock.tlBlock==1 || erase){
        changeLevelData(rotatingTile.x,rotatingTile.y,val*currentBlock.tlBlock,erase);
    }
    clockWise=store;
}
function clearRows(){
    var alteredLevel=[[]];
    alteredLevel.pop();
    var rowsToAdd=0;
    for (var i = levelData.length-1; i >-1 ; i--)
    {
        if(levelData[i][0]==5){
            score+=levelData[0].length;
            rowsToAdd++;
        }else{
            alteredLevel.push(levelData[i]);
        }
    }
    for (var i = 0; i < rowsToAdd; i++)
    {
        alteredLevel.push([0,0,0,0,0,0,0,0,0,0,0]);
    }
    levelData=alteredLevel.reverse();
    infoTxt.text=score;
    needsClearing=false;
}
function checkAndMarkRows(){
    var rowComplete=false;
    for (var i = levelData.length-1; i >-1 ; i--)
    {
        rowComplete=true;
        for (var j = 0; j < levelData[0].length; j++)
        {
            if(levelData[i][j]!=2){
                rowComplete=false;
                continue;
            }
        }
        if(rowComplete){
            for (var k = 0; k < levelData[0].length; k++)
            {
                changeLevelData(i,k,5);
                elapsedTime=0;
                needsClearing=true;
            }
        }
    }
}
function changeLevelData(iVal,jVal,newValue,erase){
    if(!validIndexes(iVal,jVal))return;
    if(erase){
        if(levelData[iVal][jVal]==1){
            levelData[iVal][jVal]=0;
        }
    }else{
        levelData[iVal][jVal]=newValue;
    }
}
function validIndexes(iVal,jVal){
    if(iVal<0 || jVal<0 || iVal>=levelData.length || jVal>=levelData[0].length){
        return false;
    }
    return true;
}
function moveLeft(){
    if(!blockPresent)return;
    if(!canMove(0,-1))return;
    paintBlock(true);
    blockMidColumnValue--;
    needsRender=true;
}
function moveRight(){
    if(!blockPresent)return;
    if(!canMove(0,1))return;
    paintBlock(true);
    blockMidColumnValue++;
    needsRender=true;
}
function dropDown(){
    if(!blockPresent)return;
    if(!canMove(1,0))return;
    paintBlock(true);
    blockMidRowValue++;
    needsRender=true;
}
function dropAllTheWay() {
  while (canMove(2,0) && blockPresent) {
    paintBlock(true);
    blockMidRowValue++;
  }
  needsRender=true;
}
function validAndEmpty(iVal,jVal){
    if(!validIndexes(iVal,jVal)){
        return false;
    }else if(levelData[iVal][jVal]>1){//occuppied
        return false;
    }
    return true;
}
function canMove(iVal,jVal){
    var validMove=true;

    var store=clockWise;
    var newBlockMidPoint=new Phaser.Geom.Point(blockMidRowValue+iVal,blockMidColumnValue+jVal);
    clockWise=true;
    if(!validAndEmpty(newBlockMidPoint.x,newBlockMidPoint.y)){//check mid, always 1
        validMove=false;
    }

    var rotatingTile=new Phaser.Geom.Point(newBlockMidPoint.x-1,newBlockMidPoint.y);
    if(currentBlock.tBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){//check top
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.trBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.brBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.bBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.blBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }
    newBlockMidPoint.x=blockMidRowValue+iVal;
    newBlockMidPoint.y=blockMidColumnValue+jVal;
    rotatingTile=rotateTileAroundTile(rotatingTile,newBlockMidPoint);
    if(currentBlock.tlBlock==1){
        if(!validAndEmpty(rotatingTile.x,rotatingTile.y)){
            validMove=false;
        }
    }

    clockWise=store;
    return validMove;
}
function rotateClockWise(){
    if(!blockPresent)return;
    clockWise=true;
    prevBlock=currentBlock;
    rotateBlock();
    if(!canMove(0,0)){
        currentBlock=prevBlock;
        return;
    }else{
        paintBlock(true);
    }
    needsRender=true;
}
function rotateAntiClockWise(){
    if(!blockPresent)return;
    clockWise=false;
    prevBlock=currentBlock;
    rotateBlock();
    if(!canMove(0,0)){
        currentBlock=prevBlock;
        return;
    }else{
        paintBlock(true);
    }
    needsRender=true;
}
function rotateBlock(){
    var midPoint=new Phaser.Geom.Point(1,1);
    var newBlockData=
    [
    [0,0,0],
    [0,1,0],
    [0,0,0]
    ];
    var currentBlockData=arrayFromBlock(currentBlock);

    var rotatingTile=new Phaser.Geom.Point();
    for (var i = 0; i < currentBlockData.length; i++){
            for (var j = 0; j < currentBlockData[0].length; j++)
            {
                if(currentBlockData[i][j]==1){//find every solid tile & rotate
                    rotatingTile.x=i;
                    rotatingTile.y=j;
                    rotatingTile=rotateTileAroundTile(rotatingTile,midPoint);
                    newBlockData[rotatingTile.x][rotatingTile.y]=1;//populate new blockArray
                }
            }
    }
    currentBlock=blockFromArray(newBlockData);
}
function rotateTileAroundTile(tileToRotate, anchorTile){
    tileToRotate=offsetToAxial(tileToRotate);//convert to axial
    var tileToRotateZ=calculateCubicZ(tileToRotate);//find z value
    anchorTile=offsetToAxial(anchorTile);//convert to axial
    var anchorTileZ=calculateCubicZ(anchorTile);//find z value
    tileToRotate.x=tileToRotate.x-anchorTile.x;//find x difference
    tileToRotate.y=tileToRotate.y-anchorTile.y;//find y difference
    tileToRotateZ=tileToRotateZ-anchorTileZ;//find z difference
    var pointArr=[tileToRotate.x,tileToRotate.y,tileToRotateZ];//populate array to rotate
    pointArr=arrayRotate(pointArr,clockWise);//rotate array, true for clockwise
    tileToRotate.x=(-1*pointArr[0])+anchorTile.x;//multiply by -1 & remove the x difference
    tileToRotate.y=(-1*pointArr[1])+anchorTile.y;//multiply by -1 & remove the y difference
    tileToRotate=axialToOffset(tileToRotate);//convert to offset
    return tileToRotate;
}
function offsetToAxial(offsetPt){
    offsetPt.x=(offsetPt.x-(Math.floor(offsetPt.y/2)));//display x = coordinate x' - floor(y/2)
    return offsetPt;
}
function axialToOffset(axialPt){
    axialPt.x=(axialPt.x+(Math.floor(axialPt.y/2)));//coordinate x = display x' + floor(y/2)
    return axialPt;
}
function calculateCubicZ(newAxialPoint){
    return -newAxialPoint.x-newAxialPoint.y;
}
function arrayRotate(arr, reverse){//nifty method to rotate array elements
  if(reverse)
    arr.unshift(arr.pop())
  else
    arr.push(arr.shift())
  return arr
}
function blockFromArray(arrayToConvert){
    return new BlockData(
        arrayToConvert[0][1],
        arrayToConvert[1][2],
        arrayToConvert[2][2],
        arrayToConvert[2][1],
        arrayToConvert[2][0],
        arrayToConvert[1][0]
    );
}
function arrayFromBlock(blockToConvert){
    var newBlockData=
    [
    [0,0,0],
    [0,1,0],
    [0,0,0]
    ];
    newBlockData[0][1]=blockToConvert.tBlock;
    newBlockData[1][2]=blockToConvert.trBlock;
    newBlockData[2][2]=blockToConvert.brBlock;
    newBlockData[2][1]=blockToConvert.bBlock;
    newBlockData[2][0]=blockToConvert.blBlock;
    newBlockData[1][0]=blockToConvert.tlBlock;
    return newBlockData;
}
