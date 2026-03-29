// 🌍 INIT MAP (EARTH VIEW)
var map = L.map('map', {
    zoomControl:false,
    attributionControl:false,
    scrollWheelZoom:false,
    dragging:false
}).setView([20, 0], 2);

// 🌍 SATELLITE (NO LABELS)
let worldLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 8 }
).addTo(map);

let geoLayer;
let selectedState = "";
let selectedLayer = null;
let currentData = null;
let globe;
let introCompleted = false;
let introTimers = [];

// 🔥 START WITH 3D GLOBE TO INDIA ANIMATION
start3DIntro();

function addIntroTimeout(fn, ms){
    const id = setTimeout(fn, ms);
    introTimers.push(id);
    return id;
}

function clearIntroTimeouts(){
    introTimers.forEach(clearTimeout);
    introTimers = [];
}

function goToIndiaFromGlobe(){
    if(introCompleted) return;
    introCompleted = true;
    clearIntroTimeouts();

    if(globe && globe.controls){
        globe.controls().autoRotate = false;
    }

    const container = document.getElementById('globeContainer');
    container.style.display = 'none';

    map.flyTo([22.5, 78.9], 5, { duration: 2.2 });
    loadIndiaMap();
}

function start3DIntro(){
    console.log('start3DIntro called');

    const container = document.getElementById('globeContainer');
    container.style.display = 'block';
    container.innerHTML = '<div style="position:absolute; inset:0;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;z-index:2001;">Globe loading...</div>';

    if(typeof Globe === 'undefined'){
        console.error('Globe library not loaded');
        return;
    }

    globe = Globe()(container)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .animateIn(true)
        .enablePointerInteraction(false); // intro-only globe, no interaction needed

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.2;

    addIntroTimeout(()=>{
        if(!introCompleted){
            globe.controls().autoRotate = false;
            globe.pointOfView({lat:22.5, lng:78.9, altitude:1.8}, 3000);
        }
    }, 1200);

    addIntroTimeout(()=>{
        if(!introCompleted){
            goToIndiaFromGlobe();
        }
    }, 5600);
}

// 🧠 LOAD INDIA GEOJSON
function loadIndiaMap(){

    fetch("in.json")
    .then(res => res.json())
    .then(data => {

        geoLayer = L.geoJSON(data, {

            filter: feature => {
                const p = feature.properties || {};
                const hasState = p.st_nm || p.state || p.STATE || p.ST_NM;
                const hasDistrict = p.district || p.DISTRICT || p.dist_name || p.DISTRICT_NAME;
                return Boolean(hasState) && !Boolean(hasDistrict);
            },

            style:{
                color:"#1f2937",
                weight:2,
                fillColor:"transparent",
                fillOpacity:0
            },

            onEachFeature:(feature, layer)=>{

                layer.on('mouseover',()=>{
                    layer.setStyle({
                        color:"#3b82f6",
                        weight:3,
                        fillColor:"transparent",
                        fillOpacity:0
                    });
                });

                layer.on('mouseout',()=>{
                    if(layer !== selectedLayer){
                        geoLayer.resetStyle(layer);
                    }
                });

                layer.on('click',()=>{

                    geoLayer.resetStyle();
                    selectedLayer = layer;

                    layer.setStyle({
                        color:"#2563eb",
                        weight:3.5,
                        fillColor:"transparent",
                        fillOpacity:0
                    });

                    setTimeout(()=>{
                        map.invalidateSize();
                        map.flyToBounds(layer.getBounds(), {
                            duration: 0.7,
                            maxZoom: 8,
                            padding: [20, 20]
                        });
                    },120);

                    openPanel(feature.properties.st_nm);
                });
            }

        }).addTo(map);

        // � keep world satellite layer on as base map (India overlay on top)
        if(map.hasLayer(worldLayer)){
            worldLayer.bringToBack();
        }

        // 🔄 allow global view instead of locking to India
        map.setMaxBounds(null);

        // enable controls
        map.scrollWheelZoom.enable();
        map.dragging.enable();
        map.zoomControl.addTo(map);

        // dark base so non-India does not appear white/blank
        document.getElementById("map").style.background = "#0f172a";

        // avoid accidental blank edges after zoom transitions
        map.on('moveend', () => {
            map.invalidateSize();
        });
    });
}


// 🔥 PANEL CONTROL
function openPanel(state){

    selectedState = state;
    currentData = null;

    const panel = document.getElementById("panel");
    panel.style.display = "flex";
    panel.classList.add("active");

    document.getElementById("title").innerText = state;
    document.getElementById("desc").innerText = "Loading...";
    document.getElementById("img").src = "";

    loadStateData(state);
}


// 🔥 LOAD STATE DATA
function loadStateData(state){

    fetch(`data/${state}.json`)
    .then(res => res.json())
    .then(data => {

        currentData = data;

        showData("tradition");

    })
    .catch(()=>{
        document.getElementById("desc").innerText = "No data available";
    });
}


// 🔥 BUTTON SWITCH
function showData(type){

    if(!currentData) return;

    let info = currentData[type];

    document.getElementById("desc").innerText = info.text;
    document.getElementById("img").src = info.image;

    document.getElementById("panelBg").style.backgroundImage =
        `url(${info.image})`;
}


// 🔥 ROUTE MODE (optional)
function toggleRoute(){
    alert("Route mode coming soon 🚀");
}



