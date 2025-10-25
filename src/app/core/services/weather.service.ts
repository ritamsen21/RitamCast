import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { DailyForecast, GeoLocation, HourlyTrend, WeatherSnapshot, WeatherSummary } from '../models/weather.models';

interface GeocodingResponse {
  results?: Array<{
    id?: number;
    name: string;
    country?: string;
    country_code?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    elevation?: number;
  }>;
}

interface OpenMeteoResponse {
  timezone: string;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

const WEATHER_CODE_LOOKUP: Record<number, { label: string; iconKey: string }> = {
  0: { label: 'Clear sky', iconKey: 'clear-day' },
  1: { label: 'Mostly clear', iconKey: 'partly-cloudy-day' },
  2: { label: 'Partly cloudy', iconKey: 'partly-cloudy-day' },
  3: { label: 'Overcast', iconKey: 'cloudy' },
  45: { label: 'Foggy', iconKey: 'fog' },
  48: { label: 'Rime fog', iconKey: 'fog' },
  51: { label: 'Light drizzle', iconKey: 'drizzle' },
  53: { label: 'Moderate drizzle', iconKey: 'drizzle' },
  55: { label: 'Dense drizzle', iconKey: 'drizzle' },
  56: { label: 'Freezing drizzle', iconKey: 'ice' },
  57: { label: 'Dense freezing drizzle', iconKey: 'ice' },
  61: { label: 'Light rain', iconKey: 'rain' },
  63: { label: 'Moderate rain', iconKey: 'rain' },
  65: { label: 'Heavy rain', iconKey: 'rain' },
  66: { label: 'Freezing rain', iconKey: 'ice' },
  67: { label: 'Heavy freezing rain', iconKey: 'ice' },
  71: { label: 'Light snow', iconKey: 'snow' },
  73: { label: 'Moderate snow', iconKey: 'snow' },
  75: { label: 'Heavy snow', iconKey: 'snow' },
  77: { label: 'Snow grains', iconKey: 'snow' },
  80: { label: 'Light showers', iconKey: 'rain' },
  81: { label: 'Moderate showers', iconKey: 'rain' },
  82: { label: 'Violent showers', iconKey: 'rain' },
  85: { label: 'Snow showers', iconKey: 'snow' },
  86: { label: 'Heavy snow showers', iconKey: 'snow' },
  95: { label: 'Thunderstorm', iconKey: 'thunder' },
  96: { label: 'Thunderstorm with hail', iconKey: 'thunder' },
  99: { label: 'Severe thunderstorm', iconKey: 'thunder' }
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';

  searchLocations(query: string, count = 5): Observable<GeoLocation[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return new Observable<GeoLocation[]>((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    const params = new HttpParams()
      .set('name', trimmed)
      .set('count', count)
      .set('language', 'en')
      .set('format', 'json');

    return this.http.get<GeocodingResponse>(this.geocodingUrl, { params }).pipe(
      map((response) =>
        (response.results ?? []).map((result) => ({
          id: result.id,
          name: result.name,
          country: result.country,
          country_code: result.country_code,
          admin1: result.admin1,
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone,
          elevation: result.elevation
        }))
      )
    );
  }

  getWeather(location: GeoLocation): Observable<WeatherSummary> {
    const params = new HttpParams()
      .set('latitude', location.latitude)
      .set('longitude', location.longitude)
      .set('current_weather', 'true')
      .set('hourly', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max')
      .set('forecast_days', '7')
      .set('timezone', 'auto');

    return this.http.get<OpenMeteoResponse>(this.forecastUrl, { params }).pipe(
      map((response) => this.transformWeather(response, location))
    );
  }

  private transformWeather(response: OpenMeteoResponse, location: GeoLocation): WeatherSummary {
    const currentTime = response.current_weather.time;
    const hourlyTime = response.hourly.time ?? [];
    const currentIndex = Math.max(hourlyTime.indexOf(currentTime), 0);

    const humidity = response.hourly.relative_humidity_2m?.[currentIndex] ?? 0;
    const feelsLike = response.hourly.apparent_temperature?.[currentIndex] ?? response.current_weather.temperature;
    const precipitationProbability = response.hourly.precipitation_probability?.[currentIndex] ?? 0;

    const codeData = this.mapWeatherCode(response.current_weather.weathercode);

    const currentSnapshot: WeatherSnapshot = {
      temperature: response.current_weather.temperature,
      feelsLike,
      humidity,
      windSpeed: response.current_weather.windspeed,
      windDirection: response.current_weather.winddirection,
      windDirectionCardinal: this.toCardinal(response.current_weather.winddirection),
      weatherCode: response.current_weather.weathercode,
      condition: codeData.label,
      iconKey: codeData.iconKey,
      precipitationProbability,
      time: currentTime,
      sunrise: response.daily.sunrise?.[0] ?? currentTime,
      sunset: response.daily.sunset?.[0] ?? currentTime,
      uvIndex: response.daily.uv_index_max?.[0] ?? 0,
      timezone: response.timezone
    };

    const dailyForecast: DailyForecast[] = (response.daily.time ?? []).map((date, index) => {
      const dayCodeData = this.mapWeatherCode(response.daily.weather_code?.[index] ?? 0);
      return {
        date,
        minTemp: response.daily.temperature_2m_min?.[index] ?? 0,
        maxTemp: response.daily.temperature_2m_max?.[index] ?? 0,
        weatherCode: response.daily.weather_code?.[index] ?? 0,
        condition: dayCodeData.label,
        iconKey: dayCodeData.iconKey,
        precipitationProbability: response.daily.precipitation_probability_max?.[index] ?? 0
      };
    });

    const hourlyTrend: HourlyTrend[] = hourlyTime.slice(0, 12).map((time, index) => ({
      time,
      temperature: response.hourly.temperature_2m?.[index] ?? 0,
      precipitationProbability: response.hourly.precipitation_probability?.[index] ?? 0,
      weatherCode: response.hourly.weather_code?.[index] ?? response.current_weather.weathercode
    }));

    return {
      location: {
        ...location,
        timezone: response.timezone
      },
      current: currentSnapshot,
      daily: dailyForecast,
      hourly: hourlyTrend,
      fetchedAt: new Date().toISOString()
    };
  }

  private mapWeatherCode(code: number): { label: string; iconKey: string } {
    return WEATHER_CODE_LOOKUP[code] ?? { label: 'Unknown', iconKey: 'default' };
  }

  private toCardinal(direction: number): string {
    const degrees = ((direction % 360) + 360) % 360;
    const sectors = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % sectors.length;
    return sectors[index];
  }
}
