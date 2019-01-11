import { Component, OnInit } from '@angular/core';
import { SockService } from '../../services/sock.service';
import { DataModelService } from '../../services/data-model.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-middle-map',
  templateUrl: './middle-map.component.html',
  styleUrls: ['./middle-map.component.css']
})
export class MiddleMapComponent implements OnInit {
  public status;
  // public points = [{x: -84.396, y: 33.775}, {x: -84.3962, y: 33.7756}];
  // public clusters = {
  //   cluster1: {
  //     points: [{x: -84.396, y: 33.775}, {x: -84.3962, y: 33.7756}],
  //     color: '#3399CC'
  //   },
  //   cluster2: {
  //     points: [{x: -84.391, y: 33.29}, {x: -84.3962, y: 33.7756}, {x: -84.4, y: 33.8}],
  //     color: '#CC9933'
  //   }
  // };
  public mapUpdateObservable: Observable<any> = this.dataModel.getNewMapUpdate()
  public colorPalette;
  public clusterPoints = {}


  constructor(private dataModel: DataModelService, private sock: SockService) {
    this.status = dataModel.status;
    this.colorPalette = dataModel.colorPalette;
    this.mapUpdateObservable.subscribe(msg => {
      this.clusterPoints = {}
      setTimeout((() => {
        this.clusterPoints = msg
      }).bind(this), 0)
    })
  }

  deepcopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  ngOnInit() {
  }

  getKeys(obj) {
    return Object.keys(obj);
  }

  onPointClick(p) {
    console.log(p);
  }

  getColor(clusterKey, alpha) {
    var color = this.deepcopy(this.dataModel.colorPalette[clusterKey])//.map(d => d/255)
    color.push(alpha)
    return color
  }



}
