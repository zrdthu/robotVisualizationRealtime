import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { DataModelService } from './services/data-model.service';
import { SocketIoModule, SocketIoConfig } from './modules/ng2-socket-io';
import { SockService } from './services/sock.service';
import { wsAddr } from './serverAddr';
import { StickFigureComponent } from './components/stick-figure/stick-figure.component';
import { BsDropdownModule } from 'ngx-bootstrap';
import { AlertModule } from 'ngx-bootstrap';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { FormsModule } from '@angular/forms';
import { ShpereHistComponent } from './components/shpere-hist/shpere-hist.component';
import { Left3dVisComponent } from './components/left-3d-vis/left-3d-vis.component';
import { TopNavBarComponent } from './components/top-nav-bar/top-nav-bar.component';
import { BottomTimeLineComponent } from './components/bottom-time-line/bottom-time-line.component';
import { NouisliderModule } from 'ng2-nouislider';
import { MiddleMapComponent } from './components/middle-map/middle-map.component';
import { RightLegendComponent } from './components/right-legend/right-legend.component';
import { AngularOpenlayersModule } from 'ngx-openlayers';
const config: SocketIoConfig = { url: wsAddr, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    StickFigureComponent,
    ShpereHistComponent,
    Left3dVisComponent,
    TopNavBarComponent,
    BottomTimeLineComponent,
    MiddleMapComponent,
    RightLegendComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NouisliderModule,
    SocketIoModule.forRoot(config),
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    TimepickerModule.forRoot(),
    AngularOpenlayersModule
  ],
  providers: [SockService, DataModelService],
  bootstrap: [AppComponent]
})
export class AppModule { }
