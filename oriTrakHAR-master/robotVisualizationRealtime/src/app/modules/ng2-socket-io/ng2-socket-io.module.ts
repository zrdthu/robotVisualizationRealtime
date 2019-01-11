import { NgModule, ModuleWithProviders } from '@angular/core';
// This module is a basically a copy-paste of the ng2-socket-io on npm.
// Its angular version is < 4 and it doesn't play well with the rest of the code,
// so I refactored it here.
import { SocketIoService } from './socket-io.service';
import { SocketIoConfig } from './socketIoConfig';

export function SocketFactory(config: SocketIoConfig) {
    return new SocketIoService(config);
}
export const socketConfig = '__SOCKET_IO_CONFIG__';
@NgModule({})

export class Ng2SocketIoModule {
  static forRoot(config: SocketIoConfig): ModuleWithProviders {
      return {
          ngModule: Ng2SocketIoModule,
          providers: [
              { provide: socketConfig, useValue: config },
              {
                  provide: SocketIoService,
                  useFactory: SocketFactory,
                  deps : [socketConfig]
              }
          ]
      };
  }
}
