import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DataModelService {
  dummyDate = new Date();
  public status  = {
    torso : {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    head: {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    rightUpper: {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    rightLower: {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    leftUpper: {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    leftLower: {
      quaternion: {w: 0, x: 0, y: 0, z: 0}
    },
    availableDates: {},
    availableClusters: {},
    selectedCluster: '',
    playing: false,
    playingTime: undefined,
    timeMin: this.dummyDate,
    timeMax: this.dummyDate,
    selectedTimeStart: this.dummyDate,
    selectedTimeEnd: this.dummyDate,
    animationStartTime: this.dummyDate,
    animationEndTime: this.dummyDate,
    histStartTime: this.dummyDate,
    histEndTime: this.dummyDate,
    selectedDate: '',
    selectedHistSource: 'Right Relative',
    availableHistSources: ['Right Relative', 'Left Relative', 'Head Relative', 'Torso Orient'],
    windowFixed: false,
    winPlaying: false,
    windowWidth: 60000,
    start_selected_end: [1, 2, 3, 5],
    windowPlaySlowDownFactor: 1,
    availableWindowPlaySlowDownFactors : [1, 1.5, 2, 2.5, 3],
    curDisplayClusterData: {},
    histMenuDisplayName: {
        'Right Relative': 'Right Arm Orientation Relative to Torso',
        'Left Relative': 'Left Arm Orientation Relative to Torso',
        'Head Relative': 'Head Orientation Relative to Torso',
        'Torso Orient': 'Torso Absolute Orientation'
      },
    clustersOnOff : {}
  };

  public clusterData = {};
  public colorPalette = [[165, 0, 38] , [215, 48, 39]
  , [244, 109, 67], [253, 174, 97], [254, 224, 139], [217, 239, 139]
  , [166 , 217, 106],  [102, 189, 99], [26, 152, 80], [0, 104, 55]];

  newDateSelected = new Subject<any>();
  newHistUpdate = new Subject<any>();
  newMapUpdate = new Subject<any>();
  windowPlayInterval;
  winPlayRatio = 0.2;

  constructor() { }

  // public getPlayingTimeSubscribable(): Observable<Date> {
  //   return this.status.playingTime.asObservable();
  // }
  public getNewDateSelectedSubscribable(): Observable<any> {
    return this.newDateSelected.asObservable();
  }
  public getNewHistUpdateSubscribable(): Observable<any> {
    return this.newHistUpdate.asObservable();
  }
  public getNewMapUpdate(): Observable<any> {
    return this.newMapUpdate.asObservable();
  }
  public updateStartTime(date) {
    this.status.selectedDate = date;
    this.status.timeMin = new Date(this.status.availableDates[date].min);
    this.status.timeMax = new Date(this.status.availableDates[date].max);
    this.status.animationStartTime = new Date(this.status.availableDates[date].min);
    this.status.animationEndTime = new Date(this.status.availableDates[date].min);
    this.status.animationEndTime.setSeconds(this.status.animationEndTime.getSeconds() + 60);
    this.status.histStartTime = new Date(this.status.timeMin.valueOf());
    this.status.histEndTime = new Date(this.status.timeMax.valueOf());
    console.log(this.status.availableDates[date]);
    console.log('call next!');
    this.newDateSelected.next(this.status.availableDates[date]);
    // setTimeout((() => {
    // }).apply(this), 10);
  }

  public updateRange() {
    this.newDateSelected.next(this.status.availableDates[this.status.selectedDate]);
  }
  public windowPlay() {
    //30000: 150
    //1800000: 1600
    let interval = (150 + (1600 - 150) / (1800000 - 30000) * this.status.windowWidth) * this.status.windowPlaySlowDownFactor;
    this.windowPlayInterval = setInterval((() => {
      if (this.status.start_selected_end[2] + this.status.windowWidth > this.status.start_selected_end[3]) {
        clearInterval(this.windowPlayInterval);
        this.status.winPlaying = false;
      }
      this.status.start_selected_end = [
        this.status.start_selected_end[0],
        this.status.start_selected_end[1] + this.status.windowWidth * this.winPlayRatio,
        this.status.start_selected_end[2] + this.status.windowWidth * this.winPlayRatio,
        this.status.start_selected_end[3]
      ];
    }).bind(this), interval);
  }

  public stopPlay() {
    if (this.windowPlayInterval) {
      clearInterval(this.windowPlayInterval);
    }
    this.windowPlayInterval = undefined;
  }

  public updateDisplayClusterData() {
    if (!this.status.selectedCluster) {
      return;
    }
    const allData = this.deepcopy(this.clusterData[this.status.availableClusters[this.status.selectedCluster]]);
    Object.keys(allData).forEach(cluster => {
      if (!this.status.clustersOnOff[cluster]) {
        return
      }
      var allData_cluster = {interest: [], notInterest: []};
      allData[cluster].forEach(d => {
        if ((d.timestamp >= this.status.selectedTimeStart.valueOf() )
         && (d.timestamp < this.status.selectedTimeEnd.valueOf() + 30000)) {
          if ((d.timestamp >= this.status.histStartTime.valueOf() )
            && (d.timestamp < this.status.histEndTime.valueOf() + 30000)) {
              allData_cluster.interest.push(d);
          } else {
            allData_cluster.notInterest.push(d);
          }
        }
      });
      allData[cluster] = allData_cluster;
    });
    this.status.curDisplayClusterData = allData;
    this.newMapUpdate.next(this.status.curDisplayClusterData);
    // console.log(this.status.curDisplayClusterData);
    // console.log(allData);

    // this.status.curDisplayClusterData = this.deepcopy(this.clusterData[this.status.availableClusters[this.status.selectedCluster]])
    // this.newMapUpdate.next(this.status.curDisplayClusterData);
  }

  deepcopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

}
