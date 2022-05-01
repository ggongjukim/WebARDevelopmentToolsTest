// Copyright (c) 2021 8th Wall, Inc.

// Returns a pipeline module that initializes the threejs scene when the camera feed starts, and
// handles subsequent spawning of a glb model whenever the scene is tapped.

/* globals XR8 XRExtras THREE TWEEN */

var anchorLoadingStart, anchorLoadingEnd, modelLoadingStart, modelLoadingEnd;
const infotime = document.getElementById("total-time");
const infostatus = document.getElementById("status");
// console.dir(infostatus);

window.onload = function () {

  setTimeout(function () {

    // var t = performance.timing.loadEventEnd - performance.timing.responseEnd;
    var now = new Date().getTime();
    var page_load_time = now - performance.timing.navigationStart;
    infostatus.innerHTML = "website-loading-time";
    infotime.innerHTML = page_load_time + 'ms';


  }, 0);

}
//frame 세기

var before, now, fps;
var resultfps = "";

let frame = 0;
const fpstext = document.getElementById("fps-text");
before = Date.now();
fps = 0;

requestAnimationFrame(
  function loop() {
    now = Date.now();
    var diff = now - before;
    frame += 1;
    if (diff > 1000) {
      fps = frame;
      before = now;
      fpstext.innerHTML = "FPS:" + fps;
      resultfps = resultfps + fps + ",";
      fps = 0;
      frame = 0;
    }
    requestAnimationFrame(loop);

  }

);
document.getElementById("fpsbutton").addEventListener('click', () => { // 놓는 버튼
  console.log(resultfps)
});
const placegroundScenePipelineModule = () => {
  var reticle, ThreeDModel;
  var firstAnchor = false;
  var isModel = false;
  const modelFile = '../reticle2D.glb'                            // 3D model to spawn at tap
  const startScale = new THREE.Vector3(0.01, 0.01, 0.01)  // Initial scale value for our model
  const endScale = new THREE.Vector3(0.002, 0.002, 0.002)             // Ending scale value for our model
  const animationMillis = 750                             // Animate over 0.75 seconds

  const raycaster = new THREE.Raycaster()
  const tapPosition = new THREE.Vector2()
  const loader = new THREE.GLTFLoader()  // This comes from GLTFLoader.js.

  let surface  // Transparent surface for raycasting for object placement.

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({ scene, camera, renderer }) => {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const light = new THREE.DirectionalLight(0xffffff, 1, 100)
    light.position.set(1, 4.3, 2.5)  // default

    scene.add(light)  // Add soft white light to the scene.
    scene.add(new THREE.AmbientLight(0x404040, 5))  // Add soft white light to the scene.

    light.shadow.mapSize.width = 1024  // default
    light.shadow.mapSize.height = 1024  // default
    light.shadow.camera.near = 0.5  // default
    light.shadow.camera.far = 500  // default
    light.castShadow = true

    surface = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 1, 1),
      new THREE.ShadowMaterial({
        opacity: 0.5,
      })
    )

    surface.rotateX(-Math.PI / 2)
    surface.position.set(0, 0, 0)
    surface.receiveShadow = true
    scene.add(surface)

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0)
  }

  const animateIn = (model, pointX, pointZ, yDegrees) => {
    const scale = { ...startScale }

    model.scene.rotation.set(0.0, yDegrees, 0.0)
    model.scene.position.set(pointX, 0.0, pointZ)
    model.scene.scale.set(scale.x, scale.y, scale.z)
    // model.scene.children[0].children[0].children[0].castShadow = true
    XR8.Threejs.xrScene().scene.add(model.scene)

    new TWEEN.Tween(scale)
      .to(endScale, animationMillis)
      .easing(TWEEN.Easing.Elastic.Out)  // Use an easing function to make the animation smooth.
      .onUpdate(() => {
        model.scene.scale.set(scale.x, scale.y, scale.z)
      })
      .start()  // Start the tween immediately.
  }

  // Load the glb model at the requested point on the surface.
  const placeObject = (pointX, pointZ) => {
    loader.load(
      modelFile,  // resource URL.
      (gltf) => {
        // animateIn(gltf, pointX, pointZ, Math.random() * 360)
        gltf.scene.position.set(pointX, 0.0, pointZ)
        gltf.scene.scale.set(0.002, 0.002, 0.002)
        XR8.Threejs.xrScene().scene.add(model.scene)

      }
    )
  }
  const placemodel = () => {
    if (!isModel) {
      XR8.Threejs.xrScene().scene.add(ThreeDModel);
      reticle.position.copy(reticle.position);
      ThreeDModel.position.copy(reticle.position);
      modelLoadingEnd = performance.now();
      isModel = true;
    }

    // infostatus.innerHTML =  "model-loading";
    // infotime.innerHTML = modelLoadingEnd-modelLoadingStart+ 'ms';
  }

  // const placeObjectTouchHandler = (e) => {
  //   // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
  //   // AR camera to the position specified by XrController.updateCameraProjectionMatrix() above.
  //   if (e.touches.length === 2) {
  //     XR8.XrController.recenter()
  //   }

  //   if (e.touches.length > 2) {
  //     return
  //   }

  //   // If the canvas is tapped with one finger and hits the "surface", spawn an object.
  //   const {camera} = XR8.Threejs.xrScene()

  //   // calculate tap position in normalized device coordinates (-1 to +1) for both components.
  //   tapPosition.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1
  //   tapPosition.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1

  //   // Update the picking ray with the camera and tap position.
  //   raycaster.setFromCamera(tapPosition, camera)

  //   // Raycast against the "surface" object.
  //   const intersects = raycaster.intersectObject(surface)

  //   if (intersects.length === 1 && intersects[0].object === surface) {
  //     placeObject(intersects[0].point.x, intersects[0].point.z)
  //   }
  // }
  const hittest = (time, frame) => {
    requestAnimationFrame(hittest);
    // If the canvas is tapped with one finger and hits the "surface", spawn an object.
    const { camera } = XR8.Threejs.xrScene()

    // calculate tap position in normalized device coordinates (-1 to +1) for both components.
    tapPosition.x = 0
    tapPosition.y = 0
    raycaster.setFromCamera(tapPosition, camera)

    const intersects = raycaster.intersectObject(surface)
    if (intersects.length === 1 && intersects[0].object === surface) {
      if (!isModel) {
        console.log("hittest중 hittest결과 있음!!!");
        reticle.position.set(intersects[0].point.x, 0.0, intersects[0].point.z)
      }
      if (!firstAnchor) {
        // infostatus.innerHTML =  "anchor-loading";
        anchorLoadingEnd = performance.now();
        // infotime.innerHTML = anchorLoadingEnd-anchorLoadingStart+ 'ms';
        firstAnchor = true;
      }
    }

  }
  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'placeground',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: ({ canvas }) => {
      anchorLoadingStart = performance.now();
      // infotime.innerHTML= '00ms';
      // infostatus.innerHTML = "---";

      const { scene, camera, renderer } = XR8.Threejs.xrScene()  // Get the 3js sceen from xr3js.

      // Add objects to the scene and set starting camera position.
      initXrScene({ scene, camera, renderer })

      // canvas.addEventListener('touchstart', placeObjectTouchHandler, true)  // Add touch listener.

      // // prevent scroll/pinch gestures on canvas
      // canvas.addEventListener('touchmove', (event) => {
      //   event.preventDefault()
      // })

      //ggongjukim
      hittest();
      document.getElementById("transform-controls").style.display = 'block';
      document.getElementById("tap-to-place").addEventListener('click', () => { // 놓는 버튼
        modelLoadingStart = performance.now(); //모델 로드 시작
        // infotime.innerHTML= '00ms';
        placemodel();
      });
      loader.load(
        "../reticle2D.glb",  // resource URL.
        (gltf) => {
          reticle = gltf.scene;
          reticle.scale.set(0.02, 0.02, 0.02);
          scene.add(reticle);
        })
      loader.load(
        "../greenmodel.glb",  // resource URL.
        (gltf) => {
          ThreeDModel = gltf.scene;
          ThreeDModel.scale.set(0.02, 0.02, 0.02);
          // scene.add(ThreeDModel);
        })
      // Enable TWEEN animations.
      const animate = (time) => {
        requestAnimationFrame(animate)
        TWEEN.update(time)
      }

      animate()

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },
  }
}

const onxrloaded = () => {
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    placegroundScenePipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({ canvas: document.getElementById('camerafeed') })
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({ onxrloaded }) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }