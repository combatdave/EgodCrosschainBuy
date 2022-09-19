import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OneClickBuyComponent } from './one-click-buy/one-click-buy.component';
import { WinRefService } from './win-ref.service';
import { ErrorMessageRendererComponent } from './error-message-renderer/error-message-renderer.component';


@NgModule({
  declarations: [
    AppComponent,
    OneClickBuyComponent,
    ErrorMessageRendererComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [WinRefService],
  bootstrap: [AppComponent]
})
export class AppModule { }
