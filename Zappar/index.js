import * as THREE from 'https://cdn.skypack.dev/three@0.127.0';//'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
//window load time check
const infotime = document.getElementById("total-time");
const infostatus = document.getElementById("status");
var anchorLoadingStart, anchorLoadingEnd, modelLoadingStart, modelLoadingEnd;
var ismodelPlaced = false;
var firstAnchor = false; //reticle 처음 로딩된거
let hasPlaced = false;


window.onload = function(){

    setTimeout(function () {

        // var t = performance.timing.loadEventEnd - performance.timing.responseEnd;
        var now = new Date().getTime();
        var page_load_time = now - performance.timing.navigationStart;
        infostatus.innerHTML  = "website-loading-time";
        infotime.innerHTML = page_load_time+ 'ms';
        console.log("website-loading-time",page_load_time);


    }, 0);

}
//frame 세기
var before,now,fps;
var resultfps ="";

let frame=0;
const fpstext = document.getElementById("fps-text");
before=Date.now();
fps=0;

requestAnimationFrame(
    function loop(){
        now=Date.now();
        var diff = now-before;
        frame +=1;
        if(diff>1000){
            fps=frame;
            before=now;
            fpstext.innerHTML = "FPS:" + fps;
            resultfps = resultfps+ fps+",";
            fps=0;
            frame =0;
        }
        requestAnimationFrame(loop);

    }

 );
 document.getElementById("fpsbutton").addEventListener('click', () => { // 놓는 버튼
    console.log(resultfps)
    alert(resultfps)

});
// Setup ThreeJS in the usual way
var reticle,ThreeDModel,originSize;
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(render);

// Setup a Zappar camera instead of one of ThreeJS's cameras
const camera = new ZapparThree.Camera();



// The Zappar library needs your WebGL context, so pass it
ZapparThree.glContextSet(renderer.getContext());

// Create a ThreeJS Scene and set its background to be the camera background texture
const scene = new THREE.Scene();
scene.background = camera.backgroundTexture;
// Add some lights
const hemisphereLight = new THREE.HemisphereLight(0xbbbbff, 0x444422);
scene.add(hemisphereLight);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);
// Request the necessary permission from the user
ZapparThree.permissionRequestUI().then((granted) => {

    if (granted) {//허용하면 카메라 켜짐
        // document.getElementById("initializing").style.display = 'block';
        console.log("카메라 허용");
        camera.start();
        //페이지 로딩시간 시간재기
        anchorLoadingStart = performance.now();
        infotime.innerHTML = '00ms';
        infostatus.innerHTML = "---";
    }
    else ZapparThree.permissionDeniedUI();
});

// Set up our instant tracker group
const tracker = new ZapparThree.InstantWorldTracker();
const trackerGroup = new ZapparThree.InstantWorldAnchorGroup(camera, tracker);
scene.add(trackerGroup);

// Add some content


// const box = new GLTFLoader();
// box.load("../reticle2D.glb", (gltf)=> {
//     reticle = gltf.scene;
//     reticle.scale.set(0.004,0.004,0.004);
//     trackerGroup.add(reticle);
//     if(!firstAnchor){
//         infostatus.innerHTML =  "anchor-loading";
//         anchorLoadingEnd = performance.now();
//         infotime.innerHTML = anchorLoadingEnd-anchorLoadingStart+ 'ms';
//         firstAnchor=true;
//     }
//     // trackerGroup.add(gltf.scene);
//     document.getElementById("initializing").style.display = 'none';
//     document.getElementById("transform-controls").style.display = 'block';

//     document.getElementById("tap-to-place").addEventListener('click', () => { // 놓는 버튼
//         modelLoadingStart = performance.now(); //모델 로드 시작
//         infotime.innerHTML= '00ms';
//         placemodel();
//         hasPlaced = true;
//     });

// });
// const ThreeDModelgltfLoader = new GLTFLoader();
// ThreeDModelgltfLoader.load("../greenmodel.glb", (gltf) => {
//     ThreeDModel = gltf.scene;

//     //크기 조정
//     originSize = 0.004;
//     ThreeDModel.scale.set(originSize, originSize, originSize);

//     // scene.add(ThreeDModel);//ver2

// });


// Set up our render loop
function render() {
    camera.updateFrame(renderer);

    if (!hasPlaced) tracker.setAnchorPoseFromCameraOffset(0, 0, -5);

    renderer.render(scene, camera);
}

function placemodel() {
    var placeButton = document.getElementById("tap-to-place");
    if(placeButton.value === "placeModel"){//모델 편집완료를 눌렀을때 
        infostatus.innerHTML = "---";
        console.log("placeModel");
        //기능
        ismodelPlaced = true;//hittest멈춤

        //ver2 y position의 움직임
        // scene.remove(reticle);//reticle 제거

        trackerGroup.add(ThreeDModel);
        reticle.position.copy(reticle.position);
        ThreeDModel.position.copy(reticle.position);
        modelLoadingEnd = performance.now();
        infostatus.innerHTML =  "model-loading";
        infotime.innerHTML = modelLoadingEnd-modelLoadingStart+ 'ms';

        placeButton.style.display = "none";

    }else{//replace
        console.log("replace");

        //replace 내용 다시 짜야함
        ismodelPlaced = false;

        //ver2 y position의 움직임
        scene.add(reticle);//reticle 보이게 하기


    }
}
