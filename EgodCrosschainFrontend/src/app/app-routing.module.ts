import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OneClickBuyComponent } from './one-click-buy/one-click-buy.component';

const routes: Routes = [
  { path: '', component: OneClickBuyComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
