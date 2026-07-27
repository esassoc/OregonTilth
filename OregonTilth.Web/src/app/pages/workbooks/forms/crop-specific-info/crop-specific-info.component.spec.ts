import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CropSpecificInfoComponent } from './crop-specific-info.component';

describe('CropSpecificInfoComponent', () => {
  let component: CropSpecificInfoComponent;
  let fixture: ComponentFixture<CropSpecificInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CropSpecificInfoComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CropSpecificInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
