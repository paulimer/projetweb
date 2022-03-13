let carte = null;
let lat = [];
let lon = [];
let height = [];

const avg = arr => arr.reduce((acc, v, i, a) => (acc + v / a.length), 0);

// generate time serie
const getDatesBetween = (start, end, n) => {
    const step = Math.ceil((end.getTime() - start.getTime()) / n)
    let dates = [];
    let current = start;
    for (i = 0; i < n; i++) {
        dates.push(new Date(current));
        current.setTime(current.getTime() + step);
    }
    return dates;
};

// Fonction d'initialisation de la carte
function initMap() {
    // Créer l'objet "carte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    carte = L.map('map').setView([avg(lat), avg(lon)], 7);
    // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        // Il est toujours bien de laisser le lien vers la source des données
        attribution: 'données © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> - rendu <a href="https://www.openstreetmap.fr">OSM France</a>',
        minZoom: 2,
        maxZoom: 15
    }).addTo(carte);
}

function forEachFeature(feature, layer) {
    if (layer instanceof L.Marker) {
        const name = feature.properties.name;
        const popupContent = "<p> <b>Nom: </b>" + name + "</p>";
        layer.bindPopup(popupContent);
    } else if (layer instanceof L.Path) {
        let coords = feature.geometry.coordinates;  //gets feature coords
        for (let i = 0; i < coords.length; i++) { //loop thru coords to get Z's
            lon.push(coords[i][0]);
            lat.push(coords[i][1]);
            height.push(coords[i][2]);
        }
    }
}

window.onload = function () {
    const geojson = JSON.parse(trace);
    // On dessine le polygone
    let geojsonLayer = L.geoJSON(geojson, {
        onEachFeature: forEachFeature,
        style: {
            "color": "#839c49",
            "opacity": 1,
            "weight": 5,
            "fillColor": "#839c49",
            "fillOpacity": 0.5
        }
    });

    initMap();

    // On ajoute à la carte
    geojsonLayer.addTo(carte);

    let myPlot = document.getElementById("plot");

    let data = [{
        x: getDatesBetween(startDate, endDate, height.length),
        y: height,
        type: 'scatter',
        mode: 'line'
    }];

    let layout = {
        hovermode: 'closest',
        xaxis: { type: 'date', title: "Date" },
        yaxis: { title: "Altitude (en mètres)" }
    };

    let config = { responsive: true };

    // Display with Plotly
    Plotly.newPlot("plot", data, layout, config);

    myPlot.on("plotly_click", function (data) {
        const pn = data.points[0].pointNumber;
        const pLat = lat[pn];
        const pLon = lon[pn];

        let redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        let marker = new L.Marker([pLat, pLon], { icon: redIcon, draggable: false }).addTo(carte);

        marker.on({
            mousedown: function () {
                carte.on('mousemove', function (e) {
                    carte.dragging.disable();
                    var point = geojsonLayer.closestLayerPoint(carte.latLngToLayerPoint(e.latlng))
                    marker.setLatLng(carte.layerPointToLatLng(point));
                });
            }
        });
        carte.on('mouseup', function (e) {
            carte.removeEventListener('mousemove');
            carte.dragging.enable();
        });
    });
};

