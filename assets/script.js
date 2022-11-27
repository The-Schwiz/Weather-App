const API_KEY = "3e9e4f286b80c840562ab9d0c9a68873"

const cityHeaderEl = document.querySelector("#city-header");
const cityTempEl = document.querySelector("#city-temp");
const cityWindEl = document.querySelector("#city-wind");
const cityHumEl = document.querySelector("#city-humidity");
const cityWeatherIconEl = document.querySelector("#city-weather-icon");
const citySearchFormEl = document.querySelector("#city-search-form");
const userCityInput = document.querySelector("#searched-cities");
const previousSearchEl = document.getElementById("previous-search");

//empty array for search history 
let searchHistory = [];

//event listening for form submit
citySearchFormEl.addEventListener('submit', function(e){
    e.preventDefault();
    console.log(e.target[0].value);
    const inputValue = e.target[0].value;
    //validation for capitalizing city names 
    if (inputValue){
        const capitalizedName = capitlizeCityName(inputValue);
        searchCityWeather(capitalizedName);
    }
})

//creates buttons for every new search input 
function displaySearchHistory() {
    //clears previous search so repeat items don't append 
    previousSearchEl.innerHTML = "";
    for (i=0; i < searchHistory.length; i++){
        const btn = document.createElement('button');
        const buttonCityName = searchHistory[i];
        btn.setAttribute("data-search", buttonCityName);
        btn.textContent = buttonCityName;
        btn.addEventListener("click", function(e){                          
            //enables search using button click in search history 
            searchCityWeather(buttonCityName);
        });
        previousSearchEl.append(btn);
    }
}

function addCityToSearchHistory(cityName){
    if (searchHistory.indexOf(cityName) != -1) {
        return;
    } 
    searchHistory.push(cityName);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));

    displaySearchHistory();
}

//if old searches contains data, let oldSearches = searchHistory
function loadSearchHistory() {
    oldSearches = JSON.parse(localStorage.getItem("searchHistory"));
    if (oldSearches != null){
        searchHistory = oldSearches;
    }
    displaySearchHistory();
}

function searchCityWeather(cityName){
    addCityToSearchHistory(cityName);
    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`)
        .then(function (response) {
            return response.json()
        })
        .then(function (data) {
            console.log(data);
            const lat = data[0].lat
            const lon = data[0].lon

            displayCityWeather(lat, lon, cityName);
            displayFiveDayForecast(lat, lon);
        });
        
}

//displays today's weather in top city weather card 
function displayCityWeather(lat, lon, cityName){
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
          console.log(data);
          console.log(data.weather[0].icon);

          const cityTemp = data.main.temp;
          const cityHum = data.main.humidity;
          const cityWind = data.wind.speed;
          const cityHeader = `${cityName} (${dayjs().format("MM/DD/YYYY")})`;
          const cityWeatherIcon = data.weather[0].icon;
          
          cityWeatherIconEl.setAttribute('src', `http://openweathermap.org/img/w/${cityWeatherIcon}.png`)
          cityHeaderEl.textContent = cityHeader;
          cityTempEl.textContent = cityTemp;
          cityWindEl.textContent = cityWind;
          cityHumEl.textContent = cityHum;
      });
}

