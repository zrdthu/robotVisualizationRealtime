import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
// import * as rightlower from './test.json';
import * as leftupper from './samhita_1_190911_14_52_39_recon_avg_elb.json';
import * as leftlower from './samhita_1_190911_14_52_39_recon_avg_wst.json';
import * as rightupper from './1_2019_10_22_17_26_42_295687.csv_ground_truth_elb.json';
import * as rightlower from './1_2019_10_22_17_26_42_295687.csv_ground_truth_wst.json';
// import * as rightupper from './Standing Scarerow_31_ground_truth_elb.json';
// import * as rightlower from './Standing Scarerow_31_ground_truth_wst.json';
import * as head from './hcs_torso.json';
import * as torso from './hcs_torso.json';
// import * as leftupper from './S1ADL1_upper_left.json';
// import * as leftlower from './S1ADL1_lower_left.json';
// import * as rightupper from './S1ADL1_upper_right.json';
// import * as rightlower from './S1ADL1_lower_right.json';
// import * as rightupper from './apple_watch_right_0731_elb.json';
// import * as rightlower from './apple_watch_right_0731_wst.json';
// import * as rightlower from './test.json'; S1ADL1_lower_left

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
  var torsokeyarray = keys(torso); 
  var headkeyarray = keys(head); 
  var leftupperkeyarray = keys(leftupper); 
  var leftlowerkeyarray = keys(leftlower);
  var rightupperkeyarray = keys(rightupper); 
  var rightlowerkeyarray = keys(rightlower);
  // var rightkeyarray = keys(rightdata);
  // var keyarray = keys(data); 
 
  var delay = 5//This is in ms
  var index = 0
  var interval = setInterval(() => {

  //  newDataHandle('torso', torso[torsokeyarray[index]]);
  //  newDataHandle('head', head[headkeyarray[index]]);
  //  newDataHandle('leftUpper', leftupper[leftupperkeyarray[index]]);
  //  newDataHandle('leftLower', leftlower[leftlowerkeyarray[index]]);
   newDataHandle('rightUpper', rightupper[rightupperkeyarray[index]]);
   newDataHandle('rightLower', rightlower[rightlowerkeyarray[index]]);
  //  console.log()
   console.log(rightlower[rightlowerkeyarray[index]]);
  //  newDataHandle('head', data[keyarray[index]]);

    index += 1
    if (index == 10000000000) {
         clearInterval(interval)
      }
    }, delay)

// two axes that work is x z y (torso 4 and arm 1 seems to be the best ) and y z x 
// basic coordinations to fit the arm and body at this part for visualizations 
// x  z y  // arm is in the opposite positioning
  function newDataHandle(msg, datainput) {
    dataModel.status[msg].quaternion.w = datainput['w']
    dataModel.status[msg].quaternion.x = datainput['x']
    dataModel.status[msg].quaternion.y = datainput['z']
    dataModel.status[msg].quaternion.z = -datainput['y']
    }
  }
}
