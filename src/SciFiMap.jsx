import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import './SciFiMap.css';

const SciFiMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const coordinates = useRef([]);
  const markers = useRef([]);
  const cityMarkers = useRef([]);
  const lineId = 'drawn-line';

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [78.9629, 20.5937],
      zoom: 4.2,
      pitch: 60,
      bearing: 0
    });

    mapRef.current = map;

    map.on('load', () => {
      addIndiaBorders();
      const startCoords = [77.5946, 12.9716]; // Bangalore
      addSVGMarker(startCoords);
      coordinates.current.push(startCoords);
      initInteractiveDraw();
      listenForEscape();
      
      // Add a small delay to ensure map is fully ready
      setTimeout(() => {
        loadNewsMarkers();
      }, 1000);
    });

    map.on('zoom', handleZoomLevel);

    return () => map.remove();
  }, []);

  const initInteractiveDraw = () => {
    mapRef.current.on('contextmenu', (e) => {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      addSVGMarker(coords);
      coordinates.current.push(coords);
      drawLine();
    });
  };

  const addIndiaBorders = () => {
    mapRef.current.addSource('india-border', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/Ranjith-K-21/india-state-taluk-geojson_data/main/gadm41_IND_0.json'
    });

    mapRef.current.addLayer({
      id: 'india-border',
      type: 'line',
      source: 'india-border',
      paint: {
        'line-color': '#00f0ff',
        'line-width': 2,
        'line-blur': 4,
        'line-opacity': 0.15
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });
  };

  const addSVGMarker = (coords) => {
    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = "url('marker.svg')";
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.filter = 'drop-shadow(0 0 6px #00f0ff)';

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(coords)
      .addTo(mapRef.current);

    markers.current.push(marker);
  };

  const drawLine = () => {
    const lineData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates.current
      }
    };

    const distance = turf.length(lineData, { units: 'kilometers' }).toFixed(2);
    displayDistance(distance);

    if (!mapRef.current.getSource(lineId)) {
      mapRef.current.addSource(lineId, { type: 'geojson', data: lineData });
      mapRef.current.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        paint: {
          'line-color': '#00f0ff',
          'line-width': 3,
          'line-blur': 1,
          'line-opacity': 0.8
        }
      });
    } else {
      mapRef.current.getSource(lineId).setData(lineData);
    }
  };

  const displayDistance = (km) => {
    let existing = document.getElementById('distance-display');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'distance-display';
      existing.className = 'distance-display';
      document.body.appendChild(existing);
    }
    existing.textContent = `Distance: ${km} km`;
  };

  const listenForEscape = () => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        coordinates.current = [];

        if (mapRef.current.getSource(lineId)) {
          mapRef.current.getSource(lineId).setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] }
          });
        }

        markers.current.forEach(m => m.remove());
        markers.current = [];

        const dist = document.getElementById('distance-display');
        if (dist) dist.textContent = '';
      }
    });
  };

  const loadNewsMarkers = () => {
    console.log('Loading news markers from geo_news.json...');
    
    fetch('/geo_news.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Loaded news data:', data);
        console.log('Number of news items:', data.length);
        
        data.forEach((item, index) => {
          // Check if item has valid geolocation data
          if (!item.geolocation || !item.geolocation.lat || !item.geolocation.lon) {
            console.log('Skipping item without valid coordinates:', item.title);
            return;
          }
          
          console.log(`Creating marker ${index + 1}:`, item.title);
          console.log('At coordinates:', item.geolocation.lat, item.geolocation.lon);
          
          // Create a simple, visible marker
          const el = document.createElement('div');
          el.style.width = '50px';
          el.style.height = '50px';
          el.style.backgroundColor = '#00f0ff';
          el.style.border = '3px solid #ffffff';
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 0 20px #00f0ff';
          el.style.zIndex = '1000';
          
          // Use TemporaryIcon.png as background image
          el.style.backgroundImage = `url('TemporaryIcon.png')`;
          el.style.backgroundSize = 'contain';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundPosition = 'center';
          
          console.log('Marker element created:', el);
          
          // Create popup with news details
          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: true,
            maxWidth: '300px'
          }).setHTML(`
            <div style="color: #00f0ff; padding: 15px; background: rgba(0, 0, 0, 0.9); border: 2px solid #00f0ff; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #00f0ff; font-size: 16px;">📰 ${item.title}</h3>
              <p style="margin: 0 0 10px 0; color: #b0f0ff; font-size: 14px;">${item.summary || 'No summary available'}</p>
              <div style="margin: 0; color: #80e0ff; font-size: 12px;">
                <p style="margin: 2px 0;"><strong>📍 Location:</strong> ${item.geolocation.name || 'Unknown'}</p>
                <p style="margin: 2px 0;"><strong>📡 Source:</strong> ${item.source || 'News'}</p>
                <p style="margin: 2px 0;"><strong>🌐 Coordinates:</strong> ${item.geolocation.lat.toFixed(4)}, ${item.geolocation.lon.toFixed(4)}</p>
              </div>
            </div>
          `);
          
          // Create and add marker
          const marker = new maplibregl.Marker(el)
            .setLngLat([item.geolocation.lon, item.geolocation.lat])
            .setPopup(popup)
            .addTo(mapRef.current);
            
          console.log(`Marker ${index + 1} added to map successfully at:`, [item.geolocation.lon, item.geolocation.lat]);
        });
        
        console.log(`Successfully loaded ${data.length} news markers from geo_news.json`);
      })
      .catch(err => {
        console.error('Failed to load news from geo_news.json:', err);
        // Fallback: show error message
        alert('Failed to load news data. Please check if geo_news.json exists in the public folder.');
      });
  };

  const handleZoomLevel = () => {
    const zoom = mapRef.current.getZoom();

    cityMarkers.current.forEach((marker) => {
      const isOnMap = marker._map != null;

      if (zoom > 8 && !isOnMap) {
        marker.addTo(mapRef.current);
      } else if (zoom <= 6.5 && isOnMap) {
        marker.remove();
      }
    });
  };

  return (
    <>
      <div ref={mapContainerRef} id="map" />
      <div className="blue-tint"></div>
      <div className="hud-text">INDIA LIVE ZONES</div>
    </>
  );
};

export default SciFiMap;
