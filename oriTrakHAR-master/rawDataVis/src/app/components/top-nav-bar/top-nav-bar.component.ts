import { Component, OnInit } from '@angular/core';
import { SockService } from '../../services/sock.service';
import { DataModelService } from '../../services/data-model.service';

@Component({
  selector: 'app-top-nav-bar',
  templateUrl: './top-nav-bar.component.html',
  styleUrls: ['./top-nav-bar.component.scss']
})
export class TopNavBarComponent implements OnInit {
  public status;
  constructor(private dataModel: DataModelService, private sock: SockService) {
    this.status = this.dataModel.status;
  }

  ngOnInit() {
  }
  public objToArray(obj) {
    return Object.keys(obj);
  }

  public selectDate(date) {
    this.dataModel.updateStartTime(date);
    this.sock.updateHist();
  }

  public playWin() {
    this.dataModel.status.winPlaying = true;
    this.dataModel.windowPlay();
  }

  public stopWin() {
    this.dataModel.status.winPlaying = false;
    this.dataModel.stopPlay();
  }

  public toggleWindowFixed() {
    this.dataModel.status.windowFixed = !this.dataModel.status.windowFixed;
    this.dataModel.status.windowWidth = this.dataModel.status.histEndTime.valueOf() - this.dataModel.status.histStartTime.valueOf()
  }

  public selectSlowDown(option) {
    this.dataModel.status.windowPlaySlowDownFactor = option
    if (this.dataModel.windowPlayInterval) {
      this.dataModel.stopPlay();
      this.dataModel.windowPlay();
    }
  }
}
