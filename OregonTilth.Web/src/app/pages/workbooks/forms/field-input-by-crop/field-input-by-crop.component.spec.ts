import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FieldInputByCropComponent } from './field-input-by-crop.component';

describe('TransplantProductionLaborByCropComponent', () => {
  let component: FieldInputByCropComponent;
  let fixture: ComponentFixture<FieldInputByCropComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FieldInputByCropComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldInputByCropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
