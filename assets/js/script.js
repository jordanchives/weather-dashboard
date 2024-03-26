const weatherUrl = 'http://api.openweathermap.org';
const apiKey = localStorage.getItem('weatherAPI') || prompt("Enter your weather API key");
localStorage.setItem('weatherAPI', apiKey);

$(document).ready(function () {
    const searchForm = $('#searchForm');
    const searchInput = $('#searchText');
    const today = $('#today');
    const history = $('#history');
    const daysContainer = $('#days');
    const fiveDayContainer = $('#fiveDay');



    searchForm.submit(function (event) {
        event.preventDefault(); // Prevent default form submission behavior

        const city = searchInput.val().trim(); // Get the entered city from the input field

        if (city !== '') {
            // Call getCoords function to fetch coordinates for the entered city
            getCoords(city)
                .then(coords => {
                    if (coords) {
                        // If coordinates are available, call getFiveDay function to fetch five-day forecast
                        return getFiveDay(coords);
                    } else {
                        // If coordinates are not available, handle the error
                        throw new Error('Coordinates not found for the entered city');
                    }
                })
                .then(forecast => {
                    if (forecast) {
                        // If forecast data is available, update the UI or do further processing
                        updateToday(city, forecast[0].weather, forecast[0].temp, forecast[0].wind, forecast[0].humidity, forecast[0].date);
                        updateFiveDay(forecast.slice(1));
                        console.log('Forecast:', forecast);
                    } else {
                        // If forecast data is not available, handle the error
                        throw new Error('Forecast data not available');
                    }
                })
                .catch(error => {
                    // Handle any errors that occur during the process
                    console.error('Error:', error);
                });
        } else {
            // If the input field is empty, display an error message or take appropriate action
            console.error('Please enter a city name');
        }
    });

    function updateToday(city, weather, temp, wind, humidity, date) {
        const formattedDate = dayjs.unix(date).format('(M/D/YYYY)');
        today.html(`
            <h2>${city} ${formattedDate}</h2>
            <p>Weather: ${weather}</p>
            <p>Temperature: ${temp}°F</p>
            <p>Wind: ${wind} mph</p>
            <p>Humidity: ${humidity}%</p>
        `);
    }
    
    function updateFiveDay(fiveDay) {
        daysContainer.empty();
        for (const day of fiveDay) {
            const date = dayjs.unix(day.date).format('M/D/YYYY');
            const weather = day.weather;
            const temp = day.temp;
            const wind = day.wind;
            const humidity = day.humidity;
    
            const card = $(`
                <div class="col card m-1">
                    <div class="card-body">
                        <h5 class="card-title">${date}</h5>
                        <p class="card-text">Weather: ${weather}</p>
                        <p class="card-text">Temperature: ${temp}°F</p>
                        <p class="card-text">Wind: ${wind} mph</p>
                        <p class="card-text">Humidity: ${humidity}%</p>
                    </div>
                </div>
            `);

            daysContainer.append(card);
        }
    }
});



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
