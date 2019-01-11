import { Component, OnInit } from '@angular/core';
import { SockService } from '../../services/sock.service';
import { DataModelService } from '../../services/data-model.service';
import { Observable } from 'rxjs/Observable';
@Component({
  selector: 'app-left-3d-vis',
  templateUrl: './left-3d-vis.component.html',
  styleUrls: ['./left-3d-vis.component.css']
})
export class Left3dVisComponent implements OnInit {
  public status;
  public reconstruction_ratio = 0.5;
  public axisNames = ['north', 'up', 'East'];
  public histAxisNames = ['Front', 'up', 'Right'];
  public selectedRatio = 1;

  public histStartTime: Date;
  public histEndTime: Date;
  public availableRatio = [1, 2, 4, 8, 16];
  constructor(private dataModel: DataModelService, private sock: SockService) {
    this.status = dataModel.status;

  }

  ngOnInit() {

  }

  public objToArray(obj) {
    return Object.keys(obj);
  }
  public play() {
    this.status.playing = true;
    this.sock.play(this.status.animationStartTime.valueOf(), this.status.animationEndTime.valueOf(), this.selectedRatio, this.status.selectedDate);
  }
  public stop() {
    this.status.playing = false;
    this.sock.stop();
  }

  public selectRatio(ratio) {
    this.selectedRatio = ratio;
  }

  public selectHistSource(histSource) {
    this.status.selectedHistSource = histSource;
    this.updateHist();
  }

  public getPlayingTime() {
    if (this.status.playingTime) {
      return this.status.playingTime.toString().slice(15, 25);
    }
  }

  public updateHist() {
    this.sock.updateHist();
  }

  public pause() {
    this.sock.pause();
    this.status.playing = false;
  }

  public getAxisNameForHist() {
    if (this.status.selectedHistSource === 'Torso Orient') {
      return this.axisNames;
    } else {
      return this.histAxisNames;
    }
  }

}
