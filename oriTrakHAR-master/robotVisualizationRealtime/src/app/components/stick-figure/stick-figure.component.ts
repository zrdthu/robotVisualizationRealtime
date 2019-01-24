import {  Component, OnInit, AfterViewInit, Input, OnChanges } from '@angular/core';
import * as THREE from 'three';
declare function require(name:string);
var OrbitControls = require('three-orbit-controls')(THREE);
var STLLoader = require('three-stl-loader')(THREE);
var loader = new STLLoader();
loader.loadPromise = function (path) {
  return new Promise((resolve, reject) => {
    loader.load(path, geometry => {
      resolve(geometry)
    })
  }).catch(e => {
    console.log(e)
  })
}

@Component({
  moduleId: module.id,
  selector: 'app-stick-figure',
  templateUrl: './stick-figure.component.html',
  styleUrls: ['./stick-figure.component.css']
})
export class StickFigureComponent implements OnInit {
  @Input() angleData
  @Input() name: string;
  @Input() container: HTMLElement;
  @Input() axisNames: string[];

  camera: any;
  scene: any;
  renderer: any;
  geometry: any;
  material: any;
  mesh: any;
  rendererHeight = 800;
  rendererWidth = 800;
  WIDTH_FACTOR = 0.49;
  HEIGHT_FACTOR = 0.8;
  AXIS_LENGTH = 430;
  TORSO_LENGTH = 260;
  SHOULDER_Y_POS = 180;
  SHOULDER_Z_POS = 100;
  SHOULDER_X_POS = -30;
  UPPER_ARM_LENGTH = 105;
  NECK_LENGTH = this.TORSO_LENGTH - this.SHOULDER_Y_POS;
  LOWER_ARM_Y_OFFSET = -10;
  ARM_LENGTH = this.AXIS_LENGTH / 4

  TRACE_SEGMENTS = 25;
  objectDragged = 'none';
  mousePos = {x: 0, y: 0};
  cameraPos = {x: 0.425, y: 0.595};
  vectorObject: any = new THREE.Line();

  lineTorso: any;
  lineLeftUpperArm: any;
  lineRightUpperArm: any;

  meshTorso: THREE.Mesh;
  meshLeftUpperArm: THREE.Mesh;
  meshLeftLowerArm: THREE.Mesh;
  meshRightUpperArm: THREE.Mesh;
  meshRightLowerArm: THREE.Mesh;
  meshHead: THREE.Mesh;

  vectorQuaternion: any = new THREE.Quaternion();
  rotationAxis: any = new THREE.Vector3(0, 1, 0);
  axisXName: any;
  axisYName: any;
  axisZName: any;
  // eulerOrder = 'XYZ';
  eulerOrder = 'YZX';

  showAxis = true;
  // rotationAxisObject: any = new THREE.Line();


  constructor() { }

  ngOnInit() {
    const aspectRatio = 1;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 10000);
    this.turnCamera();

    this.scene = new THREE.Scene();
    var light = new THREE.HemisphereLight( 0xffffee, 0x080820, 1 );
    this.scene.add( light );


    this.initGrid();
    this.initAxes();
    this.initAxesNames();
    // this.initLineTrace();
    // this.initRotationAxis();



    this.renderer = new THREE.WebGLRenderer({ alpha: true , antialias: true});
    this.renderer.setSize(this.rendererWidth, this.rendererHeight);
    this.renderer.setClearColor( 0xffffff, 1 );
    this.container.appendChild(this.renderer.domElement);
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
    // this.updateRotationAxis();

    // this.scene.add(this.rotationAxisObject);

    // vectorQuaternion.normalize();
    // this.renderer.render(this.scene, this.camera);
    // this.animate(this.angleData);

