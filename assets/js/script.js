const weatherUrl = 'http://api.openweathermap.org';
const apiKey = localStorage.getItem('weatherAPI') || prompt("Enter your weather API key");
localStorage.setItem('weatherAPI', apiKey);

$(document).ready(function () {
    const searchForm = $('#searchForm');
    const searchInput = $('#searchText');
    const today = $('#today');
    const historyContainer = $('#history');
    const daysContainer = $('#days');
    const fiveDayContainer = $('#fiveDay');
    const forecastText = $('#forecastText');



    searchForm.submit(function (event) {
        event.preventDefault();

        const city = searchInput.val().trim();

        daysContainer.empty();
        today.empty();
        forecastText.css('visibility', 'hidden');

        if (city !== '') {
            today.css('visibility', 'visible');
            getCoords(city)
                .then(coords => {
                    if (coords) {
                        return getFiveDay(coords);
                    } else {
                        throw new Error('Coordinates not found for the entered city');
                    }
                })
                .then(forecast => {
                    if (forecast) {
                        // If forecast data is available, update the UI or do further processing
                        updateToday(city, forecast[0].weather, forecast[0].temp, forecast[0].wind, forecast[0].humidity, forecast[0].date);
                        updateFiveDay(forecast.slice(1));
                        setHistory(city);
                        updateHistory();
                        console.log('Forecast:', forecast);
                    } else {
                        today.html(`<h3>No weather data available for ${city}</h3>`);
                        throw new Error('Forecast data not available');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    today.html(`<h3>No weather data available for ${city}</h3>`);
                });
        } else {
            console.error('Please enter a city name');
        }
    });

    function updateToday(city, weather, temp, wind, humidity, date) {
        const formattedDate = dayjs.unix(date).format('(M/D/YYYY)');
        const weatherIconUrl = getWeatherIconUrl(weather);
        today.html(`
            <header>
            <h2>${city} ${formattedDate}</h2>
            <img src="${weatherIconUrl}" alt="${weather}" />
            <p>Temperature: ${temp}°F</p>
            <p>Wind: ${wind} mph</p>
            <p>Humidity: ${humidity}%</p>
            </header>
        `);
    }

    function updateFiveDay(fiveDay) {
        forecastText.css('visibility', 'visible');
        for (const day of fiveDay) {
            const date = dayjs.unix(day.date).format('M/D/YYYY');
            const weatherIconUrl = getWeatherIconUrl(day.weather);

            const card = $(`
            <div class="col-lg card">
                <div class="card-body">
                    <h5 class="card-title">${date}</h5>
                    <img src="${weatherIconUrl}" alt="${day.weather}" />
                    <p class="card-text">Temperature: ${day.temp}°F</p>
                    <p class="card-text">Wind: ${day.wind} mph</p>
                    <p class="card-text">Humidity: ${day.humidity}%</p>
                </div>
            </div>
        `);

            daysContainer.append(card);
        }
    }

    function updateHistory() {
        historyContainer.empty();
        const history = JSON.parse(localStorage.getItem('history'));
        for (const city of history) {
            const item = $(`<button type="button" class="btn btn-secondary form-control">${city}</button>`);
            item.click(function () {
                searchInput.val(city);
                searchForm.submit();
            });
            historyContainer.append(item);
        }
    }

    if (localStorage.getItem('history')) {
        updateHistory();
    }
});

function setHistory(city) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem('history', JSON.stringify(history));
    }
}

async function getCoords(city) {
    console.log('Fetching coordinates for:', city);
    const url = new URL(weatherUrl + '/geo/1.0/direct');
    url.searchParams.append('q', city);
    url.searchParams.append('limit', 1)
    url.searchParams.append('appid', apiKey);

    try {
        const response = await fetch(url); // Wait for the fetch request to complete
        const data = await response.json(); // Wait for the JSON parsing to complete
        console.log('Coordinates response:', data);

        if (!data[0]) {
            return null;
        } else {
            const coords = { lat: data[0].lat, lon: data[0].lon };
            console.log('Coordinates:', coords);
            return coords;
        }
    } catch (error) {
        console.error('Error getting coordinates:', error);
        throw error; // Propagate the error to the caller
    }
}

async function getFiveDay(coords) {
    const url = new URL(weatherUrl + '/data/2.5/forecast');
    url.searchParams.append('lat', coords.lat);
    url.searchParams.append('lon', coords.lon);
    url.searchParams.append('appid', apiKey);
    url.searchParams.append('units', 'imperial');

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Five-day forecast response:', data);

        if (!data) {
            return null;
        } else {
            const forecast = [];
            const today = dayjs().startOf('day');

            for (let i = 0; i < 6; i++) {
                const nextDay = today.add(i, 'day');

                const dayForecast = data.list.find(day => {
                    const forecastDate = dayjs.unix(day.dt).startOf('day');
                    return forecastDate.isSame(nextDay);
                });

                if (dayForecast) {
                    const dayObj = {
                        date: dayForecast.dt,
                        weather: dayForecast.weather[0].main,
                        temp: dayForecast.main.temp,
                        wind: dayForecast.wind.speed,
                        humidity: dayForecast.main.humidity
                    };
                    forecast.push(dayObj);
                }
            }

            console.log('Five-day forecast:', forecast);
            return forecast;
        }
    } catch (error) {
        console.error('Error getting five-day forecast:', error);
        throw error;
    }
}

function getWeatherIconUrl(weather) {
    switch (weather.toLowerCase()) {
        case 'clear sky':
        case 'clear':
            return 'https://openweathermap.org/img/wn/01d@2x.png';
        case 'few clouds':
            return 'https://openweathermap.org/img/wn/02d@2x.png';
        case 'scattered clouds':
        case 'clouds':
            return 'https://openweathermap.org/img/wn/03d@2x.png';
        case 'broken clouds':
            return 'https://openweathermap.org/img/wn/04d@2x.png';
        case 'shower rain':
        case 'drizzle':
            return 'https://openweathermap.org/img/wn/09d@2x.png';
        case 'rain':
            return 'https://openweathermap.org/img/wn/10d@2x.png';
        case 'thunderstorm':
            return 'https://openweathermap.org/img/wn/11d@2x.png';
        case 'snow':
        case 'sleet':
            return 'https://openweathermap.org/img/wn/13d@2x.png';
        case 'mist':
        case 'fog':
        case 'haze':
        case 'smoke':
        case 'dust':
        case 'sand':
        case 'ash':
        case 'squall':
        case 'tornado':
            return 'https://openweathermap.org/img/wn/50d@2x.png';
        default:
            return '';
    }
}