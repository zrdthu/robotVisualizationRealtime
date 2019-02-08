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

   function keys(obj) {
    var keys = [];
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            keys.push(key);
         }
      }
     return keys;
  }

  var keyarray = keys(data); 
  var delay = 20 //This is in ms
  var index = 0
  var interval = setInterval(() => {

  newDataHandle('torso', data[keyarray[index]]);
    index += 1
    if (index == keyarray.length) {
         clearInterval(interval)
      }
    }, delay)

  function newDataHandle(msg, datainput) {
    dataModel.status[msg].quaternion.w = datainput['w']
    dataModel.status[msg].quaternion.x = datainput['y'] 
    dataModel.status[msg].quaternion.y = datainput['z'] 
    dataModel.status[msg].quaternion.z = datainput['x']
    }
   }
}
