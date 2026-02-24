/**
 * Open-Meteo APIで5日間天気予報を取得（APIキー不要）
 */

const LAT = 35.6762;
const LON = 139.6503;

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getWeather(code: number): { emoji: string; label: string } {
  if (code <= 1) return { emoji: "☀️", label: "晴れ" };
  if (code <= 3) return { emoji: "☁️", label: "曇り" };
  if (code <= 67) return { emoji: "🌧️", label: "雨" };
  return { emoji: "🌨️", label: "雪" };
}

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  emoji: string;
  label: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
}

export async function fetchWeatherForecast(): Promise<DailyForecast[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia/Tokyo&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    return data.daily.time.map((date: string, i: number) => {
      const w = getWeather(data.daily.weather_code[i]);
      return {
        date,
        dayOfWeek: DAYS[new Date(date).getDay()],
        emoji: w.emoji,
        label: w.label,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipProb: data.daily.precipitation_probability_max[i] || 0,
      };
    });
  } catch (err) {
    console.error("天気予報取得エラー:", err);
    return [];
  }
}
