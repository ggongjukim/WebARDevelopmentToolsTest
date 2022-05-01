

<!doctype html>
<html>

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>8th Wall Web: three.js</title>
  <link rel="stylesheet" type="text/css" href="index.css">

  <!-- THREE.js must be supplied -->
  <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/r123/three.min.js"></script>

  <!-- Required to load glTF (.gltf or .glb) models -->
  <script src="//cdn.rawgit.com/mrdoob/three.js/r123/examples/js/loaders/GLTFLoader.js"></script>

  <!-- Javascript tweening engine -->
  <script src="//cdnjs.cloudflare.com/ajax/libs/tween.js/16.3.5/Tween.min.js"></script>

  <!-- XR Extras - provides utilities like load screen, almost there, and error handling.
         See github.com/8thwall/web/tree/master/xrextras -->
  <script src="//cdn.8thwall.com/web/xrextras/xrextras.js"></script>

  <!-- 8thWall Web - Replace the app key here with your own app key -->
  <script async
    src="//apps.8thwall.com/xrweb?appKey=6N7iVGnNfiKmVpWnSLrLW3CRKo5tcgHayBaxTUV8SsdvYMlEwbww3W3L5uEoLOu6GXqmcU"></script>

  <!-- client code -->
  <script src="index.js"></script>
  <link rel="stylesheet" href="../init.css" />

</head>

<body>
  <canvas id="camerafeed"></canvas>

  <div id="test-info">
    <div id="box" class="EightthWall">
      <div>EightthWall</div>
      <div id="status">---</div>
      <div id="total-time">00ms</div>
      <div id="fps-text">FPS:</div>
    </div>
    <div id="fpsbutton" class="EightthWall">fps end</div>
    <!-- <button id="tap-to-place" value="placeModel" class="EightthWall">tap-to-place</button> -->

  </div>
  <div id="transform-controls">
    <button id="tap-to-place" value="placeModel" class="EightthWall">tap-to-place</button>
  </div>
  <script>
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
  </script>
</body>

</html>