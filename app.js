// app.js
const $ = id => document.getElementById(id);
const getBtn = $('getBtn');
const locationInput = $('locationInput');
const output = $('output');

const weatherCodeMap = {
  0: 'Clear sky',1: 'Mainly clear',2: 'Partly cloudy',3: 'Overcast',
  45: 'Fog',48: 'Depositing rime fog',
  51: 'Light drizzle',53: 'Moderate drizzle',55: 'Dense drizzle',
  56: 'Light freezing drizzle',57: 'Dense freezing drizzle',
  61: 'Slight rain',63: 'Moderate rain',65: 'Heavy rain',
  66: 'Light freezing rain',67: 'Heavy freezing rain',
  71: 'Slight snow fall',73: 'Moderate snow fall',75: 'Heavy snow fall',
  77: 'Snow grains',80: 'Slight rain showers',81: 'Moderate rain showers',82: 'Violent rain showers',
  85: 'Slight snow showers',86: 'Heavy snow showers',
  95: 'Thunderstorm',96: 'Thunderstorm with slight hail',99: 'Thunderstorm with heavy hail'
};

function showError(msg){
  output.innerHTML = `<div class="error">${escapeHtml(msg)}</div>`;
}

function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

async function geocodeLocation(name){
  // Open-Meteo geocoding (free)
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Location not found (geocoding failed).');
  const data = await res.json();
  if(!data.results || !data.results.length) throw new Error('No matching location found.');
  return data.results[0];
}

async function getWeatherForCoords(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Weather request failed.');
  return res.json();
}

function renderResult({place, coords, weather}){
  const desc = weatherCodeMap[weather.weathercode] || 'Unknown';
  const tC = weather.temperature;
  const tF = (tC * 9/5 + 32).toFixed(1);
  const wind = weather.windspeed;
  const time = weather.time;
  output.innerHTML = `
    <div class="result">
      <div class="icon">☁️</div>
      <div class="meta">
        <div style="font-weight:700;font-size:16px">${escapeHtml(place)}</div>
        <div class="muted small">Coordinates: ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}</div>
        <div style="margin-top:8px">${escapeHtml(desc)} — <strong>${tC.toFixed(1)}°C</strong> / ${tF}°F</div>
        <div class="muted small">Wind: ${wind} m/s · As of: ${escapeHtml(time)}</div>
      </div>
    </div>
  `;
}

getBtn.addEventListener('click', async ()=>{
  const name = locationInput.value.trim();
  if(!name) return showError('Please enter a location name.');
  output.innerHTML = '<div class="muted small">Finding location and fetching weather…</div>';

  try{
    const loc = await geocodeLocation(name);
    const lat = loc.latitude;
    const lon = loc.longitude;
    const placeLabel = `${loc.name}${loc.admin1 ? ', '+loc.admin1 : ''}, ${loc.country}`;

    const weatherResp = await getWeatherForCoords(lat, lon);
    if(!weatherResp.current_weather) throw new Error('No current weather available from Open-Meteo.');
    renderResult({place: placeLabel, coords:{lat,lon}, weather: weatherResp.current_weather});
  }catch(err){
    showError(err.message || String(err));
  }
});

locationInput.addEventListener('keydown', e => { if(e.key === 'Enter') getBtn.click(); });
