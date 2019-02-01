import { Injectable } from '@angular/core';

@Injectable()
export class DataModelService {


  public status  = {
    torso : {
      quaternion: {w: 1, x: 0, y: 0, z: 0}},
//       quaternion:   {w: 0.74725341796875,
//   x: -0.08258056640625,
//   y: -0.01483154296875,
//   z: 0.65924072265625 }
// },
    head: {

      quaternion: {w: 1, x: 0, y: 0, z: 0}},
  //     quaternion:   {w: 0.7724609375,
  // x: -0.03839111328125,
  // y: -0.1016845703125,
  // z: 0.62567138671875}
  //   },
    rightUpper: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
   //  quaternion: {w: 0.6705, x: 0.0887, y: 0.1082, z: -0.7286}
    },
    rightLower: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
   // quaternion: {w: 0.6705, x: 0.0887, y: 0.1082, z: -0.7286}
    },
    leftUpper: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
    },
    leftLower: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
    }
  };

  constructor() { }

}
