const weatherUrl = 'http://api.openweathermap.org';
const apiKey = '';
localStorage.setItem('weatherAPI', apiKey);

$(document).ready(function () {
    const searchForm = $('#searchForm');
    const searchInput = $('#searchText');
    const today = $('#today');
    const history = $('#history');
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
            console.log(null);
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
    
    try {
        const response = await fetch(url); // Wait for the fetch request to complete
        const data = await response.json(); // Wait for the JSON parsing to complete
        console.log('Five-day forecast response:', data);

        if (!data) {
            return null;
        } else {
            const fiveDay = [];
            for (const day of data.list) {
                const dayObj = {
                    date: day.dt,
                    weather: day.weather[0].main,
                    temp: day.main.temp,
                    wind: day.wind.speed,
                    humidity: day.main.humidity
                };
                fiveDay.push(dayObj);
            }
            console.log('Five-day forecast:', fiveDay);
            return fiveDay;
        }
    } catch (error) {
        console.error('Error getting five-day forecast:', error);
        throw error; // Propagate the error to the caller
    }
}
