// ====== Imports ======

import OnirixSDK from "https://sdk.onirix.com/0.3.0/ox-sdk.esm.js";
import * as THREE from 'https://cdn.skypack.dev/three@0.127.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';

//window load time check
const infotime = document.getElementById("total-time");
const infostatus = document.getElementById("status");
// console.dir(infostatus);

window.onload = function(){

    setTimeout(function () {

        // var t = performance.timing.loadEventEnd - performance.timing.responseEnd;
        var now = new Date().getTime();
        var page_load_time = now - performance.timing.navigationStart;
        infostatus.innerHTML  = "website-loading-time";
        infotime.innerHTML = page_load_time+ 'ms';


    }, 0);

}
//끝까지 버튼 검색이 안되네!!!! 킹받게
// console.log(document.getElementById('ox-permissions-dialog-ok-button') ? true : false);
// const temp = document.getElementsByTagName("button");//getElementById("ox-permissions-dialog-ok-button");
// console.dir(temp);
// for(var i =0;i<temp.length;i++){
//     temp[i].addEventListener('click', () => { // 놓는 버튼
//         console.log("지금 시간: " + performance.now() );
//     });
// }
// console.log(document.getElementById('ox-permissions-dialog-ok-button') ? true : false);

// ====== ThreeJS ======

var renderer, scene, camera, floor, reticle, envMap, ThreeDModel,clock, animationMixers, action, mixer, originSize;
var ismodelPlaced = false;
// var isreticlePlaced = false;
var anchorLoadingStart, anchorLoadingEnd, modelLoadingStart, modelLoadingEnd;

function setupRenderer(rendererCanvas) {
    
    const width = rendererCanvas.width;
    const height = rendererCanvas.height;
    
    // Initialize renderer with rendererCanvas provided by Onirix SDK
    renderer = new THREE.WebGLRenderer({ canvas: rendererCanvas, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // Ask Onirix SDK for camera parameters to create a 3D camera that fits with the AR projection.
    const cameraParams = OX.getCameraParameters();
    camera = new THREE.PerspectiveCamera(cameraParams.fov, cameraParams.aspect, 0.1, 1000);
    camera.matrixAutoUpdate = false;
    
    // Create an empty scene
    scene = new THREE.Scene();
    
    // Add some lights
    const hemisphereLight = new THREE.HemisphereLight(0xbbbbff, 0x444422);
    scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Load env map
    const textureLoader = new THREE.TextureLoader();
    envMap = textureLoader.load('envmap.jpg');
	envMap.mapping = THREE.EquirectangularReflectionMapping;
    envMap.encoding = THREE.sRGBEncoding;

    // Add transparent floor to generate shadows
    floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide
        })
    );
  
    // Rotate floor to be horizontal
    floor.rotateX(Math.PI / 2)

    // //animation
    // animationMixers = [];
    // clock = new THREE.Clock(true);

}

function updatePose(pose) {

    // When a new pose is detected, update the 3D camera
    let modelViewMatrix = new THREE.Matrix4();
    modelViewMatrix = modelViewMatrix.fromArray(pose);
    camera.matrix = modelViewMatrix;
    camera.matrixWorldNeedsUpdate = true;

    render();

}

function onResize() {

    // When device orientation changes, it is required to update camera params.
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const cameraParams = OX.getCameraParameters();
    camera.fov = cameraParams.fov;
    camera.aspect = cameraParams.aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

}

function render() {

    // Just render the scene
    renderer.render(scene, camera);
}
function renderLoop() {

        // // Update model animations at a fixed framerate (delta time)
        // const delta = clock.getDelta();
        // animationMixers.forEach(mixer => {
        //     mixer.update(delta);
        // });

        render();
        requestAnimationFrame(() => renderLoop());

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
});
var firstAnchor = false; //reticle 처음 로딩된거

function onHitResult(hitResult) {
    if (reticle && !ismodelPlaced && ThreeDModel) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById("transform-controls").style.display = 'block';

        reticle.position.copy(hitResult.position);
        if(!firstAnchor){
            infostatus.innerHTML =  "anchor-loading";
            anchorLoadingEnd = performance.now();
            infotime.innerHTML = anchorLoadingEnd-anchorLoadingStart+ 'ms';
            firstAnchor=true;
        }

        // action.play();


    }else if(!ThreeDModel){//모델이 로딩중
        // var loadingText = document.createElement('h1');
        // loadingText.innerHTML = '로딩중입니다...'
        document.getElementById('loading').style.display = 'block';
    }
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



