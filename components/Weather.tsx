import React, { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  location: string;
  icon: string;
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    // Check if user has already denied permission
    const deniedPermission = localStorage.getItem('weather_permission_denied');
    if (deniedPermission) {
      setError('Location permission denied');
      return;
    }

    // Check if we have cached weather data
    const cachedWeather = localStorage.getItem('cached_weather');
    const cachedTime = localStorage.getItem('weather_cache_time');
    const now = Date.now();

    if (cachedWeather && cachedTime) {
      const cacheAge = now - parseInt(cachedTime);
      // Use cache if less than 30 minutes old
      if (cacheAge < 30 * 60 * 1000) {
        setWeather(JSON.parse(cachedWeather));
        return;
      }
    }

    // Request location and fetch weather
    const getWeather = () => {
      if ('geolocation' in navigator) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Using Open-Meteo API (free, no API key required)
              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m&timezone=auto`
              );
              const weatherData = await weatherResponse.json();

              // Get location name using reverse geocoding
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const geoData = await geoResponse.json();
              const locationName = geoData.address?.city || geoData.address?.town || 'Your Location';

              const current = weatherData.current;
              const weatherCode = current.weather_code;
              
              // Map WMO weather codes to descriptions and emojis
              const getWeatherInfo = (code: number) => {
                if (code === 0) return { desc: 'Clear Sky', icon: '☀️' };
                if (code === 1 || code === 2) return { desc: 'Partly Cloudy', icon: '⛅' };
                if (code === 3) return { desc: 'Overcast', icon: '☁️' };
                if (code === 45 || code === 48) return { desc: 'Foggy', icon: '🌫️' };
                if (code >= 51 && code <= 67) return { desc: 'Drizzle', icon: '🌦️' };
                if (code >= 71 && code <= 77) return { desc: 'Snow', icon: '❄️' };
                if (code === 80 || code === 81 || code === 82) return { desc: 'Rain', icon: '🌧️' };
                if (code >= 85 && code <= 86) return { desc: 'Snow Shower', icon: '🌨️' };
                if (code === 95 || code === 96 || code === 99) return { desc: 'Thunderstorm', icon: '⛈️' };
                return { desc: 'Unknown', icon: '🌡️' };
              };

              const { desc, icon } = getWeatherInfo(weatherCode);

              const weatherInfo: WeatherData = {
                temperature: Math.round(current.temperature_2m),
                description: desc,
                location: locationName,
                icon: icon
              };

              setWeather(weatherInfo);
              // Cache the weather data
              localStorage.setItem('cached_weather', JSON.stringify(weatherInfo));
              localStorage.setItem('weather_cache_time', now.toString());
              setError(null);
            } catch (err) {
              setError('Failed to fetch weather');
              console.error('Weather fetch error:', err);
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            if (err.code === 1) { // Permission denied
              localStorage.setItem('weather_permission_denied', 'true');
              setError('Location access denied');
            } else {
              setError('Unable to get location');
            }
            setLoading(false);
          }
        );
      } else {
        setError('Geolocation not supported');
      }
    };

    if (!hasRequested) {
      getWeather();
      setHasRequested(true);
    }
  }, [hasRequested]);

  const handleRetry = () => {
    localStorage.removeItem('weather_permission_denied');
    localStorage.removeItem('cached_weather');
    localStorage.removeItem('weather_cache_time');
    setError(null);
    setWeather(null);
    setHasRequested(false);
  };

  if (error && error !== 'Location permission denied') {
    return null;
  }

  if (error === 'Location permission denied') {
    return (
      <button
        onClick={handleRetry}
        className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors shadow-lg text-xs md:text-sm"
        title="Enable location to see weather"
      >
        📍 Enable Weather
      </button>
    );
  }

  if (loading) {
    return (
      <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 shadow-lg text-xs md:text-sm">
        Loading...
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 flex items-center gap-2 md:gap-3 text-neutral-400 shadow-lg text-xs md:text-sm hover:border-neutral-600 transition-colors">
      <span className="text-lg md:text-xl">{weather.icon}</span>
      <span className="font-medium">{weather.temperature}°C</span>
      <span className="hidden sm:inline text-neutral-600">•</span>
      <span className="hidden sm:inline text-neutral-500">{weather.description}</span>
    </div>
  );
};

export default Weather;
