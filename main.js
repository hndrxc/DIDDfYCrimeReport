import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { OSM } from 'ol/source.js';
import TileLayer from 'ol/layer/Tile.js';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style.js';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import { MousePosition } from 'ol/control';
import { createStringXY } from 'ol/coordinate';
import { db, collection, addDoc, getDocs } from './firebaseConfig.js'; // Import Firebase Firestore

// Initial view and map setup
const view = new View({
  center: fromLonLat([-91.1871, 30.4515]), // Center on Baton Rouge by default
  zoom: 12,
  minZoom: 0,
  maxZoom: 18,
  zoomDuration: 0, // Disable double-click zoom by setting zoom duration to 0
});

const map = new Map({
  target: 'js-map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: view,
});

// Add mouse position control
const mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  className: 'mouse-position',
  target: document.getElementById('mouse-position'),
});
map.addControl(mousePositionControl);

// Set up vector source and layer for displaying circles
const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({ source: vectorSource });
map.addLayer(vectorLayer);

// Function to create and add a circle feature on the map and save to Firebase
async function addCircleFeature(coordinates, description) {
  const circleFeature = new Feature({
    geometry: new Point(coordinates),
  });

  circleFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: 'rgba(245, 40, 145, 0.8)' }),
        stroke: new Stroke({ color: 'blue', width: 2 }),
      }),
    })
  );

  vectorSource.addFeature(circleFeature);

  try {
    await addDoc(collection(db, "waypoints"), {
      description: description,
      coordinates: {
        latitude: toLonLat(coordinates)[1],  // Extract latitude
        longitude: toLonLat(coordinates)[0], // Extract longitude
      },
      timestamp: new Date(), // Save current timestamp
    });
    console.log("Waypoint added to Firebase:", description);
  } catch (e) {
    console.error("Error adding waypoint to Firebase:", e);
  }
}

// Double-click event to create a waypoint
map.on('dblclick', async function (event) {
  event.preventDefault();
  const coordinates = event.coordinate;
  
  const description = prompt("Enter a description for this waypoint:");
  if (description) {
    addCircleFeature(coordinates, description);
  }
});

// Load waypoints from Firebase on map load
async function loadWaypoints() {
  const querySnapshot = await getDocs(collection(db, "waypoints"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const coordinates = fromLonLat(data.coordinates);
    const description = data.description;

    const circleFeature = new Feature({
      geometry: new Point(coordinates),
    });

    circleFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'rgba(0, 128, 255, 0.5)' }),
          stroke: new Stroke({ color: 'blue', width: 2 }),
        }),
      })
    );

    vectorSource.addFeature(circleFeature);
    console.log(`Loaded waypoint: ${description}`);
  });
}
loadWaypoints(); // Load existing waypoints on map load

// Center map and canvas functionality
window.handleClick = function () {
  const lon = parseFloat(document.getElementById("lon").value);
  const lat = parseFloat(document.getElementById("lat").value);

  if (!isNaN(lon) && !isNaN(lat)) {
    const coordinates = fromLonLat([lon, lat]);
    view.animate({
      center: coordinates,
      duration: 1000,
    });
  } else {
    console.log("Invalid coordinates");
  }
};

// Populate coordinates based on dropdown selection
window.fillInput = function () {
  const dropdown = document.getElementById("cities");
  const selectedCity = dropdown.value;
  const lon = document.getElementById("lon");
  const lat = document.getElementById("lat");

  if (selectedCity == "Atyrau") {
    lon.value = 51.9238;
    lat.value = 47.0945;
  }
  else if (selectedCity == "BatonRouge") {
    lon.value = -91.1871;
    lat.value = 30.4515;
  }
  else if (selectedCity == "Berlin") {
    lon.value = 13.405;
    lat.value = 52.52;
  }
  else if (selectedCity == "Lagos") {
    lon.value = 3.3792;
    lat.value = 6.5244;
  }
  else if (selectedCity == "London") {
    lon.value = -0.1276;
    lat.value = 51.5072;
  }
  else if (selectedCity == "Yokohama") {
    lon.value = 139.6380;
    lat.value = 35.4437;
  }
  else if (selectedCity == "Venice") {
    lon.value = 12.316;
    lat.value = 45.4404
  }
};

