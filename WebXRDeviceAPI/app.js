/*
 * Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Query for WebXR support. If there's no support for the `immersive-ar` mode,
 * show an error.
 */
//window load time check
var ismodelPlaced = false;
var firstAnchor = false; //reticle 처음 로딩된거

var anchorLoadingStart, anchorLoadingEnd, modelLoadingStart, modelLoadingEnd;
var ThreeDModel,originSize;


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

(async function() {
  const isArSessionSupported =
      navigator.xr &&
      navigator.xr.isSessionSupported &&
      await navigator.xr.isSessionSupported("immersive-ar");
  if (isArSessionSupported) {
    document.getElementById("enter-ar").addEventListener("click", window.app.activateXR)
  } else {
    onNoXRDevice();
  }
})();

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */
class App {
  /**
   * Run when the Start AR button is pressed.
   */
  activateXR = async () => {
    try {
      /** Initialize a WebXR session using "immersive-ar". */
      // this.xrSession = await navigator.xr.requestSession("immersive-ar");
      /** Alternatively, initialize a WebXR session using extra required features. */
      //페이지 로딩시간 시간재기
      anchorLoadingStart = performance.now();
      infotime.innerHTML = '00ms';
      infostatus.innerHTML = "---";
      
      this.xrSession = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      });

      /** Create the canvas that will contain our camera's background and our virtual scene. */
      this.createXRCanvas();

