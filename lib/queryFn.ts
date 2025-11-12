import axios from 'axios';
import { OPENWEATHER_KEY } from '@env';

export const fetchWeatherByCity = async (place: string) => {
  try {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${OPENWEATHER_KEY}`
    );
    return data;

    // if (lat !== 0 && lon !== 0 && place.length < 2) {
    //   const { data } = await axios.get(
    //     `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}`
    //   );
    //   return data;
    // }
  } catch (error) {
    console.log(error);
  }
};

export const fetchCitySuggestions = async (query: string) => {
  if (!query) return [];
  try {
    const {data} = await axios.get(
      `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${OPENWEATHER_KEY}`
    );
    return data.list.map((item: any) => item.name);
  } catch (e) {
    console.log(e);
  }
};
