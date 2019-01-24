import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
// import { AngleData } from '../prototypes';
import * as data from './righthanddata.json';


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

   for (var i =0 ; i< keyarray.length; i++ ) {

       newDataHandle('rightUpper', data[keyarray[i]]); 
      
    }

    function newDataHandle(msg, datainput) {
      console.log("enter data Handle");
      console.log(datainput['QuaternionW']);
      dataModel.status[msg].quaternion.w = datainput['QuaternionW']
      dataModel.status[msg].quaternion.x = datainput['QuaternionX'] 
      dataModel.status[msg].quaternion.y = datainput['QuaternionY']
      dataModel.status[msg].quaternion.z = datainput['QuaternionZ']

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
