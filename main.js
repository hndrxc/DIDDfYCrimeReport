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
import Overlay from 'ol/Overlay.js';
import { db, collection, getDocs, getDoc, setDoc,doc } from './firebaseConfig.js'; // Import Firebase Firestore

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

function generateWaypointID(latitude, longitude) {
  return `${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
}

// Function to create and add a circle feature on the map and save to Firebase
async function addCircleFeature(coordinates, description, category) {
  const circleFeature = new Feature({
    geometry: new Point(coordinates),
    description: description,
  });
  const color = category === 'Theft' ? 'red' :
                category === 'Vandalism' ? 'orange' :
                category === 'Assault' ? 'purple' :
                category === 'Accident/HitandRun' ? 'darkblue' :
                category === 'Transaction Scammed' ? 'green' :
                'black';
  circleFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: 'black', width: 2 }),
      }),
    })
  );

  vectorSource.addFeature(circleFeature);

}
// Double-click event to create a waypoint
map.on('dblclick', async function (event) {
  event.preventDefault();
  const coordinates = event.coordinate;
  document.getElementById('waypoint-form').style.display = 'block';

  window.currentCoordinates = coordinates
});

// Load waypoints from Firebase on map load
async function loadWaypoints() {
  const querySnapshot = await getDocs(collection(db, "waypoints"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const coordinates = fromLonLat([data.coordinates.longitude, data.coordinates.latitude]);
    const description = data.description;
    const category = data.category; 

    addCircleFeature(coordinates, description, category);
    console.log(`Loaded waypoint: ${description}`);
  });
}
loadWaypoints(); // Load existing waypoints on map load

// SavesWaypoint Function
window.saveWaypoint = async function () {
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  const coordinates = window.currentCoordinates;

  if (!description || !category || !coordinates) {
    alert("Please enter all information.");
    return;
  }
  const latitude = toLonLat(coordinates)[1];
  const longitude = toLonLat(coordinates)[0];
  const waypointID = generateWaypointID(latitude, longitude);
  // Create and save the waypoint
  try {
    // Check if waypoint with the same ID already exists
    const waypointRef = doc(db, "waypoints", waypointID);
    const waypointSnap = await getDoc(waypointRef);

    if (waypointSnap.exists()){
      console.log("Waypoint already exists in Firebase:", description);
    }else{
      // Save waypoint to Firebase
      await setDoc(waypointRef, {
        description: description,
        category: category,
        coordinates: { latitude, longitude },
        timestamp: new Date(),
      });
      console.log("Waypoint added to Firebase:", description);

      // Add waypoint to the map visually
      addCircleFeature(coordinates, description, category);
    }
    document.getElementById('waypoint-form').style.display = 'none';
    document.getElementById('description').value = '';
    document.getElementById('category').value = 'Theft';
  } catch (e) {
    console.error("Error adding waypoint to Firebase:", e);
  }
}
// Center map and canvas functionality
window.handleClick = function () {
  const lon = parseFloat(document.getElementById("lon").value);
  const lat = parseFloat(document.getElementById("lat").value);

  if (!isNaN(lon) && !isNaN(lat)) {
    view.animate(
      { center: fromLonLat([lon, lat]), duration: 1000 },
      { zoom: 12, duration: 500 }
    );
  } else {
    console.log("Invalid coordinates");
  }
};
const popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'bottom-center',
  stopEvent: false,
});
map.addOverlay(popup);

// Display description on waypoint click
map.on('click', function (event) {
  // Hide popup initially
  popup.setPosition(undefined);

  map.forEachFeatureAtPixel(event.pixel, function (feature) {
    const description = feature.get('description'); // Get the description property
    if (description) {
      const coordinates = feature.getGeometry().getCoordinates();
      popup.setPosition(coordinates);
      document.getElementById('popup-content').innerHTML = description; // Set popup content
    }
  });
});
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

