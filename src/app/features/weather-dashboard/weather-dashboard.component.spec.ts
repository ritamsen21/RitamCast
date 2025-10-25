import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { WeatherDashboardComponent } from './weather-dashboard.component';

describe('WeatherDashboardComponent', () => {
  let fixture: ComponentFixture<WeatherDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherDashboardComponent],
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDashboardComponent);
  });

  it('should create the weather dashboard', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should seed the default search value', () => {
    expect(fixture.componentInstance.searchControl.value).toBe('Kolkata');
  });
});
