WL.registerComponent('spawn-mesh-on-select', {
    /* The mesh to spawn */
    mesh: { type: WL.Type.Mesh },
    /* The material to spawn the mesh with */
    material: { type: WL.Type.Material },
}, {
    start: function () {
        /* Once a session starts, we want to bind event listeners
         * to the session */
        WL.onXRSessionStart.push(this.onXRSessionStart.bind(this));
        // this.object.rotateObject ([-0.707,0,0,0.707]);
        
        this.object.getComponent('hit-test-location').active = true;



    },

    onXRSessionStart: function (s) {
        /* We set this function up to get called when a session starts.
         * The 'select' event happens either on touch or when the trigger
         * button of a controller is pressed.
         * Once that event is triggered, we want spawnMesh() to be called. */
        this.anchorLoadingEnd = performance.now();
        console.log("anchorloadtime : ",this.anchorLoadingEnd -this.anchorLoadingStart,"ms" )
        this.isModel = false;

        s.addEventListener('select', this.spawnMesh.bind(this));
    },
    // update: function() {
    //     /* Only called when WL.xrSession is valid */
    //     console.log("update");
    // },
      
    spawnMesh: function () {
        if (!this.isModel) {
            /* Create a new object in the scene */
            this.modelloadstart = performance.now();

            const o = WL.scene.addObject();
            /* Place new object at current cursor location */
            o.transformLocal = this.object.transformWorld;//삼각뿔의 ~를 reticle의  
            o.scale([1, 1, 1]);
            o.rotateObject([-0.707, 0, 0, 0.707]);
            /* Move out of the floor, at 0.25 scale, the origin of
             * our cube is 0.25 above the floor */
            this.modelloadend = performance.now();
            console.log("modelloadtime : ",this.modelloadend -this.modelloadstart,"ms" )
            o.translate([0.0, 0.0, 0.0]);

            /* Add a mesh to render the object */
            const mesh = o.addComponent('mesh');
            mesh.material = this.material;
            mesh.mesh = this.mesh;
            mesh.active = true;

            console.log("탭을 했습니다!");
            //
            // const vec = o.transformWorld;
            // console.log(o.transformWorld);
            // this.object.translate([vec[0],vec[1],vec[2]]);//[0.0, 0.1, 0.0]);
            console.log('loadmodel object id :', o);
            console.log('before parent : ', this.object.parent);
            this.object.parent = o;
            console.log('after parent : ', this.object.parent);
            this.object.transformWorld = o.transformWorld;
            this.object.translate([0.0, 0.0, 0.0]);
            // this.object.rotateObject ([-0.707,0,0,0.707]);


            //
            const hittest = this.object.getComponent('hit-test-location');
            hittest.active = false;
            console.log(hittest.active);
            this.isModel=true;
            // this.object.getComponent('hit-test-location').active = false;
            // hittest.active(false);
            // this.object.getComponent('hit-test-location').active(false);

            // this.object.translate(o.getTranslationWorld );//[0.0, 0.0, 0.0]);
            // console.log("삼각뿔",o.getTranslationWorld);
            // console.log("삼각뿔",this.object.getTranslationWorld);

            // this.object.scale([0.2 , 0.2, 0.2]);
            // this.object.rotateObject ([-0.707,0,0,0.707]);

            // hittest.rotateObject ([-0.707,0,0,0.707]);

            // hittest.active(false);
            // this.removeEventListener('select', this.spawnMesh.bind(this));
        }else{
            console.log(window.resultfps);

        }

    },

});
