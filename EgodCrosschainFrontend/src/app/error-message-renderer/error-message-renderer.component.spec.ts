import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorMessageRendererComponent } from './error-message-renderer.component';

describe('ErrorMessageRendererComponent', () => {
  let component: ErrorMessageRendererComponent;
  let fixture: ComponentFixture<ErrorMessageRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ErrorMessageRendererComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorMessageRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