//displys forecast for next five days
function displayFiveDayForecast(lat, lon){
    fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`) 
      .then(function (response) {
        return response.json()
      })
      .then(function (data) {
        console.log(data);
        console.log (data.list[0].weather[0].icon);

        const fiveDayDataPoints = data.list; 
        const fiveDaySum = {};
        //uses date as key in object array and sums data/day so we can average it out for each day
        for (let dataPoint of fiveDayDataPoints) {
            const dateLabel = dataPoint.dt_txt.slice(0, 10);
            console.log(dateLabel);
            if (dateLabel in fiveDaySum) {
                fiveDaySum[dateLabel].dataPointsCount += 1;
                fiveDaySum[dateLabel].tempSum += dataPoint.main.temp;
                fiveDaySum[dateLabel].windSpeedSum += dataPoint.wind.speed;
                fiveDaySum[dateLabel].humiditySum += dataPoint.main.humidity;
                fiveDaySum[dateLabel].weatherIcons.push(dataPoint.weather[0].icon);
                console.log(dataPoint.weather[0].icon);
                
            } else {
                // date label key doesn't exist in the obj
                fiveDaySum[dateLabel] = {
                    dataPointsCount: 1,
                    tempSum: dataPoint.main.temp,
                    windSpeedSum: dataPoint.wind.speed,
                    humiditySum: dataPoint.main.humidity,
                    weatherIcons: [ dataPoint.weather[0].icon ] 
                }
            }
   
         // get average data for each forcasted day
        const forecastDaysAverages = [];

        //avergaes out data in each day to display single weather stat for each data point
        let dayCount = 0;
        for (let dateLabel in fiveDaySum) {
            if (dateLabel === dayjs().format("YYYY-MM-DD")) {
                continue;
            }
            dayCount++;
            if (dayCount > 5){ //controls for edge cases where data contains 6 days 
                break;
            }
            const averageTemp = fiveDaySum[dateLabel].tempSum / fiveDaySum[dateLabel].dataPointsCount;
            const averageWind = fiveDaySum[dateLabel].windSpeedSum / fiveDaySum[dateLabel].dataPointsCount;
            const averageHumidity = fiveDaySum[dateLabel].humiditySum / fiveDaySum[dateLabel].dataPointsCount;
            const dayIcons = fiveDaySum[dateLabel].weatherIcons;
            
            const averageData = {
                date: dateLabel,
                averageTemp: averageTemp,
                averageWind: averageWind,
                averageHumidity: averageHumidity,
                weatherIcons: dayIcons
            };

            forecastDaysAverages.push(averageData);
        }

        // display average data of each forecasted day to the dom
        for (let i=0; i < forecastDaysAverages.length; i++) {
            const dayData = forecastDaysAverages[i]
            const dayCardEl = document.querySelector(`#day${i+1}`)
            dayCardEl.querySelector("h3").textContent = dayData.date;
            dayCardEl.querySelector(".temp  > span").textContent = dayData.averageTemp.toFixed(1);
            dayCardEl.querySelector(".wind > span").textContent = dayData.averageWind.toFixed(1);
            dayCardEl.querySelector(".humidity > span").textContent = dayData.averageHumidity.toFixed(1);
            const weatherIcons = dayData.weatherIcons;
             // pick the most frequent weather Icon for the given day
            const mostFreqIcon = getMostFrequentWeatherIcon(weatherIcons)

            dayCardEl.querySelector("img").setAttribute("src", `http://openweathermap.org/img/w/${mostFreqIcon}.png`);
         
        }
    }});   
}

//capitalizes searched city names 
function capitlizeCityName(cityName) {
    const cityWords = cityName.split(' ');
    const cityWordsCapitalized = [];
    for (let word of cityWords){
        const capitalizedWord = word[0].toUpperCase() + word.slice(1);
        cityWordsCapitalized.push(capitalizedWord);
    }
    const cityNameCapitalized = cityWordsCapitalized.join(' ');
    return cityNameCapitalized;
}

//gets most frequent weather icon for each day
function getMostFrequentWeatherIcon(icons) {
    
    const iconCounts = {}
    for (let icon of icons){
        if (icon in iconCounts) {
            iconCounts[icon] += 1;
        } else {
           iconCounts[icon] = 1; 
        }
    } 
    // scan each key value pair of iconCounts
    // keep track which has the max frequency
    let mostFreqIcon = '';
    let maxIconCount = 0;
    for (let icon in iconCounts){
        const count = iconCounts[icon];
        if (count > maxIconCount) {
            mostFreqIcon = icon; 
            maxIconCount = count;
        }
    }
    return mostFreqIcon;
}


loadSearchHistory();