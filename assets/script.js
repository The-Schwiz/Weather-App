const API_KEY = "3e9e4f286b80c840562ab9d0c9a68873"

const cityHeaderEl = document.querySelector("#city-header");
const cityTempEl = document.querySelector("#city-temp");
const cityWindEl = document.querySelector("#city-wind");
const cityHumEl = document.querySelector("#city-humidity");

const citySearchFormEl = document.querySelector("#city-search-form");
const userCityInput = document.querySelector("#searched-cities");
const previousSearchEl = document.getElementById("previous-search");

let searchHistory = [];
// const storedCityName = JSON.parse(localStorage.getItem ("cityName")) || [];

// getSearchHistory();

citySearchFormEl.addEventListener('submit', function(e){
    e.preventDefault();
    console.log(e.target[0].value);
    const inputValue = e.target[0].value;
    if (inputValue){
        const capitalizedName = capitlizeCityName(inputValue);
        searchCityWeather(capitalizedName);
    }
})

function displaySearchHistory() {
    console.log ("im inside display search history");
    previousSearchEl.innerHTML = "";
    for (i=0; i < searchHistory.length; i++){
        const btn = document.createElement('button');
        const buttonCityName = searchHistory[i];
        btn.setAttribute("data-search", buttonCityName);
        btn.textContent = buttonCityName;
        btn.addEventListener("click", function(e){                          
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

function loadSearchHistory() {
    oldSearches = JSON.parse(localStorage.getItem("searchHistory"));
    if (oldSearches != null){
        searchHistory = oldSearches;
    }
    displaySearchHistory();
}


//new way of fetching
// async function getMealData() {
//     const response = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php");
//     const data = await response.json();
//     console.log(data);
//     const rightCol = document.querySelector(".right-col");
//     // rightCol.innerHTML += JSON.stringify(data);
//     rightCol.innerHTML += data.categories[0].strCategory;
// }

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

function displayCityWeather(lat, lon, cityName){
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
          console.log(data);

          // get today's date 
          // Get city name 
      
          //get temp
          const cityTemp = data.main.temp;
          //get hum. 
          const cityHum = data.main.humidity;
          // object deconstruction: 
          // const { temp, humidity } = data.main;
          //get wind
          const cityWind = data.wind.speed;
          const cityHeader = `${cityName} (${dayjs().format("MM/DD/YYYY")})`;
          cityHeaderEl.textContent = cityHeader;
          cityTempEl.textContent = cityTemp;
          cityWindEl.textContent = cityWind;
          cityHumEl.textContent = cityHum;
          
      });
}

// const cityHeaderEl = document.querySelector("#city-header");
// const cityTempEl = document.querySelector("#city-temp");
// const cityWindEl = document.querySelector("#city-wind");
// const cityHumEl = document.querySelector("#city-humidity");

function displayFiveDayForecast(lat, lon){
    fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`) 
      .then(function (response) {
        return response.json()
      })
      .then(function (data) {
        console.log(data);

        const fiveDayDataPoints = data.list; 
        const fiveDaySum = {};
        for (let dataPoint of fiveDayDataPoints) {
            const dateLabel = dataPoint.dt_txt.slice(0, 10);
            console.log(dateLabel);
            // date label key exists in the obj
            if (dateLabel in fiveDaySum) {
                fiveDaySum[dateLabel].dataPointsCount += 1;
                fiveDaySum[dateLabel].tempSum += dataPoint.main.temp;
                fiveDaySum[dateLabel].windSpeedSum += dataPoint.wind.speed;
                fiveDaySum[dateLabel].humiditySum += dataPoint.main.humidity;
                
            } else {
                // date label key doesn't exist in the obj
                fiveDaySum[dateLabel] = {
                    dataPointsCount: 1,
                    tempSum: dataPoint.main.temp,
                    windSpeedSum: dataPoint.wind.speed,
                    humiditySum: dataPoint.main.humidity,
                    icon: dataPoint.icon,
                }
                console.log(icon)
                
            }
            
        }
        console.log(fiveDaySum);
        // const fiveDaySum = {
        //     '2022-11-21' : {
        //         dataPointsCount: 8,
        //         tempSum: 100,
        //         windSpeedSum: 232,
        //         humiditySum: 123,
        //     },
        //     '2022-11-22' : {
        //         dataPointsCount: 8,
        //         tempSum: 100,
        //         windSpeedSum: 232,
        //         humiditySum: 123,
        //     },
        //     '2022-11-23' : {
        //         dataPointsCount: 8,
        //         tempSum: 100,
        //         windSpeedSum: 232,
        //         humiditySum: 123,
        //     },
        //     '2022-11-24' : {
        //         dataPointsCount: 8,
        //         tempSum: 100,
        //         windSpeedSum: 232,
        //         humiditySum: 123,
        //     },
        //     '2022-11-25' : {
        //         dataPointsCount: 6,
        //         tempSum: 100,
        //         windSpeedSum: 232,
        //         humiditySum: 123,
        //     },
        // }        
        

        // get average data for each forcasted day
        const forecastDaysAverages = [];

        //  [ { date: '2022-11-20', averageTemp: 1212, averageHumidty: 324, averageWind: 123 }  ]
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
            
            const averageData = {
                date: dateLabel,
                averageTemp: averageTemp,
                averageWind: averageWind,
                averageHumidity: averageHumidity
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
            //round units in lines above
            //add icons 
            // Requirement: save cities to local storage and get on load.
            // hide cards in right col initially
            // when data is fetching, show loading text / image
        }
    });   
}


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



loadSearchHistory();