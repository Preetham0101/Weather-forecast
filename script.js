/** FULL WORKING JAVASCRIPT CODE **/

const apiKey = "32a1bd73424e617c331c88a970df10ff"; // OpenWeatherMap API (free)
const weatherApiKey = "54c479c7192f49ee91980027250207"; // WeatherAPI for weather data

window.onload = () => {
  const savedTheme = localStorage.getItem("theme");
  const bg = document.getElementById("bgBlur");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    bg.style.filter = "blur(20px) brightness(0.4)";
  } else {
    bg.style.filter = "blur(20px) brightness(0.7)";
  }

  document.getElementById("savedCitiesWrapper").style.display = "block";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=7`;
      fetchWeather(url);
    });
  }

  loadSavedCities();
};

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  const bg = document.getElementById("bgBlur");
  bg.style.filter = isDark ? "blur(20px) brightness(0.4)" : "blur(20px) brightness(0.7)";
}

function toggleSavedCities() {
  const wrapper = document.getElementById("savedCitiesWrapper");
  wrapper.style.display = wrapper.style.display === "none" ? "block" : "none";
}

function getWeather(cityName = null) {
  const city = cityName || document.getElementById("cityInput").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(city)}&days=7`;
  fetchWeather(url, city);
}

async function fetchWeather(url, cityName = "") {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      const suggestions = await getCitySuggestions(cityName);

      if (suggestions.length > 0) {
        let output = `<p>City not found. Did you mean:</p>`;
        suggestions.forEach(s => {
          output += `<p><a href="#" onclick="getWeather('${s.name}')">${s.name}, ${s.state || ""}, ${s.country}</a></p>`;
        });
        document.getElementById("weatherResult").innerHTML = output;
      } else {
        document.getElementById("weatherResult").innerHTML = `<p>City not found. No similar cities available.</p>`;
      }
      return;
    }

    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday;
    const temp = current.temp_c;
    const condition = current.condition.text.toLowerCase();
    const isDay = current.is_day === 1;

    let backgroundImage = "assets/clear.jpg";
    if (!isDay) backgroundImage = "assets/night.jpg";
    else if (condition.includes("rain") || condition.includes("drizzle")) backgroundImage = "assets/rain.jpg";
    else if (condition.includes("snow") || condition.includes("sleet")) backgroundImage = "assets/snow.jpg";
    else if (temp >= 35) backgroundImage = "assets/hot.jpg";
    else if (temp >= 20) backgroundImage = "assets/warm.jpg";
    else backgroundImage = "assets/cold.jpg";

    const bg = document.getElementById("bgBlur");
    bg.style.backgroundImage = `url('${backgroundImage}')`;
    bg.style.filter = document.body.classList.contains("dark")
      ? "blur(20px) brightness(0.4)"
      : "blur(20px) brightness(0.7)";

    let output = `
      <h2>${location.name}, ${location.region}, ${location.country}</h2>
      <p><strong>Temp:</strong> ${current.temp_c}°C</p>
      <p><strong>Humidity:</strong> ${current.humidity}%</p>
      <p><strong>Wind:</strong> ${current.wind_kph} kph</p>
      <p><strong>Condition:</strong> ${current.condition.text}</p>
      <img src="https:${current.condition.icon}" alt="Weather icon" />
      <button onclick="saveCity('${location.name}')" class="save-btn">⭐ Save This City</button>
      <h3>📅 7-Day Forecast</h3>
      <div class="forecast-container">
    `;

    forecast.forEach(day => {
      output += `
        <div class="forecast-card">
          <p><strong>${day.date}</strong></p>
          <img src="https:${day.day.condition.icon}" />
          <p>${day.day.condition.text}</p>
          <p>🌡️ ${day.day.avgtemp_c}°C</p>
          <p>💧 ${day.day.daily_chance_of_rain}%</p>
        </div>
      `;
    });

    output += `</div><h3>🕒 Hourly Forecast (Today)</h3><div class="hourly-slider">`;

    data.forecast.forecastday[0].hour.forEach(hour => {
      output += `
        <div class="hour-card">
          <p><strong>${hour.time.split(" ")[1]}</strong></p>
          <img src="https:${hour.condition.icon}" />
          <p>${hour.temp_c}°C</p>
        </div>
      `;
    });

    output += `</div>`;
    document.getElementById("weatherResult").innerHTML = output;

  } catch (err) {
    console.error(err);
    document.getElementById("weatherResult").innerHTML = `<p>Could not fetch weather.</p>`;
  }
}

async function getCitySuggestions(cityName) {
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${apiKey}`;
  try {
    const res = await fetch(geoUrl);
    const results = await res.json();
    return results.length > 0 ? results : [];
  } catch (err) {
    console.error("Suggestion error:", err);
    return [];
  }
}

function saveCity(city) {
  let saved = JSON.parse(localStorage.getItem("savedCities")) || [];
  if (!saved.includes(city)) {
    saved.push(city);
    localStorage.setItem("savedCities", JSON.stringify(saved));
    loadSavedCities();
    alert(`${city} has been saved!`);
  } else {
    alert(`${city} is already saved.`);
  }
}

function loadSavedCities() {
  const saved = JSON.parse(localStorage.getItem("savedCities")) || [];
  const cityList = document.getElementById("cityList");
  cityList.innerHTML = "";

  saved.forEach((city, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "city-wrapper";

    const cityBtn = document.createElement("button");
    cityBtn.className = "city-button";
    cityBtn.textContent = city;
    cityBtn.onclick = () => getWeather(city);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.innerHTML = "❌";
    deleteBtn.onclick = () => deleteCity(index);

    wrapper.appendChild(cityBtn);
    wrapper.appendChild(deleteBtn);
    cityList.appendChild(wrapper);
  });
}

function deleteCity(index) {
  let saved = JSON.parse(localStorage.getItem("savedCities")) || [];
  saved.splice(index, 1);
  localStorage.setItem("savedCities", JSON.stringify(saved));
  loadSavedCities();
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}
