import { Component, OnInit } from '@angular/core';
import { SockService } from './services/sock.service';
import { DataModelService } from './services/data-model.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private dataModel: DataModelService, private sock: SockService) {

  }

  public ngOnInit() {

  }

}
