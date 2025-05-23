import React, { useState, useEffect } from "react";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  MapPin,
} from "lucide-react";

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
        const CITY = process.env.REACT_APP_WEATHER_CITY || "Minsk";
        const COUNTRY_CODE = process.env.REACT_APP_WEATHER_COUNTRY_CODE || "BY";

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY_CODE}&appid=${API_KEY}&units=metric&lang=ru`
        );

        if (!response.ok) {
          throw new Error(`Ошибка ${response.status}: Проверьте настройки`);
        }

        const data = await response.json();

        setWeather({
          location: `${data.name}, ${
            process.env.REACT_APP_WEATHER_CITY || "Беларусь"
          }`,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main.toLowerCase(),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition) => {
    const icons = {
      clouds: <Cloud className="weather-icon" />,
      clear: <Sun className="weather-icon" />,
      rain: <CloudRain className="weather-icon" />,
      snow: <CloudSnow className="weather-icon" />,
    };
    return icons[condition] || <Sun className="weather-icon" />;
  };

  if (loading) return <div className="weather-loading">Загрузка погоды...</div>;
  if (error) return <div className="weather-error">{error}</div>;

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <h3>Погода в {process.env.REACT_APP_WEATHER_CITY || "Беларуси"}</h3>
        <div className="location">
          <MapPin className="icon-small" />
          <span>{weather.location}</span>
        </div>
      </div>

      <div className="weather-main">
        {getWeatherIcon(weather.condition)}
        <div className="weather-data">
          <span className="temperature">{weather.temperature}°C</span>
          <span className="description">{weather.description}</span>
        </div>
      </div>

      <div className="weather-details">
        <div className="detail">
          <Droplets className="icon-small" />
          <span>Влажность: {weather.humidity}%</span>
        </div>
        <div className="detail">
          <Wind className="icon-small" />
          <span>Ветер: {weather.windSpeed} км/ч</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
