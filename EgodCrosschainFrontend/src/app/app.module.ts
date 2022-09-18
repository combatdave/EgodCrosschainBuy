import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OneClickBuyComponent } from './one-click-buy/one-click-buy.component';
import { WinRefService } from './win-ref.service';


@NgModule({
  declarations: [
    AppComponent,
    OneClickBuyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [WinRefService],
  bootstrap: [AppComponent]
})
export class AppModule { }
