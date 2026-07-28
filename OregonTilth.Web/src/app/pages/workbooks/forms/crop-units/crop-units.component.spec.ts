import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CropUnitsComponent } from './crop-units.component';

describe('CropUnitsComponent', () => {
  let component: CropUnitsComponent;
  let fixture: ComponentFixture<CropUnitsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CropUnitsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CropUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
