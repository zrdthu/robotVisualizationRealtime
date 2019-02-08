import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
//const THREE = require('three.js-node')
// import { AngleData } from '../prototypes';
//import * as data from './righthandperpendicular.json';
import * as data from './torsorotate.json';


@Injectable()
export class SockService {

  constructor( private dataModel: DataModelService) {


   function keys(obj)
  {
      var keys = [];

      for(var key in obj)
      {
          if(obj.hasOwnProperty(key))
          {
              keys.push(key);
          }
      }
      return keys;
  }

  var keyarray = keys(data); 



// const originAxis = {
//   w: 0.7472,
//   x: 0.3625,
//   y: -0.5148,
//   z: 0.2125
// }

// const torsoInitQuat = {
//   w: 0.7472,
//   x: 0.3625,
//   y: -0.5148,
//   z: 0.2125
// }

//right down 


const originAxis = {
  w: 0.676,
  x: -0.0742,
  y: -0.6868,
  z: -0.2564
}


const torsoInitQuat = {
  w: 0.676,
  x: -0.0742,
  y: -0.6868,
  z: -0.2564
}

const headInitQuat = {
  w: 0.676,
  x: -0.0742,
  y: -0.6868,
  z: -0.2564
}


// //right torso move in a movement 


// const originAxis = {
//   w: 0.1604,
//   x: 0.5975,
//   y: 0.0512,
//   z: 0.784
// }

// const torsoInitQuat = {
//   w: 0.1604,
//   x: 0.5975,
//   y: 0.0512,
//   z: 0.784
// }

// const headInitQuat = {
//   w: 0.1604,
//   x: 0.5975,
//   y: 0.0512,
//   z: 0.784
// }

 
//right perpendicular 
// const originAxis = {
//   w: 0.7047,
//   x: 0.0067,
//   y: -0.6639,
//   z: -0.2501
// }

// const torsoInitQuat = {
//   w: 0.7047,
//   x: 0.0067,
//   y: -0.6639,
//   z: -0.2501
// }

// const headInitQuat = {
//   w: 0.7724609375,
//   x: -0.03839111328125,
//   y: -0.1016845703125,
//   z: 0.62567138671875
// }


//tryone torso  channel 1 and 3. location and understanding the orientation of the problem 


// const originAxis = {
//   w: 0.9556, 
//   x: -0.1114, 
//   y: -0.1839, 
//   z: -0.2014
// }
// const torsoInitQuat = {
//   w: 0.9556, 
//   x: -0.1114, 
//   y: -0.1839, 
//   z: -0.2014
// }
// const headInitQuat = {
//   w: 0.9556, 
//   x: -0.1114, 
//   y: -0.1839, 
//   z: -0.2014
// } 


// channel 2 and 4 and understanding the orientaiton of the problem at this point
// const originAxis = {
//   w: 0.2744, 
//   x: 0.5768, 
//   y: -0.0439, 
//   z: 0.7682
// }
// const torsoInitQuat = {
//   w: 0.2744, 
//   x: 0.5768, 
//   y: -0.0439, 
//   z: 0.7682
// }
// const headInitQuat = {
//   w: 0.2744, 
//   x: 0.5768, 
//   y: -0.0439, 
//   z: 0.7682
// } 

var torsoOffset = q12q2(torsoInitQuat, originAxis)
var headOffset = q12q2(headInitQuat, originAxis)

// function torsoCalibrate (quat) {
//   var offsetTorso = getQuaternionProduct(quat, torsoZRotate)
//   var euler = new THREE.Euler().setFromQuaternion(offsetTorso, 'YZX')
//   euler.x = 0
//   euler.z = 0
//   var expectedTorsoQuat = new THREE.Quaternion().setFromEuler(euler)
//   var newTorsoOffset = q12q2(quat, expectedTorsoQuat)
//   // console.log(`newTorsoOffset ${JSON.stringify(newTorsoOffset, null, 2)}`)
//   // console.log(`torso: ${JSON.stringify(quat, null, 2)}
//   // ${JSON.stringify(offsetTorso, null, 2)}
//   // yaw: ${euler._y * 180 / Math.PI} pitch: ${euler._z * 180 / Math.PI} roll: ${euler._x * 180 / Math.PI}
//   //   `)
// }


// channel 1. arm 
// const rightUpper = {
//   w: 0.9408, 
//   x: -0.0798, 
//   y: 0.2366, 
//   z: 0.2292
// }
 

//channel 2 and 4 arm 

const rightUpper = {
  w: 0.9408, 
  x: -0.0798, 
  y: 0.2366, 
  z: 0.2292
}


// torso move 

// const rightUpper = {
//    w: 0.9958,
//   x: -0.0694,
//   y: 0.0573,
//   z: 0.0182
// }


//right down 
// const rightUpper = {
//   w:   0.399 ,
//   x:    0.6363 , 
//   y:    0.2585 , 
//   z:  -0.6075
// }

//right perpendicular 
// const rightUpper = {
//   w: 0.478,
//   x: 0.0232,
//   y: 0.0533,
//   z: -0.8763
// }

// const rightUpper = {
//   w:0.6705 , 
//   x: 0.0887 ,
//   y: 0.1082, 
//   z: -0.7286
// }

const torsoZRotate = {
  w: 0.707,
  x: 0,
  y: 0,
  z: 0.707
}

  function getQuaternionProduct (r, q) {
    // ref: https://www.mathworks.com/help/aeroblks/quaternionmultiplication.html
    return {
      w: r.w * q.w - r.x * q.x - r.y * q.y - r.z * q.z,
      x: r.w * q.x + r.x * q.w - r.y * q.z + r.z * q.y,
      y: r.w * q.y + r.x * q.z + r.y * q.w - r.z * q.x,
      z: r.w * q.z - r.x * q.y + r.y * q.x + r.z * q.w
    }
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

  //var bigDataArray = []
  var delay = 20 //This is in ms
  var index = 0
  var interval = setInterval(() => {
 // var offset =  q12q2( torsoInitQuat, originAxis); 
  //var rightupper = q12q2(rightUpper, torsoInitQuat); 

 // change the data based on the right arm actual data edit and calculations  

   // for (var index =0 ; index < keyarray.length)
    newDataHandle('torso', data[keyarray[index]]);
  // newDataHandle('rightUpper', rightupper);
   // newDataHandle('rightLower', rightupper);
    index += 1
    if (index == keyarray.length) {
         clearInterval(interval)
    }
  }, delay)



   // for (var i =0 ; i< keyarray.length; i++ ) {

   //     newDataHandle('rightUpper', data[keyarray[i]]); 
      
   //  }

    function newDataHandle(msg, datainput) {
      //console.log("enter data Handle");
      //console.log(datainput['QuaternionW']);
 
        dataModel.status[msg].quaternion.w = datainput['w']
        dataModel.status[msg].quaternion.x = datainput['y'] 
        dataModel.status[msg].quaternion.y = datainput['z'] 
        dataModel.status[msg].quaternion.z = datainput['x']
      
      // else {
      //   dataModel.status[msg].quaternion.w = datainput['QuaternionW']
      //   dataModel.status[msg].quaternion.x = datainput['QuaternionX'] 
      //   dataModel.status[msg].quaternion.y = datainput['QuaternionY'] 
      //   dataModel.status[msg].quaternion.z = datainput['QuaternionZ']

      // }
     
    }
   }
  //   const self = this;
  //   var counter = 0

  //   socket.on('connect', (msg) => {

  //     console.log('on connect');
  //   });
  //   socket.on('newData', newDataHandle);

  //   function newDataHandle(msg) {
  //     console.log('new data handle');
  //      console.log(msg)
  //     dataModel.status[msg.id].quaternion.w = msg.quat.w
  //     dataModel.status[msg.id].quaternion.x = msg.quat.x
  //     dataModel.status[msg.id].quaternion.y = msg.quat.y
  //     dataModel.status[msg.id].quaternion.z = msg.quat.z
  //   }

  // }

}
