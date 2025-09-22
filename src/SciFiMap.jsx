// SciFiMap.jsx
// Responsibilities:
// - Initialize a MapLibre map centered on India
// - Load news items from public/rohit.json
// - For each item, place a marker at (longitude, latitude)
// - Choose the marker icon based on the item's category using SVGs in public/extras2
// Notes for future automation:
// - If rohit.json will be generated automatically, keep its shape stable:
//   { title, description, source, category, location, latitude, longitude }
// - The category-to-SVG mapping is defined in getCategoryIcon().
//   New categories require adding a key here and an SVG file under public/extras2.
import React, { useEffect, useRef, useCallback } from 'react';
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

  // Category to SVG mapping
  // Maps high-level news categories to their corresponding SVG filenames.
  // Icons must exist in public/extras2. Example path on the client: /extras2/Crime.svg
  const getCategoryIcon = (category) => {
    const categoryMap = {
      'Crime': 'Crime.svg',
      'Disasters': 'Disasters.svg',
      'Technology': 'Technology.svg',
      'Society': 'Society.svg',
      'Culture': 'Culture.svg',
      'Health': 'Health.svg',
      'Politics': 'Politics.svg',
      'Weather': 'Weather.svg',
      'Sports': 'Sports.svg',
      'Accidents': 'Accidents.svg'
    };
    return categoryMap[category] || 'TemporaryIcon.png';
  };

  const drawLine = useCallback(() => {
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
  }, []);

  const initInteractiveDraw = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.on('contextmenu', (e) => {
        const coords = [e.lngLat.lng, e.lngLat.lat];
        addSVGMarker(coords);
        coordinates.current.push(coords);
        drawLine();
      });
    }
  }, [drawLine]);

  // Fetch and render all news markers from public/rohit.json
  // Each item should include: title, description, source, category, location, latitude, longitude
  const loadNewsMarkers = useCallback(() => {
    console.log('Loading news markers from rohit.json...');
    
    fetch('/rohit.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Loaded news data:', data);
        console.log('Number of news items:', data.length);
        
        // Future automation hook:
        // If you need to normalize categories (e.g., lowercase, trim), do it here
        // before iterating, so mapping stays consistent.
        data.forEach((item, index) => {
          // Check if item has valid coordinates
          if (!item.latitude || !item.longitude) {
            console.log('Skipping item without valid coordinates:', item.title);
            return;
          }
          
          console.log(`Creating marker ${index + 1}:`, item.title);
          console.log('At coordinates:', item.latitude, item.longitude);
          console.log('Category:', item.category);
          
          // Create a simple, visible marker container
          // We keep a subtle circular frame and place the category SVG inside
          const el = document.createElement('div');
          el.style.width = '50px';
          el.style.height = '50px';
          el.style.backgroundColor = 'rgba(0, 240, 255, 0.2)';
          el.style.border = '2px solid #ffffff';
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';
          el.style.zIndex = '1000';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          
          // Resolve the category-specific SVG from public/extras2
          // Example: /extras2/Crime.svg
          const iconFile = getCategoryIcon(item.category);
          const iconPath = `extras2/${iconFile}`;
          
          // Create img element for SVG. Using <img> avoids some background sizing issues
          // and makes the intent explicit for future contributors.
          const img = document.createElement('img');
          img.src = iconPath;
          img.style.width = '30px';
          img.style.height = '30px';
          img.style.objectFit = 'contain';
          // If your SVGs are dark and the map background is dark, consider enabling the line below.
          // This inverts the icon to white for visibility.
          // img.style.filter = 'brightness(0) invert(1)';
          el.appendChild(img);
          
          console.log('Marker element created with icon:', iconFile);
          console.log('Full icon path:', iconPath);
          console.log('Category:', item.category);
          
          // Create popup with news details matching the demo format
          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: true,
            maxWidth: '300px'
          }).setHTML(`
            <div style="color: #00f0ff; padding: 15px; background: rgba(0, 0, 0, 0.9); border: 2px solid #00f0ff; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #00f0ff; font-size: 16px;">📰 ${item.title}</h3>
              <p style="margin: 0 0 10px 0; color: #b0f0ff; font-size: 14px;">${item.description || 'No description available'}</p>
              <div style="margin: 0; color: #80e0ff; font-size: 12px;">
                <p style="margin: 2px 0;"><strong>📍 Location:</strong> ${item.location || 'Unknown'}</p>
                <p style="margin: 2px 0;"><strong>📡 Source:</strong> ${item.source || 'News'}</p>
                <p style="margin: 2px 0;"><strong>🏷️ Category:</strong> ${item.category || 'General'}</p>
                <p style="margin: 2px 0;"><strong>🌐 Coordinates:</strong> ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}</p>
              </div>
            </div>
          `);
          
          // Create and add map marker with our custom element
          new maplibregl.Marker(el)
            .setLngLat([item.longitude, item.latitude])
            .setPopup(popup)
            .addTo(mapRef.current);
            
          console.log(`Marker ${index + 1} added to map successfully at:`, [item.longitude, item.latitude]);
        });
        
        console.log(`Successfully loaded ${data.length} news markers from rohit.json`);
      })
      .catch(err => {
        console.error('Failed to load news from rohit.json:', err);
        // Fallback: show error message
        alert('Failed to load news data. Please check if rohit.json exists in the public folder.');
      });
  }, []);

  // Initialize MapLibre, layers and then load markers
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
  }, [initInteractiveDraw, loadNewsMarkers]);


  // Decorative India border layer (optional visual context)
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

  // Helper for manually dropping a demo marker (right-click)
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
