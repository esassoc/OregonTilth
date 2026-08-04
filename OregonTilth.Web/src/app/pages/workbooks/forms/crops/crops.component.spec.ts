import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CropsComponent } from './crops.component';

describe('CropsComponent', () => {
  let component: CropsComponent;
  let fixture: ComponentFixture<CropsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CropsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CropsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
