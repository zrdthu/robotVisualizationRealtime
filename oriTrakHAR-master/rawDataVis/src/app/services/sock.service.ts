import { Injectable } from '@angular/core';
import { Socket } from '../modules/ng2-socket-io';
import { DataModelService } from './data-model.service';
// import { AngleData } from '../prototypes';

@Injectable()
export class SockService {
  status = this.dataModel.status;
  constructor(private socket: Socket, private dataModel: DataModelService) {
    const self = this;
    const counter = 0;
    let lastTimeStamp = 0;
    socket.on('connect', (msg) => {
      console.log('on connect');
    });
    socket.on('newData', newDataHandle);
    socket.on('availableDates', availableDatesHandle);
    socket.on('playEnd', playEndHandle);
    socket.on('disconnect', playEndHandle);
    socket.on('updateHist', updateHistHandle);
    socket.on('availableClusters', availableClustersHandle);
    socket.on('clusterData', clusterDataHandle);
    function newDataHandle(msg) {
      // console.log(msg);
      dataModel.status[msg.id].quaternion.w = msg.quat.w;
      dataModel.status[msg.id].quaternion.x = msg.quat.x;
      dataModel.status[msg.id].quaternion.y = msg.quat.y;
      dataModel.status[msg.id].quaternion.z = msg.quat.z;
      const approximatedTimestamp = Math.floor(msg.quat.timestamp / 1000) * 1000;
      if (approximatedTimestamp !== lastTimeStamp) {
        // console.log(`new msg ${msg.quat.timestamp}`);
        dataModel.status.playingTime = new Date(msg.quat.timestamp);
        lastTimeStamp = msg.quat.timestamp;
      }
    }

    function playEndHandle(msg) {
      dataModel.status.playing = false;
    }

    function availableDatesHandle(msg) {
      dataModel.status.availableDates = msg;
    }

    function updateHistHandle(msg) {
      dataModel.newHistUpdate.next(msg);
    }

    function availableClustersHandle(msg) {
      dataModel.status.availableClusters = msg;
    }

    function clusterDataHandle(data) {
      dataModel.clusterData[data.cluster_id] = data.dataByCluster;
      var clustersOnOff = {}

      Object.keys(data.dataByCluster).forEach(d => {
        clustersOnOff[d] = true
      });
      dataModel.status.clustersOnOff = clustersOnOff
      dataModel.updateDisplayClusterData();
    }
  }

  public play(start, end, ratio, data) {
    this.socket.emit('play', {start, end, ratio, data});
  }

  public stop() {
    this.socket.emit('stop', {});
  }

  public pause() {
    this.socket.emit('pause', {});
  }

  public updateHist() {
    this.socket.emit('updateHist', {start: this.status.histStartTime.valueOf(), end: this.status.histEndTime.valueOf(), source: this.status.selectedHistSource, data: this.status.selectedDate})
  }

  public getClusterData(clusterName) {
    this.socket.emit('requestClusterData', {clusterId: this.status.availableClusters[clusterName]})
  }

}
