import { Component } from '@angular/core';
import { WeatherDashboardComponent } from './features/weather-dashboard/weather-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WeatherDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();
}
