import { Component, OnInit } from '@angular/core';
import { SockService } from '../../services/sock.service';
import { DataModelService } from '../../services/data-model.service';
@Component({
  selector: 'app-right-legend',
  templateUrl: './right-legend.component.html',
  styleUrls: ['./right-legend.component.css']
})
export class RightLegendComponent implements OnInit {
  status;
  colorPalette;
  constructor(private dataModel: DataModelService, private sock: SockService) {
    this.status = dataModel.status;
    this.colorPalette = dataModel.colorPalette;
  }

  ngOnInit() {
  }

  public objToArray(obj) {
    return Object.keys(obj);
  }

  public selectCluster(option) {
    this.status.selectedCluster = option;
    if (! this.dataModel.clusterData[option]) {
      this.sock.getClusterData(option);
    }
  }
  getKeys(obj) {
    return Object.keys(obj);
  }

  getStyle(cluster_id) {

  }

  getColor(cluster_id) {
    var color = ['rgb(', this.dataModel.colorPalette[cluster_id].join(','), ')'].join('')
    var white = 'rgb(255, 255, 255)'
    var ans
    if (this.status.clustersOnOff[cluster_id]) {
      ans = color
    } else {
      ans = white
    }
    return {
      'background-color': ans,
      'border-style': 'solid',
      'border-width': '3px',
      'border-color': color,
      'border-radius': '10px',
      'width': '80%',
      'height': '30px',
      'text-align': 'center'
    }
  }

  toggleClusterOnoff(cluster_id) {
    console.log(this.status.clustersOnOff)
    console.log(cluster_id)
    console.log( this.status.clustersOnOff[cluster_id])
    this.status.clustersOnOff[cluster_id] = !this.status.clustersOnOff[cluster_id]
    this.dataModel.updateDisplayClusterData()
  }

  // public getClusters() {
  //   return Object.keys(this.dataModel.clusterData[this.status.availableClusters[this.status.selectedCluster]])
  // }

}
