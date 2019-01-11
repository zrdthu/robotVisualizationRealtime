import { Component, OnInit, ViewChild} from '@angular/core';
import { SockService } from '../../services/sock.service';
import { DataModelService } from '../../services/data-model.service';
import { Observable } from 'rxjs/Observable';
import { NouiFormatter } from 'ng2-nouislider';

export class TimeFormatterHHMMSS implements NouiFormatter {
  to(value: number): string {
    return new Date(value).toString().slice(15, 25);
  };

  from(value: string): number {
    return 0;
  }
}

export class TimeFormatterHHMM implements NouiFormatter {
  to(value: number): string {
    return new Date(value).toString().slice(15, 21);
  };

  from(value: string): number {
    return 0;
  }
}


@Component({
  selector: 'app-bottom-time-line',
  templateUrl: './bottom-time-line.component.html',
  styleUrls: ['./bottom-time-line.component.css']
})
export class BottomTimeLineComponent implements OnInit {
  @ViewChild('nouislider') nouislider: any;
  private MAX_WINDOW_SIZE = 3600000;
  private MIN_WINDOW_SIZE = 30000;
  public status = this.dataModel.status;
  public formatter_hhmmss = new TimeFormatterHHMMSS()
  public formatter_hhmm = new TimeFormatterHHMM()
  public minTime = 0;
  public maxTime = 5;

  public config = {
    connect: [false, true, true, true, false],
    start: [1, 2, 3, 4],
    step: 1000,
    tooltips: [this.formatter_hhmmss, this.formatter_hhmmss, this.formatter_hhmmss, this.formatter_hhmmss],
    animationDuration: 5,
    pips: {
      mode: 'values',
      values: [],
      format: this.formatter_hhmm,
    }
  };
  // public status.start_selected_end =  [1, 2, 3, 5];

  private previousEvent = [];
  public histUpdateTimeout;


  newDateSelectedObservable: Observable<any> = this.dataModel.getNewDateSelectedSubscribable();
  constructor(private dataModel: DataModelService, private sock: SockService) {

  }

  ngOnInit() {
    this.newDateSelectedObservable.subscribe(handleNewDateSelected.bind(this));
    function handleNewDateSelected(msg) {
      // console.log(`${JSON.stringify(this.config)} msg: ${JSON.stringify(msg)}`)
      this.minTime = msg.min;
      this.maxTime = msg.max;
      var startingDate = new Date(this.minTime)
      startingDate.setMinutes(0);
      startingDate.setMilliseconds(0);
      var startT = startingDate.valueOf();
      var endingDate = new Date(this.maxTime);
      endingDate.setHours(endingDate.getHours() + 1)
      endingDate.setMinutes(0);
      endingDate.setMilliseconds(0);
      var endT = endingDate.valueOf();
      var valueList = []
      for (var i = startT; i < endT; i = i + 1800000) {
        valueList.push(i)
      }
      valueList = valueList.filter(d => (d >= this.minTime) && (d <= this.maxTime))
      if (valueList[0] - this.minTime > 300000) {
        valueList = [this.minTime].concat(valueList)
      }
      if (this.maxTime - valueList[valueList.length - 1] > 300000) {
        valueList.push(this.maxTime)
      }
      this.config.pips.values = valueList

      if (this.nouislider) {
        this.nouislider.slider.updateOptions({range: {min: msg.min, max: msg.max}});
        this.nouislider.slider.updateOptions(this.config);
      } else {
        this.onChange([msg.min, msg.min + 300000, msg.min + 1200000, msg.max])
      }
      this.status.start_selected_end = [msg.min, msg.min + 300000, msg.min + 1200000, msg.max];
    }
  }

  public onChange(event) {
    this.dataModel.status.selectedTimeStart = new Date(event[0]);
    this.dataModel.status.selectedTimeEnd = new Date(event[3]);
    this.dataModel.status.animationStartTime = new Date(event[1]);
    this.dataModel.status.histStartTime = new Date(event[1]);
    this.dataModel.status.animationEndTime = new Date(event[2]);
    this.dataModel.status.histEndTime = new Date(event[2]);
    if (this.histUpdateTimeout) {
      clearTimeout(this.histUpdateTimeout)
      this.histUpdateTimeout = false
    }
    this.histUpdateTimeout = setTimeout((() => {
      // Auto change window logic
      if (event[0] !== this.previousEvent[0]) {
        console.log('changed 0');
      } else if (event[3] !== this.previousEvent[3]) {

      } else {
        if (this.status.windowFixed) {
          if ((event[1] + this.status.windowWidth) > event[3]) {
            this.status.start_selected_end = [event[0], event[3] - this.status.windowWidth, event[3], event[3]];
          } else if ((event[2] - this.status.windowWidth) < event[0]) {
            this.status.start_selected_end = [event[0], event[0], event[0] + this.status.windowWidth, event[3]];
          } else if (event[1] !== this.previousEvent[1]) {
            // console.log('1 moved')
            this.status.start_selected_end = [event[0], event[1], event[1] + this.status.windowWidth, event[3]];
          } else if (event[2] !== this.previousEvent[2]) {
            // console.log('2 moved')
            this.status.start_selected_end = [event[0], event[2] - this.status.windowWidth, event[2], event[3]];
          }
        } else {
          if (event[1] !== this.previousEvent[1]) {
            // User moved interested_window_start
            // console.log('move 1')
            if ((event[2] - event[1]) < this.MIN_WINDOW_SIZE) {
              console.log('too small')
              this.status.start_selected_end = [event[0], event[1], event[1] + this.MIN_WINDOW_SIZE, event[3]]
              if (this.status.start_selected_end[2] > this.status.start_selected_end[3]) {
                this.status.start_selected_end = [event[0], event[1], event[3], event[3]]
              }
            } else if ((event[2] - event[1]) > this.MAX_WINDOW_SIZE) {
              this.status.start_selected_end = [event[0], event[1], event[1] + this.MAX_WINDOW_SIZE, event[3]]
            }
          } else if (event[2] !== this.previousEvent[2]) {
            // console.log('move 2')
            // User moved interested_window_end
            if ((event[2] - event[1]) > this.MAX_WINDOW_SIZE) {
              this.status.start_selected_end[1] = event[2] - this.MAX_WINDOW_SIZE;
              this.status.start_selected_end = [event[0], event[2] - this.MAX_WINDOW_SIZE, event[2], event[3]]
              // console.log(this.status.start_selected_end)
            } else if ((event[2] - event[1]) < this.MIN_WINDOW_SIZE) {
              this.status.start_selected_end = [event[0], event[2] - this.MIN_WINDOW_SIZE, event[2], event[3]]

            }
          }

          if (event[1] === event[2]) {
            this.status.start_selected_end = [event[0], event[1], event[1] + this.MIN_WINDOW_SIZE, event[3]]
            if (this.status.start_selected_end[2] > this.status.start_selected_end[3]) {
              this.status.start_selected_end = [event[0], event[1], event[3], event[3]]
            }
          }
        }
        this.sock.updateHist();
      }
      this.dataModel.updateDisplayClusterData();
      this.previousEvent = JSON.parse(JSON.stringify(event));
    }).bind(this, event), 80);
  }


}
