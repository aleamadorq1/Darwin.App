import React, { createContext, useContext } from 'react';
import { LoadScript } from '@react-google-maps/api';

const GoogleMapsContext = createContext();

const libraries = ['places'];

export const GoogleMapsProvider = ({ children }) => {
  return (
    <LoadScript googleMapsApiKey="AIzaSyD7Ub59HnZxM5bQ-fZl58pLAy1-7a8_WL4&loading=async" libraries={libraries}>
      <GoogleMapsContext.Provider value={true}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
};

export const useGoogleMaps = () => {
  return useContext(GoogleMapsContext);
};
