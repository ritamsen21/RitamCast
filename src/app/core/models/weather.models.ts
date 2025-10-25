export interface GeoLocation {
  id?: number;
  name: string;
  country?: string;
  country_code?: string;
  timezone?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface WeatherSnapshot {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCardinal: string;
  weatherCode: number;
  condition: string;
  iconKey: string;
  precipitationProbability: number;
  time: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  timezone: string;
}

export interface DailyForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  weatherCode: number;
  condition: string;
  iconKey: string;
  precipitationProbability: number;
}

export interface HourlyTrend {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherSummary {
  location: GeoLocation;
  current: WeatherSnapshot;
  daily: DailyForecast[];
  hourly: HourlyTrend[];
  fetchedAt: string;
}
