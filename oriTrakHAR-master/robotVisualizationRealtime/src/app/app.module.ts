import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { DataModelService } from './services/data-model.service';
import { SocketIoModule, SocketIoConfig } from './modules/ng2-socket-io';
import { SockService } from './services/sock.service';
import { wsAddr } from './serverAddr';

import { NvD3Module } from 'angular2-nvd3';
import { StickFigureComponent } from './components/stick-figure/stick-figure.component';

const config: SocketIoConfig = { url: wsAddr, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    StickFigureComponent,
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    NvD3Module
  ],
  providers: [SockService, DataModelService],
  bootstrap: [AppComponent]
})
export class AppModule { }
