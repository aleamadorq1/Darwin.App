import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Modal, Input } from 'antd';
import { useGoogleMaps } from './GoogleMapsProvider';
import './App.css'; // Make sure to import your CSS file

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const GoogleMapsComponent = ({ visible, onClose, onLocationSelect, initialCenter = center }) => {
  const googleMapsLoaded = useGoogleMaps();
  const [marker, setMarker] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);

  const handleMapClick = (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setMarker(newMarker);
    setPlaceDetails(null); // Clear place details if user clicks on the map
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
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
    }
  };

  const handleSave = () => {
    onLocationSelect(placeDetails || marker);
    onClose();
  };

  useEffect(() => {
    if (autocomplete) {
      const autocompleteListener = autocomplete.addListener('place_changed', handlePlaceChanged);
      return () => {
        if (autocompleteListener) {
          autocompleteListener.remove();
        }
      };
    }
  }, [autocomplete]);

  if (!googleMapsLoaded) {
    return null;
  }

  return (
    <Modal
      open={visible}
      title="Select Location"
      onCancel={onClose}
      onOk={handleSave}
      width={800}
    >
      <Autocomplete
        onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
        onPlaceChanged={handlePlaceChanged}
      >
        <Input placeholder="Search for a place" style={{ marginBottom: '10px' }} />
      </Autocomplete>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={10}
        onClick={handleMapClick}
        onLoad={(mapInstance) => (mapRef.current = mapInstance)}
      >
        {marker && (
          <Marker position={{ lat: marker.lat, lng: marker.lng }} />
        )}
      </GoogleMap>
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
