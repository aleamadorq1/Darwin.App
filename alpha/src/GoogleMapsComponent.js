import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { Modal, Input } from 'antd';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const libraries = ['places'];

const GoogleMapsComponent = ({ visible, onClose, onLocationSelect }) => {
  const [marker, setMarker] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);

  const handleMapClick = (event) => {
    setMarker({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
    setPlaceDetails(null); // Clear place details if user clicks on the map
  };

  const handlePlaceChanged = () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const newMarker = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setMarker(newMarker);
      mapRef.current.panTo(newMarker);
      setPlaceDetails({
        name: place.name,
        address: place.formatted_address,
        lat: newMarker.lat,
        lng: newMarker.lng,
      });
    }
  };

  const handleSave = () => {
    onLocationSelect(placeDetails || marker);
    onClose();
  };

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.marker) {
      const { AdvancedMarkerElement } = window.google.maps.marker;
      if (marker) {
        new AdvancedMarkerElement({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapRef.current,
        });
      }
    }
  }, [marker]);

  return (
    <Modal
      open={visible}
      title="Select Project Location"
      onCancel={onClose}
      onOk={handleSave}
      width={800}
    >
      <LoadScript googleMapsApiKey="AIzaSyD7Ub59HnZxM5bQ-fZl58pLAy1-7a8_WL4" libraries={libraries} loadingElement={<div style={{ height: `100%` }} />}>
        <Autocomplete
          onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
          onPlaceChanged={handlePlaceChanged}
        >
          <Input placeholder="Search for a place" style={{ marginBottom: '10px' }} />
        </Autocomplete>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={10}
          onClick={handleMapClick}
          onLoad={(mapInstance) => (mapRef.current = mapInstance)}
        >
          {marker && (
            <Marker position={{ lat: marker.lat, lng: marker.lng }} />
          )}
        </GoogleMap>
      </LoadScript>
      {placeDetails && (
        <div style={{ marginTop: '10px' }}>
          <p><strong>Name:</strong> {placeDetails.name}</p>
          <p><strong>Address:</strong> {placeDetails.address}</p>
          <p><strong>Lat:</strong> {placeDetails.lat}, <strong>Lng:</strong> {placeDetails.lng}</p>
        </div>
      )}
    </Modal>
  );
};

export default GoogleMapsComponent;