      /** With everything set up, start the app. */
      await this.onSessionStarted();
    } catch(e) {
      console.log(e);
      onNoXRDevice();
    }
  }

  /**
   * Add a canvas element and initialize a WebGL context that is compatible with WebXR.
   */
  createXRCanvas() {
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);
    this.gl = this.canvas.getContext("webgl", {xrCompatible: true});

    this.xrSession.updateRenderState({
      baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
    });
  }

  /**
   * Called when the XRSession has begun. Here we set up our three.js
   * renderer, scene, and camera and attach our XRWebGLLayer to the
   * XRSession and kick off the render loop.
   */
  onSessionStarted = async () => {
    /** Add the `ar` class to our body, which will hide our 2D components. */
    document.body.classList.add('ar');

    /** To help with working with 3D on the web, we'll use three.js. */
    this.setupThreeJs();

    /** Setup an XRReferenceSpace using the "local" coordinate system. */
    this.localReferenceSpace = await this.xrSession.requestReferenceSpace('local');

    /** Create another XRReferenceSpace that has the viewer as the origin. */
    this.viewerSpace = await this.xrSession.requestReferenceSpace('viewer');

    /** Perform hit testing using the viewer as origin. */
    this.hitTestSource = await this.xrSession.requestHitTestSource({ 
      space: this.viewerSpace 
    });

    /** Start a rendering loop using this.onXRFrame. */
    this.xrSession.requestAnimationFrame(this.onXRFrame);

    // this.xrSession.addEventListener("select", this.onSelect);
    document.getElementById("tap-to-place").addEventListener('click', () => { // 놓는 버튼
      modelLoadingStart = performance.now(); //모델 로드 시작
      infotime.innerHTML= '00ms';
      this.onSelect();
  });
  }

  /**
   * Called on the XRSession's requestAnimationFrame.
   * Called with the time and XRPresentationFrame.
   */
  onXRFrame = (time, frame) => {
    /** Queue up the next draw request. */
    this.xrSession.requestAnimationFrame(this.onXRFrame);

    /** Bind the graphics framebuffer to the baseLayer's framebuffer. */
    const framebuffer = this.xrSession.renderState.baseLayer.framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)
    this.renderer.setFramebuffer(framebuffer);

    /** Retrieve the pose of the device.
     * XRFrame.getViewerPose can return null while the session attempts to establish tracking. */
    const pose = frame.getViewerPose(this.localReferenceSpace);
    if (pose) {
      /** In mobile AR, we only have one view. */
      const view = pose.views[0];
    //
      const viewport = this.xrSession.renderState.baseLayer.getViewport(view);
      this.renderer.setSize(viewport.width, viewport.height)
    //
      /** Use the view's transform matrix and projection matrix to configure the THREE.camera. */
      this.camera.matrix.fromArray(view.transform.matrix)
      this.camera.projectionMatrix.fromArray(view.projectionMatrix);
      this.camera.updateMatrixWorld(true);
      //
      //   /** Conduct hit test. */
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);
      console.log("hittest중");

      //   /** If we have results, consider the environment stabilized. */
      if (this.reticle && !ismodelPlaced && this.ThreeDModel) {
        if (!firstAnchor) {//처음 앵커가 로드 될때
          infostatus.innerHTML = "anchor-loading";
          anchorLoadingEnd = performance.now();
          infotime.innerHTML = anchorLoadingEnd - anchorLoadingStart + 'ms';
          firstAnchor = true;
        }
      }
      if (!this.stabilized && hitTestResults.length > 0) {
        this.stabilized = true;
        document.body.classList.add('stabilized');
        document.getElementById("transform-controls").style.display = 'block';
      }
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(this.localReferenceSpace);
    //
    //     /** Update the reticle position. */
        this.reticle.visible = true;
        this.reticle.scale.set(0.002,  0.002, 0.002);
      if(!ismodelPlaced){
        this.reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
      }
        this.reticle.updateMatrixWorld(true);
      }
    //   /** Render the scene with THREE.WebGLRenderer. */
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Initialize three.js specific rendering code, including a WebGLRenderer,
   * a demo scene, and a camera for viewing the 3D content.
   */
  setupThreeJs() {
    /** To help with working with 3D on the web, we'll use three.js.
     * Set up the WebGLRenderer, which handles rendering to our session's base layer. */
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: this.canvas,
      context: this.gl
    });
    this.renderer.autoClear = false;
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    /** Initialize our demo scene. */
    // this.scene = DemoUtils.createCubeScene();
    this.scene = DemoUtils.createLitScene();
    this.reticle = new Reticle();
    this.scene.add(this.reticle);
    const ThreeDModelgltfLoader = new THREE.GLTFLoader();
    ThreeDModelgltfLoader.load("../Unity/StreamingAssets/greenmodel.glb", (gltf) => {//../greenmodel.glb", (gltf) => {
        this.ThreeDModel = gltf.scene;
        // ThreeDModel.traverse((child) => {
        //     if (child.material) {
        //         console.log("ThreeDModel updating material");
        //         child.material.envMap = envMap;
        //         child.material.needsUpdate = true;
        //     }
        // });

        //크기 조정
        originSize = 1;//0.002;
        this.ThreeDModel.scale.set(originSize, originSize, originSize);

        this.scene.add(this.ThreeDModel);//ver2

    });
    /** We'll update the camera matrices directly from API, so
     * disable matrix auto updates so three.js doesn't attempt
     * to handle the matrices independently. */
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
  }

  /** Place a sunflower when the screen is tapped. */
  onSelect = () => {
    var placeButton = document.getElementById("tap-to-place");
    if(placeButton.value === "placeModel"){//모델 편집완료를 눌렀을때 
        infostatus.innerHTML = "---";
        console.log("placeModel");
        //기능
        ismodelPlaced = true;//hittest멈춤

        //ver2 y position의 움직임
        // scene.remove(reticle);//reticle 제거
        this.reticle.position.copy(this.reticle.position);
        this.ThreeDModel.position.copy(this.reticle.position);

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
    // if (window.sunflower) {
    //   const clone = window.sunflower.clone();
    //   clone.position.copy(this.reticle.position);
    //   this.scene.add(clone)
  
    //   // const shadowMesh = this.scene.children.find(c => c.name === 'shadowMesh');
    //   // shadowMesh.position.y = clone.position.y;
    // }
  }
}

window.app = new App();
