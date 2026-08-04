import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MachineryComponent } from './machinery.component';

describe('MachineryComponent', () => {
  let component: MachineryComponent;
  let fixture: ComponentFixture<MachineryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [MachineryComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
