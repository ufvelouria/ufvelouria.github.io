const API_KEY = '2514bda2ce34d50e4540eefea27cb475';
const params = new URLSearchParams(window.location.search); // get parameters from URL
const name = params.get('name');
const img = params.get('img');
const chartRank = params.get('rank');
const playcount = params.get('plays');
// set initial data from URL
function init(){ 
    if (!name){
        return;
    }
    document.getElementById('artist-name').innerText = name; //uses parameters passed through the url to set the info of the artist
    document.getElementById('artist-img').src = img;
    document.getElementById('chart-rank').innerText = `Chart Rank #${chartRank}`;
    document.getElementById('play-count').innerText = `${parseInt(playcount).toLocaleString()} total plays`;
}
let allAlbums = [];

async function fetchAlbums() {
    const albums = document.getElementById('albums');
    const dropdown = document.getElementById('dropdown');

    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&format=json`;
        
        const res = await fetch(url); //response from the api
        const data = await res.json(); //parse the response as json
        const rawAlbums = data.topalbums.album; //raw data fetched from the api

        allAlbums = await Promise.all(rawAlbums.map(async (album) => {
            // attempt to get the release date for each album, but its inaccurate due to last.fm using wiki publish dates and not having a release date in the api.
            // let releaseDate = 0; 
            // try {
            //     const infoUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${API_KEY}&artist=${encodeURIComponent(name)}&album=${encodeURIComponent(album.name)}&format=json`;
                
            //     console.log(infoUrl);
            //     const infoRes = await fetch(infoUrl); 
            //     const infoData = await infoRes.json();
                
            //     if (infoData.album.wiki.published) { //release data is based off whenever the wiki was published, so it will be innacurate for the most part
            //         releaseDate = Date.parse(infoData.album.wiki.published.trim());
            //     }
            // } catch (e) { console.warn("Date fetch failed for", album.name); }

            return {
                ...album,
                playcount: Number(album.playcount),
                // releaseTimestamp: releaseDate || 0,
                // displayDate: releaseDate ? new Date(releaseDate).getFullYear() : "N/A"
            };
        }));

        renderAlbums(allAlbums); //initial render sorted by playcount


    } catch (error) {
        albums.innerHTML = `<p class="text-danger">Error loading data.</p>`;
    }
}
function dropdown(){
    
    let sorted = [...allAlbums];
    const sortType = document.getElementById('dropdown').value;
    console.log("Dropdown changed:", sortType);
    if (sortType === "recent") {
        sorted.sort((a, b) => b.releaseTimestamp - a.releaseTimestamp);
    } else if (sortType === "mostPlayed"){
        sorted.sort((a, b) => b.playcount - a.playcount);
    } else if (sortType === "leastPlayed"){
        sorted.sort((a, b) => a.playcount - b.playcount);
    }else if(sortType === "alphabetical") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    renderAlbums(sorted);
}
function renderAlbums(list) { //use a separate function for rendering since we constantly update when filtering.
    const albums = document.getElementById('albums');
    //clears the current html so we can update it with the sorted data
    albums.innerHTML = '';
    //creates a card for each album using animations.
    list.forEach((album, index) => {
        const albumImg = album.image[3]['#text'] || 'https://cataas.com/cat';
        albums.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3 card-animate" style="animation-delay: ${index * 0.05}s">
                <div class="card h-100 border-0 bg-transparent album-card">
                    <a href="${album.url}" target="_blank" rel="noopener noreferrer">
                        <img src="${albumImg}" class="card-img-top rounded shadow-sm" alt="${album.name}">
                    </a>
                    <div class="card-body px-0">
                        <h6 class="fw-bold mb-0 text-truncate">${album.name}</h6>
                        <p class="small text-muted mb-0">${album.playcount.toLocaleString()} plays</p>
                        <!-- <p class="small text-primary">${album.displayDate}</p> -->
                    </div>
                </div>
            </div>
        `;
    });
}
// addEventListener('DOMContentLoaded', () => {
//     init();
//     fetchAlbums();
// });
init();
fetchAlbums();