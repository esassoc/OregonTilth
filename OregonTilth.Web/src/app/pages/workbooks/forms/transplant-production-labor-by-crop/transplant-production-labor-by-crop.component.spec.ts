import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionLaborByCropComponent } from './transplant-production-labor-by-crop.component';

describe('TransplantProductionLaborByCropComponent', () => {
  let component: TransplantProductionLaborByCropComponent;
  let fixture: ComponentFixture<TransplantProductionLaborByCropComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionLaborByCropComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionLaborByCropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
