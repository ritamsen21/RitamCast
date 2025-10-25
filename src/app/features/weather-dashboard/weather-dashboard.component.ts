import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GeoLocation, WeatherSummary } from '../../core/models/weather.models';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './weather-dashboard.component.html',
  styleUrl: './weather-dashboard.component.scss'
})
export class WeatherDashboardComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl<string>('Kolkata', { nonNullable: true });

  readonly quickLinks: GeoLocation[] = [
    { name: 'Kolkata', country: 'India', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
    { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
    { name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276 },
    { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 }
  ];

  readonly suggestions = signal<GeoLocation[]>([]);
  readonly weather = signal<WeatherSummary | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly defaultLocation = this.quickLinks[0];

  constructor() {
    this.setupSearchListener();
    effect(() => {
      if (!this.weather()) {
        this.loadWeatherForLocation(this.defaultLocation);
      }
    });
  }

  get hasWeather(): boolean {
    return !!this.weather();
  }

  onSubmit(): void {
    const query = this.searchControl.value.trim();
    if (!query) {
      return;
    }

    this.loadWeatherFromQuery(query);
  }

  onSuggestionSelect(location: GeoLocation): void {
    this.loadWeatherForLocation(location);
  }

  onQuickLinkSelect(location: GeoLocation): void {
    this.loadWeatherForLocation(location);
  }

  trackByDate(_: number, item: { date: string }): string {
    return item.date;
  }

  trackByTime(_: number, item: { time: string }): string {
    return item.time;
  }

  formatLocation(location: GeoLocation | null): string {
    if (!location) {
      return '';
    }

    if (location.country) {
      return location.country === location.name
        ? location.name
        : `${location.name}, ${location.country}`;
    }

    return location.name;
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged((previous, current) => previous.trim() === current.trim()),
        switchMap((value) => {
          const trimmed = value.trim();
          if (trimmed.length < 2) {
            this.suggestions.set([]);
            return of([]);
          }

          return this.weatherService.searchLocations(trimmed).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => this.suggestions.set(results));
  }

  private loadWeatherForLocation(location: GeoLocation): void {
    this.loading.set(true);
    this.error.set(null);
    this.searchControl.setValue(location.name, { emitEvent: false });
    this.suggestions.set([]);

    this.weatherService
      .getWeather(location)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.weather.set(summary);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load live weather right now. Please try another city.');
          this.loading.set(false);
        }
      });
  }

  private loadWeatherFromQuery(query: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.suggestions.set([]);

    this.weatherService
      .searchLocations(query, 1)
      .pipe(
        switchMap((results) => {
          const match = results[0];
          if (!match) {
            return throwError(() => new Error('No matching city found.'));
          }

          return this.weatherService.getWeather(match);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.error.set(err?.message ?? 'Unable to find that city right now.');
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe((summary) => {
        if (!summary) {
          return;
        }

        this.weather.set(summary);
        this.searchControl.setValue(summary.location.name, { emitEvent: false });
        this.loading.set(false);
      });
  }
}
