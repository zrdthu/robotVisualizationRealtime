import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
//const THREE = require('three.js-node')
// import { AngleData } from '../prototypes';
//import * as data from './righthandperpendicular.json';
import * as rightdata from './rightarm227botharms.json';
import * as data from './torsomoving227botharms.json'; 
import * as leftdata from './leftarm227botharms.json';
import * as elbow from './227elbowbotharms201minus.json'; 
//import * as elbow from './224elbowthirFmad.json';


@Injectable()
export class SockService {

  constructor( private dataModel: DataModelService) {

   function keys(obj) {
    var keys = [];
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            keys.push(key);
         }
      }
     return keys;
  }

  function getQuaternionProduct (r, q) {
    // ref: https://www.mathworks.com/help/aeroblks/quaternionmultiplication.html
    return {
      w: r.w * q.w - r.x * q.x - r.y * q.y - r.z * q.z,
      x: r.w * q.x +  r.x * q.w - r.y * q.z + r.z * q.y,
      y: r.w * q.y + r.x * q.z + r.y * q.w - r.z * q.x,
      z: r.w * q.z - r.x * q.y + r.y * q.x + r.z * q.w
    }
  }

  var initquat = {
    w: 0.1604,
    x : 0.5975, 
    y: 0.0512, 
    z : 0.784 
  }

  function q12q2 (q1, q2) {
    return getQuaternionProduct( q1, getInverseQuaternion(q2))
  }

  function getInverseQuaternion (quat) {
    // ref: https://www.mathworks.com/help/aeroblks/quaternioninverse.html?s_tid=gn_loc_drop
    const denominator = quat.w * quat.w + quat.x * quat.x + quat.y * quat.y + quat.z * quat.z
    return {
      w: quat.w / denominator,
      x: -quat.x / denominator,
      y: -quat.y / denominator,
      z: -quat.z / denominator
    }
  }

  // calculate from the torso at this point 

  // var right key data 
  var elbowkeyarray = keys(elbow); 
  var leftkeyarray = keys(leftdata);
  var rightkeyarray = keys(rightdata);
  var keyarray = keys(data); 
  var delay = 50//This is in ms
  var index = 0
  var interval = setInterval(() => {

 // console.log(rightdata[rightkeyarray[index]]);
 // console.log("right data "); 
 // console.log(data[keyarray[index]]); 
 //console.log(elbow[elbowkeyarray[index]]); 
  newDataHandle('rightUpper', elbow[elbowkeyarray[index]]);
  //newDataHandle('rightUpper', rightdata[rightkeyarray[index]]);
   newDataHandle('rightLower', rightdata[rightkeyarray[index]]);
   newDataHandle('leftUpper', leftdata[leftkeyarray[index]]); 
   newDataHandle('leftLower', leftdata[leftkeyarray[index]]);
   // newDataHandle('rightUpper', rightdata[rightkeyarray[index]]);
   // newDataHandle('rightLower', rightdata[rightkeyarray[index]]);
   newDataHandle('head', data[keyarray[index]]);
   newDataHandle('torso', data[keyarray[index]]);

    index += 1
    if (index == keyarray.length) {
         clearInterval(interval)
      }
    }, delay)

// two axies that work is x z y (torso 4 and arm 1 seems tobe the best ) and y z x 

// basic coordinations to fit the arm and bbody at this part for visualziations 
// x  z y  // arm is in the opposite positioning
  function newDataHandle(msg, datainput) {
    dataModel.status[msg].quaternion.w = datainput['w']
    dataModel.status[msg].quaternion.x = datainput['x'] 
    dataModel.status[msg].quaternion.y = datainput['z'] 
    dataModel.status[msg].quaternion.z = -datainput['y']
    }
   }
}