    this.initVector().then(() => {
      this.updateVectorVisuals();
      this.renderer.render(this.scene, this.camera);
      this.animate(this.angleData);
    })
  }


  animate(angleData) {

    console.log(angleData);
    // this.vectorQuaternion.x = angleData.quaternion.x;
    // this.vectorQuaternion.w = angleData.quaternion.w;
    // this.vectorQuaternion.y = angleData.quaternion.y;
    // this.vectorQuaternion.z = angleData.quaternion.z;

    // this.updateRotationAxis();
    this.updateVectorVisuals();
    this.renderer.render(this.scene, this.camera);
    this.updateAxesNames();
    setTimeout(() => {
      this.animate(angleData);
    } , 20);
  }

  setQuat(target, val) {
    target.quaternion.w = val.quaternion.w
    target.quaternion.x = val.quaternion.x
    target.quaternion.y = val.quaternion.y
    target.quaternion.z = val.quaternion.z
  }

  updateVectorVisuals() {
    this.setQuat(this.lineTorso, this.angleData.torso)
    this.setQuat(this.meshTorso, this.angleData.torso)
    var orig_torsoVector = this.lineTorso.geometry.vertices[4].clone()
    var curTorsoVector = new THREE.Vector3(orig_torsoVector.x, orig_torsoVector.y, orig_torsoVector.z).applyQuaternion(this.lineTorso.quaternion)
    this.meshHead.position.set(curTorsoVector.x, curTorsoVector.y, curTorsoVector.z)
    this.setQuat(this.meshHead, this.angleData.head)

    var upperRightArmVector = this.lineTorso.geometry.vertices[3].clone()
    var curRightUpperArmVector = new THREE.Vector3(upperRightArmVector.x, upperRightArmVector.y, upperRightArmVector.z).applyQuaternion(this.lineTorso.quaternion)
    this.lineRightUpperArm.position.set(curRightUpperArmVector.x, curRightUpperArmVector.y, curRightUpperArmVector.z)
    this.meshRightUpperArm.position.set(curRightUpperArmVector.x, curRightUpperArmVector.y, curRightUpperArmVector.z)
    this.setQuat(this.lineRightUpperArm, this.angleData.rightUpper)
    this.setQuat(this.meshRightUpperArm, this.angleData.rightUpper)


    curRightUpperArmVector.add(this.lineRightUpperArm.geometry.vertices[1].clone().applyQuaternion(this.lineRightUpperArm.quaternion))
    this.meshRightLowerArm.position.set(curRightUpperArmVector.x, curRightUpperArmVector.y, curRightUpperArmVector.z)
    this.setQuat(this.meshRightLowerArm, this.angleData.rightLower)

    var upperLeftArmVector = this.lineTorso.geometry.vertices[2].clone()
    var curLeftUpperArmVector = new THREE.Vector3(upperLeftArmVector.x, upperLeftArmVector.y, upperLeftArmVector.z).applyQuaternion(this.lineTorso.quaternion)
    this.lineLeftUpperArm.position.set(curLeftUpperArmVector.x, curLeftUpperArmVector.y, curLeftUpperArmVector.z)
    this.meshLeftUpperArm.position.set(curLeftUpperArmVector.x, curLeftUpperArmVector.y, curLeftUpperArmVector.z)
    this.setQuat(this.lineLeftUpperArm, this.angleData.leftUpper)
    this.setQuat(this.meshLeftUpperArm, this.angleData.leftUpper)


    curLeftUpperArmVector.add(this.lineLeftUpperArm.geometry.vertices[1].clone().applyQuaternion(this.lineLeftUpperArm.quaternion))
    this.meshLeftLowerArm.position.set(curLeftUpperArmVector.x, curLeftUpperArmVector.y, curLeftUpperArmVector.z)
    this.setQuat(this.meshLeftLowerArm, this.angleData.leftLower)

  }

  turnCamera() {
    this.camera.position.x = Math.sin(this.cameraPos.x) * 1000 * Math.cos(this.cameraPos.y);
    this.camera.position.z = Math.cos(this.cameraPos.x) * 1000 * Math.cos(this.cameraPos.y);
    this.camera.position.y = Math.sin(this.cameraPos.y) * 1000;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  initGrid() {
    const GRID_SEGMENT_COUNT = 5;
    const gridLineMat      = new THREE.LineBasicMaterial({color: 0xDDDDDD});
    const gridLineMatThick = new THREE.LineBasicMaterial({color: 0xAAAAAA, linewidth: 2});

    for (let i = -GRID_SEGMENT_COUNT; i <= GRID_SEGMENT_COUNT; i++) {
      const dist = this.AXIS_LENGTH * i / GRID_SEGMENT_COUNT;
      const gridLineGeomX = new THREE.Geometry();
      const gridLineGeomY = new THREE.Geometry();

      if (i === 0) {
        gridLineGeomX.vertices.push(new THREE.Vector3(dist, 0, -this.AXIS_LENGTH));
        gridLineGeomX.vertices.push(new THREE.Vector3(dist, 0,  0));

        gridLineGeomY.vertices.push(new THREE.Vector3(-this.AXIS_LENGTH, 0, dist));
        gridLineGeomY.vertices.push(new THREE.Vector3(           0, 0, dist));

        this.scene.add(new THREE.Line(gridLineGeomX, gridLineMatThick));
        this.scene.add(new THREE.Line(gridLineGeomY, gridLineMatThick));
      } else {
        gridLineGeomX.vertices.push(new THREE.Vector3(dist, 0, -this.AXIS_LENGTH));
        gridLineGeomX.vertices.push(new THREE.Vector3(dist, 0,  this.AXIS_LENGTH));

        gridLineGeomY.vertices.push(new THREE.Vector3(-this.AXIS_LENGTH, 0, dist));
        gridLineGeomY.vertices.push(new THREE.Vector3( this.AXIS_LENGTH, 0, dist));

        this.scene.add(new THREE.Line(gridLineGeomX, gridLineMat));
        this.scene.add(new THREE.Line(gridLineGeomY, gridLineMat));
      }
    }
  }

  initAxes() {
    const xAxisMat = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 2});
    const xAxisGeom = new THREE.Geometry();
    xAxisGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xAxisGeom.vertices.push(new THREE.Vector3(this.AXIS_LENGTH, 0, 0));
    const xAxis = new THREE.Line(xAxisGeom, xAxisMat);
    this.scene.add(xAxis);

    const yAxisMat = new THREE.LineBasicMaterial({color: 0x00cc00, linewidth: 2});
    const yAxisGeom = new THREE.Geometry();
    yAxisGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    yAxisGeom.vertices.push(new THREE.Vector3(0, this.AXIS_LENGTH, 0));
    const yAxis = new THREE.Line(yAxisGeom, yAxisMat);
    this.scene.add(yAxis);

    const zAxisMat = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 2});
    const zAxisGeom = new THREE.Geometry();
    zAxisGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zAxisGeom.vertices.push(new THREE.Vector3(0, 0, this.AXIS_LENGTH));
    const zAxis = new THREE.Line(zAxisGeom, zAxisMat);
    this.scene.add(zAxis);
  }

  initAxesNames() {
    const objects = new Array(3);
    const colors = ['#ff0000', '#00cc00', '#0000ff'];
    for (let i = 0, len = objects.length; i < len; i++) {
      objects[i] = document.createElement('div');
      objects[i].innerHTML = this.axisNames[i];
      objects[i].style.position = 'absolute';
      objects[i].style.transform = 'translateX(-50%) translateY(-50%)';
      objects[i].style.color = colors[i];
      document.body.appendChild(objects[i]);
    }
    this.axisXName = objects[0];
    this.axisYName = objects[1];
    this.axisZName = objects[2];
  }

  initVector() {
    const torsoMat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 10})
    const torsoGeom = new THREE.Geometry();
    torsoGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    const torsoVectorStandard = new THREE.Vector3(0, this.SHOULDER_Y_POS, 0);
    const shoulderVectorLeft = new THREE.Vector3(this.SHOULDER_X_POS, 0, -this.SHOULDER_Z_POS)
    const shoulderVectorRight = new THREE.Vector3(this.SHOULDER_X_POS, 0, this.SHOULDER_Z_POS)
    const neck = new THREE.Vector3(0, this.NECK_LENGTH, 0)

    shoulderVectorLeft.add(torsoVectorStandard)
    shoulderVectorRight.add(torsoVectorStandard)
    neck.add(torsoVectorStandard)

    torsoGeom.vertices.push(torsoVectorStandard)
    torsoGeom.vertices.push(shoulderVectorLeft)
    torsoGeom.vertices.push(shoulderVectorRight)
    torsoGeom.vertices.push(neck)
    this.lineTorso = new THREE.Line(torsoGeom, torsoMat)
    // this.scene.add(new THREE.Line(torsoGeom, torsoMat))

    // const headGeom = new THREE.Geometry();
    // const headVector = new THREE.Vector3(0, this.SHOULDER_Y_POS + this.NECK_LENGTH, 0);
    // headGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    // headGeom.vertices.push(headVector)
    // this.lineHead = new THREE.Line(headGeom, torsoMat)

    const rightUpperArmGeom = new THREE.Geometry();
    const rightUpperArmVector = new THREE.Vector3(this.UPPER_ARM_LENGTH - this.SHOULDER_X_POS, this.LOWER_ARM_Y_OFFSET, 18);
    rightUpperArmGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    rightUpperArmGeom.vertices.push(rightUpperArmVector)
    this.lineRightUpperArm = new THREE.Line(rightUpperArmGeom, torsoMat)

    const leftUpperArmGeom = new THREE.Geometry();
    const leftUpperArmVector = new THREE.Vector3(this.UPPER_ARM_LENGTH - this.SHOULDER_X_POS, this.LOWER_ARM_Y_OFFSET, -18);
    leftUpperArmGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    leftUpperArmGeom.vertices.push(leftUpperArmVector)
    this.lineLeftUpperArm = new THREE.Line(leftUpperArmGeom, torsoMat)

    return loader.loadPromise('./assets/torso.stl')
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xBEBEBE } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.meshTorso = mesh
      return loader.loadPromise('./assets/Head.stl');
    })
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xBEBEBE } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.meshHead = mesh
      mesh.position.set(0, this.TORSO_LENGTH, 0);
      return loader.loadPromise('./assets/Left_Upper_Arm.stl');
    })
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xBEBEBE } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      mesh.position.set(this.SHOULDER_X_POS, this.SHOULDER_Y_POS, -this.SHOULDER_Z_POS);
      this.meshLeftUpperArm = mesh
      return loader.loadPromise('./assets/Right_Upper_Arm.stl');
    })
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xBEBEBE } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      mesh.position.set(this.SHOULDER_X_POS, this.SHOULDER_Y_POS, this.SHOULDER_Z_POS);
      this.meshRightUpperArm = mesh
      return loader.loadPromise('./assets/Left_Lower_Arm.stl');
    })
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xFFD000 } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      mesh.position.set(this.UPPER_ARM_LENGTH, this.SHOULDER_Y_POS + this.LOWER_ARM_Y_OFFSET, -118);
      this.meshLeftLowerArm = mesh
      return loader.loadPromise('./assets/Right_Lower_Arm.stl');
    })
    .then(geometry => {
      var material = new THREE.MeshPhongMaterial( { color: 0xFFD000 } );
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.meshRightLowerArm = mesh
      mesh.position.set(this.UPPER_ARM_LENGTH, this.SHOULDER_Y_POS + this.LOWER_ARM_Y_OFFSET, 118);
    })

  }

  handlePointerMove(x, y) {
    const mouseDiffX = x - this.mousePos.x;
    const mouseDiffY = y - this.mousePos.y;
    this.mousePos = {x: x, y: y};
    if (this.objectDragged === 'scene') {
      this.cameraPos.x -= mouseDiffX / 200;
      this.cameraPos.y += mouseDiffY / 200;
      this.cameraPos.y = Math.min(this.cameraPos.y, 3.1415926 / 2);
      this.cameraPos.y = Math.max(this.cameraPos.y, -3.1415926 / 2);
      this.turnCamera();
    }
  }

  handleTouchMove(event) {
    if (this.objectDragged !== 'none') {
      event.preventDefault();
    }
    this.handlePointerMove(event.touches[0].clientX, event.touches[0].clientY);
  }

  handleMouseMove(event) {
    if (this.objectDragged !== 'none') {
      event.preventDefault();
    }
    this.handlePointerMove(event.clientX, event.clientY);
  }


  handleTouchStart(event) {
    this.handlePointerStart(event.touches[0].clientX, event.touches[0].clientY);
  }
  handleMouseDown(event) {
    this.handlePointerStart(event.clientX, event.clientY);
  }

  handlePointerStart(x, y) {
    this.mousePos = {x: x, y: y};
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (this.mousePos.x >= rect.left
          && this.mousePos.x <= rect.left + this.rendererWidth
          && this.mousePos.y >= rect.top
          && this.mousePos.y <= rect.top + this.rendererHeight && this.objectDragged === 'none') {
      this.objectDragged = 'scene';
    }
  }

  handleTouchEnd(event) {
    this.objectDragged = 'none';
  }
  handleMouseUp(event) {
    this.objectDragged = 'none';
  }

  // updateRotationAxis() {
  //   const theta = Math.acos(this.vectorQuaternion.w) * 2;
  //   const sin = Math.sin(theta / 2);
  //   if (sin >= 0.01 || sin <= -0.01) {
  //       // console.log(quatY + "  "+ quatZ + "  "+ sin)
  //     this.rotationAxis.x = this.vectorQuaternion.x / sin;
  //     this.rotationAxis.y = this.vectorQuaternion.y / sin;
  //     this.rotationAxis.z = this.vectorQuaternion.z / sin;
  //     this.rotationAxis.normalize();
  //   }
  // }

  toXYCoords(pos) {
    const sitetop  = window.pageYOffset || document.documentElement.scrollTop;
    const siteleft = window.pageXOffset || document.documentElement.scrollLeft;
    const vector = pos.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const vector2 = new THREE.Vector3(0, 0, 0);
    vector2.x = siteleft + rect.left + ( vector.x + 1) / 2 * (rect.right - rect.left);
    vector2.y = sitetop  + rect.top  + (-vector.y + 1) / 2 * (rect.bottom - rect.top);
    return vector2;
  }

  updateAxesNames() {
    const distance = this.AXIS_LENGTH * 1.1;
    const vectors = [new THREE.Vector3(distance, 0, 0), new THREE.Vector3(0, distance, 0), new THREE.Vector3(0, 0, distance)];
    const objects = [this.axisXName, this.axisYName, this.axisZName];
    for (let i = 0; i < objects.length; i++) {
      const position = this.toXYCoords(vectors[i]);
      objects[i].style.top = position.y + 'px';
      objects[i].style.left = position.x + 'px';
    }
  }

}