// ====== Onirix SDK ======
let OX = new OnirixSDK("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUyMDIsInByb2plY3RJZCI6MTQ0MjgsInJvbGUiOjMsImlhdCI6MTYxNjc1ODY5NX0.8F5eAPcBGaHzSSLuQAEgpdja9aEZ6Ca_Ll9wg84Rp5k");

let config = {
    mode: OnirixSDK.TrackingMode.Surface
}

OX.init(config).then(rendererCanvas => {
    //페이지 로딩시간 시간재기
    anchorLoadingStart = performance.now();
    infotime.innerHTML= '00ms';
    infostatus.innerHTML = "---";
    // Setup ThreeJS renderer
    setupRenderer(rendererCanvas);

    // Initialize render loop //왜 여기에 했는지 사실 모름
    renderLoop();
    // fpscheck();

    const gltfLoader = new GLTFLoader();
    gltfLoader.load("../reticle2D.glb", (gltf) => {
        
        reticle = gltf.scene;
        reticle.traverse((child) => {
            if (child.material) {
                console.log("updating material");
                child.material.envMap = envMap;
                child.material.needsUpdate = true;
            }
        });
        reticle.scale.set(0.002,0.002,0.002);
        scene.add(reticle);
        
        // All loaded, so hide loading screen
        document.getElementById("loading-screen").style.display = 'none';

        document.getElementById("initializing").style.display = 'block';

        document.getElementById("tap-to-place").addEventListener('click', () => { // 놓는 버튼
            modelLoadingStart = performance.now(); //모델 로드 시작
            infotime.innerHTML= '00ms';
            placemodel();
        });
    });

    //ThreeDModel loader 도 있어야함 
    //../bee-gltf/source/bee_gltf.gltf
    const ThreeDModelgltfLoader = new GLTFLoader();
    ThreeDModelgltfLoader.load("../greenmodel.glb", (gltf) => {
        ThreeDModel = gltf.scene;
        ThreeDModel.traverse((child) => {
            if (child.material) {
                console.log("ThreeDModel updating material");
                child.material.envMap = envMap;
                child.material.needsUpdate = true;
            }
        });

        //크기 조정
        originSize = 0.002;
        ThreeDModel.scale.set(originSize, originSize, originSize);

        scene.add(ThreeDModel);//ver2

    });


    OX.subscribe(OnirixSDK.Events.OnPose, function (pose) {
        updatePose(pose);
    });

    OX.subscribe(OnirixSDK.Events.OnResize, function () {
        onResize();
    });



    OX.subscribe(OnirixSDK.Events.OnHitTestResult, function (hitResult) {
        document.getElementById("initializing").style.display = 'none';
        onHitResult(hitResult);
    });

}).catch((error) => {

    // An error ocurred, chech error type and display it
    document.getElementById("loading-screen").style.display = 'none';

    switch (error.name) {

        case 'INTERNAL_ERROR':
            document.getElementById("error-title").innerText = 'Internal Error';
            document.getElementById("error-message").innerText = 'An unespecified error has occurred. Your device might not be compatible with this experience.';
            break;

        case 'CAMERA_ERROR':
            document.getElementById("error-title").innerText = 'Camera Error';
            document.getElementById("error-message").innerText = 'Could not access to your device\'s camera. Please, ensure you have given required permissions from your browser settings.';
            break;

        case 'SENSORS_ERROR':
            document.getElementById("error-title").innerText = 'Sensors Error';
            document.getElementById("error-message").innerText = 'Could not access to your device\'s motion sensors. Please, ensure you have given required permissions from your browser settings.';
            break;

        case 'LICENSE_ERROR':
            document.getElementById("error-title").innerText = 'License Error';
            document.getElementById("error-message").innerText = 'This experience does not exist or has been unpublished.';
            break;

    }

    document.getElementById("error-screen").style.display = 'flex';

});