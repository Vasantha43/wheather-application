import React, { useState } from 'react';

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

function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

export default function App(){
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  async function geocodeLocation(name){
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

  async function onGet(e){
    e && e.preventDefault();
    setResult(null);
    if(!q.trim()){ setStatus('Please enter a location name.'); return; }
    setStatus('Finding location and fetching weather…');
    try{
      const loc = await geocodeLocation(q.trim());
      const lat = loc.latitude;
      const lon = loc.longitude;
      const placeLabel = `${loc.name}${loc.admin1 ? ', '+loc.admin1 : ''}, ${loc.country}`;
      const weatherResp = await getWeatherForCoords(lat, lon);
      if(!weatherResp.current_weather) throw new Error('No current weather available from Open-Meteo.');
      setResult({
        place: placeLabel,
        coords: { lat, lon },
        weather: weatherResp.current_weather
      });
      setStatus('');
    }catch(err){
      setStatus(err.message || String(err));
    }
  }

  return (
    <div style={{
      background:'radial-gradient(1200px 600px at 10% 10%, rgba(6,182,212,0.08), transparent), #0f172a',
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24
    }}>
      <div style={{
        background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        borderRadius:14, padding:22, maxWidth:760, width:'100%', color:'white', boxShadow:'0 8px 30px rgba(2,6,23,0.6)'
      }}>
        <h1 style={{margin:0, fontSize:20}}>Weather by Location (No API Key)</h1>
        <p style={{color:'#94a3b8'}}>Type a <strong>city</strong> or <strong>country</strong> name. Uses Open-Meteo geocoding + forecast.</p>

        <form onSubmit={onGet} style={{display:'flex', gap:8}}>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="e.g. London, Japan, Rio de Janeiro"
            aria-label="Location name"
            style={{flex:1, padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'inherit'}}
          />
          <button style={{padding:'10px 14px', borderRadius:10, border:0, background:'#06b6d4', color:'#042024', fontWeight:600}} type="submit">Get Weather</button>
        </form>

        <div style={{marginTop:16}}>
          {status && <div style={{color:'#94a3b8'}}>{status}</div>}
          {result && (
            <div style={{marginTop:12, padding:14, borderRadius:10, background:'rgba(255,255,255,0.02)', display:'flex', gap:14, alignItems:'center'}}>
              <div style={{fontSize:40}}>☁️</div>
              <div style={{lineHeight:1.25}}>
                <div style={{fontWeight:700, fontSize:16}} dangerouslySetInnerHTML={{__html:escapeHtml(result.place)}} />
                <div style={{color:'#94a3b8', fontSize:13}}>Coordinates: {result.coords.lat.toFixed(3)}, {result.coords.lon.toFixed(3)}</div>
                <div style={{marginTop:8}}>
                  {weatherCodeMap[result.weather.weathercode] || 'Unknown'} — <strong>{result.weather.temperature.toFixed(1)}°C</strong> / {(result.weather.temperature*9/5+32).toFixed(1)}°F
                </div>
                <div style={{color:'#94a3b8', fontSize:13}}>Wind: {result.weather.windspeed} m/s · As of: {result.weather.time}</div>
              </div>
            </div>
          )}
        </div>

        <footer style={{marginTop:14, color:'#94a3b8', fontSize:13}}>Data sources: open-meteo.com</footer>
      </div>
    </div>
  );
}
