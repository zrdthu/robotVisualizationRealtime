import {  Component, OnInit, AfterViewInit, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DataModelService } from '../../services/data-model.service';

import * as THREE from 'three';
@Component({
  selector: 'app-shpere-hist',
  templateUrl: './shpere-hist.component.html',
  styleUrls: ['./shpere-hist.component.css']
})
export class ShpereHistComponent implements OnInit {
  @Input() name: string;
  @Input() container: HTMLElement;
  @Input() axisNames: string[];
  @Input() ratio: number;

  histUpdateObservable: Observable<any> = this.dataModel.getNewHistUpdateSubscribable()
  camera: any;
  scene: any;
  renderer: any;
  geometry: any;
  material: any;
  mesh: any;
  rendererHeight = 800;
  rendererWidth = 800;
  RADUIS = 350;
  AXIS_LENGTH = 430;

  TRACE_SEGMENTS = 25;
  objectDragged = 'none';
  mousePos = {x: 0, y: 0};
  cameraPos = {x: 0.425, y: 0.595};
  vectorObject: any = new THREE.Line();

  sphere: THREE.Mesh

  vectorQuaternion: any = new THREE.Quaternion();
  rotationAxis: any = new THREE.Vector3(0, 1, 0);
  axisXName: any;
  axisYName: any;
  axisZName: any;
  // eulerOrder = 'XYZ';
  eulerOrder = 'YZX';

  showAxis = true;
  constructor(private dataModel: DataModelService) { }

  ngOnInit() {
    this.rendererHeight *= this.ratio;
    this.rendererWidth *= this.ratio;
    const aspectRatio = 1;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 10000);
    this.turnCamera();

    this.scene = new THREE.Scene();
    // this.scene.add( new THREE.HemisphereLight( 0xffffee, 0x080820, 1 ); );


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
    this.initSphere();
    this.updateVectorVisuals();
    this.renderer.render(this.scene, this.camera);
    this.animate();

    this.histUpdateObservable.subscribe((msg => {
      // console.log(msg)
      for (let i = 0; i < this.sphere.geometry.faces.length; i++) {
        let face = this.sphere.geometry.faces[i];
        face.color.setRGB(236 / 255, 240 / 255, 241 / 255)
      }
      msg.forEach(d => {
        // console.log(d)
        let face = this.sphere.geometry.faces[d.bin]
        // console.log(d.color)
        if (face) {
          face.color.setRGB(d.color.r / 255, d.color.g / 255, d.color.b / 255)
        } else {
          // console.log(d)
        }
      })
      this.sphere.geometry.verticesNeedUpdate = true;
      this.sphere.geometry.elementsNeedUpdate = true;
      this.sphere.geometry.morphTargetsNeedUpdate = true;
      this.sphere.geometry.uvsNeedUpdate = true;
      this.sphere.geometry.normalsNeedUpdate = true;
      this.sphere.geometry.colorsNeedUpdate = true;
      this.sphere.geometry.tangentsNeedUpdate = true;
      // console.log('set color finished')
    }).bind(this))
  }


  animate() {
    // this.vectorQuaternion.x = angleData.quaternion.x;
    // this.vectorQuaternion.w = angleData.quaternion.w;
    // this.vectorQuaternion.y = angleData.quaternion.y;
    // this.vectorQuaternion.z = angleData.quaternion.z;

    // this.updateRotationAxis();
    this.updateVectorVisuals();
    this.renderer.render(this.scene, this.camera);
    this.updateAxesNames();
    setTimeout(() => {
      this.animate();
    } , 30);
  }

  updateVectorVisuals() {

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

  setAxisNames(axisName) {
    this.axisXName.innerHTML = axisName[0];
    this.axisYName.innerHTML = axisName[1];
    this.axisZName.innerHTML = axisName[2];
  }

  initSphere() {
    const faceColorMaterial = new THREE.MeshBasicMaterial(
      { color: 0xffffff, vertexColors: THREE.FaceColors } );

    const sphereGeometry = new THREE.SphereGeometry(this.RADUIS, 72, 36);
    console.log(sphereGeometry.faces.length)
    for (let i = 0; i < sphereGeometry.faces.length; i++) {
      let face = sphereGeometry.faces[i];
        face.color.setRGB(236 / 255, 240 / 255, 241 / 255)
       // if (i < 10) {
       //   face.color.setRGB(1, 0, 0)
       // }
    }
    this.sphere = new THREE.Mesh( sphereGeometry, faceColorMaterial );
    //https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Mouse-Click.html
    this.scene.add( this.sphere );
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
    this.setAxisNames(this.axisNames)
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
