import { Injectable } from '@angular/core';

@Injectable()
export class DataModelService {
  public status  = {
    torso : {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
    },
    head: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
    },
    rightUpper: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
    },
    rightLower: {
      quaternion: {w: 1, x: 0, y: 0, z: 0}
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
