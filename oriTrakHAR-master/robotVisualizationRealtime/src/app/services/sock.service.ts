import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
// import { AngleData } from '../prototypes';

@Injectable()
export class SockService {

  constructor( private dataModel: DataModelService) {

    newDataHandle('torso');


    // need to get the data and iterate through new data handle


    function newDataHandle(msg) {
   
      dataModel.status[msg].quaternion.w = 0.02
      dataModel.status[msg].quaternion.x = 0.01
      dataModel.status[msg].quaternion.y =0.001
      dataModel.status[msg].quaternion.z = 0.3

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
