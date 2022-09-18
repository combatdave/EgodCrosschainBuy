import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneClickBuyComponent } from './one-click-buy.component';

describe('OneClickBuyComponent', () => {
  let component: OneClickBuyComponent;
  let fixture: ComponentFixture<OneClickBuyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OneClickBuyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OneClickBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
