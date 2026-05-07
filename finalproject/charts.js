//last fm stuff
const API_KEY = '2514bda2ce34d50e4540eefea27cb475'; //last fm api key
const LIMIT = 50; //can change at will, 50 is nice because it takes a bit of time to load, but more statistical data than 12 or 10
const URL = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&limit=${LIMIT}&format=json`;

let allArtists = []; // Global variable to store artists

async function fetchArtistCharts() {
    const artists = document.getElementById('artists');
    const dropdown = document.getElementById('dropdown'); 

    try {
        const response = await fetch(URL); //fetches the data from the api
        const data = await response.json(); //gets the data from the api and makes sure it is json format
        const rawArtists = data.artists.artist; //puts the artists from the api into a variable to be used later
        const spotifyToken = await getSpotifyToken(); //awaits the spotify token in order to get images for each artist (last.fm doesnt give images of each artist)
        //uses a promise to wait for all of the artists to be fetched with their images.
        //.map function creates a new array of artist on every element of the raw data we received. 
        //the function will return a promise for each item instead of returning the artist data immediately
        allArtists = await Promise.all(rawArtists.map(async (artist, index) => { 
            let imageUrl = await getArtistPFP(artist.name, spotifyToken); //gets the image url for each of the artist using spotify's api
            // try {
            //     old method of finding the artist pfp, this uses last.fm's api, but it would return an image of a star almost everytime
            //     const infoRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`);
            //     const infoData = await infoRes.json();
            // } catch (e) { 
            //     console.error("Image fetch failed", artist.name); 
            // }
            //returns the sorted data for each artist.
            return {
                ...artist,
                playcount: Number(artist.playcount),
                image_url: imageUrl,
                chartRank: index + 1
            };
        }));
        // for (const [index, artist] of rawArtists.entries()) {
        //     let imageUrl = await getArtistPFP(artist.name, spotifyToken); //gets the image url for each of the artist using spotify's api
        //     allArtists.push({
        //         ...artist,
        //         playcount: parseInt(artist.playcount),
        //         image_url: imageUrl,
        //         chartRank: index + 1
        //     })
        // }
        //use a separate function to render the artists, as we will constantly be updating the html later for the dropdown menu
        renderArtists(allArtists); 
    } catch (error) {
        artists.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderArtists(artistList) {
    const artists = document.getElementById('artists'); 
    artists.innerHTML = ''; //clear the current div as we will update it

    artistList.forEach((artist, index) => { 
        //creates a personalized url for each artist which will send parameters to the artist.html page to use parameters to make further calls about that artist's albums and statistics 
        const artistUrl = `artist.html?name=${encodeURIComponent(artist.name)}&rank=${artist.chartRank}&plays=${artist.playcount}&img=${encodeURIComponent(artist.image_url)}`;
        //update the html for each artist card, animation is added to make it look smoother when the document is updated from the dropdown menu
        const artistCard = `
            <div class="col-md-4 col-lg-3 card-animate" style="animation-delay: ${index * 0.05}s">
            <a href="${artistUrl}" class="text-decoration-none text-dark">
                <div class="card h-100 shadow-sm d-flex flex-column align-items-center">
                    <div class="artistChartRank">#${artist.chartRank}</div>
                    
                    <img src="${artist.image_url}" class="artistPFP" alt="${artist.name}" style="object-fit: cover; height: 200px;">
                    
                    <div class="artist text-center">
                        <a href="${artist.url}" class="text-decoration-none text-dark">
                            <h6 class="artistName text-truncate fw-bold">${artist.name}</h6>
                        </a>
                        <p class="playcount text-muted small">${artist.playcount.toLocaleString()} plays</p>
                        
                    </div>
                </div>
                </a>
            </div>
        `;
        artists.innerHTML += artistCard;
    });
}
function dropdown(){
    //finds the value of the drop down menu from the html document
    const value = document.getElementById('dropdown').value; 
    //simple debugging statement
    // console.log("Dropdown changed:", value);
    if (value === "high-low") { //check the value of the dropdown menu; a switch statement probably should of been used here
        //create a copy sorts the array then renders
        const sorted = [...allArtists].sort((a, b) => b.playcount - a.playcount); //sort the data based on the value of the dropdown menu
        renderArtists(sorted); //render the artist based on the sorted data
    } else if(value === "low-high") {
        
        const sorted = [...allArtists].sort((a, b) => a.playcount - b.playcount);
        renderArtists(sorted);
    } else if(value === "chart-number") {
        
        renderArtists(allArtists);
    }else if(value === "alphabetical") {
        const sorted = [...allArtists].sort((a, b) => a.name.localeCompare(b.name));
        renderArtists(sorted);
    }

}
//spotify stuff
const clientID = "6c119d659723461ea03ee2c8e4957245";
const clientSecret = "30960defecc1434f990af27a548128b0";
async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', { //api call to spoitfy
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientID + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json(); //makes sure the response is in json
    return data.access_token; //returns the access token from spotify
}

async function getArtistPFP(artistName, token) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: { 'Authorization': 'Bearer ' + token }
    }); //takes the artist's name and spotify token to make a call to spotify's api in order to grab the image of that artist
    const data = await response.json(); //makes sure the response is in json
    //returns the image url of the artist or if there is no image, use an image of a cat from cataas
    return data.artists.items[0]?.images[0]?.url || "https://cataas.com/cat";
}

fetchArtistCharts(); //initial call to fetch from the api's and render the data