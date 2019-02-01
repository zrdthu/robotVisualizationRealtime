import { Component } from '@angular/core';
import { SockService } from './services/sock.service';
import { DataModelService } from './services/data-model.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  status
  axisNames
  constructor(private dataModel: DataModelService, private sock: SockService) {
    this.status = dataModel.status;
    console.log(this.status);
    this.axisNames = ['north', 'Up', 'East'];
  }
}
