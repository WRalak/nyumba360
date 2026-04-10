import React, { createContext, useContext, useReducer } from 'react';
import { propertyAPI } from '../services/api';

const PropertyContext = createContext();

const propertyReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROPERTIES':
      return {
        ...state,
        properties: action.payload,
        loading: false,
        error: null,
      };
    case 'ADD_PROPERTY':
      return {
        ...state,
        properties: [...state.properties, action.payload],
      };
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map(property =>
          property.id === action.payload.id ? action.payload : property
        ),
      };
    case 'DELETE_PROPERTY':
      return {
        ...state,
        properties: state.properties.filter(property => property.id !== action.payload),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_SELECTED_PROPERTY':
      return {
        ...state,
        selectedProperty: action.payload,
      };
    case 'CLEAR_SELECTED_PROPERTY':
      return {
        ...state,
        selectedProperty: null,
      };
    default:
      return state;
  }
};

const initialState = {
  properties: [],
  loading: false,
  error: null,
  selectedProperty: null,
};

export const PropertyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(propertyReducer, initialState);

  // Actions
  const fetchProperties = async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await propertyAPI.getAll(params);
      dispatch({ type: 'SET_PROPERTIES', payload: response.properties || [] });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const createProperty = async (propertyData) => {
    try {
      const response = await propertyAPI.create(propertyData);
      dispatch({ type: 'ADD_PROPERTY', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateProperty = async (id, propertyData) => {
    try {
      const response = await propertyAPI.update(id, propertyData);
      dispatch({ type: 'UPDATE_PROPERTY', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteProperty = async (id) => {
    try {
      await propertyAPI.delete(id);
      dispatch({ type: 'DELETE_PROPERTY', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setSelectedProperty = (property) => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
  };

  const clearSelectedProperty = () => {
    dispatch({ type: 'CLEAR_SELECTED_PROPERTY' });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    // Actions
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    setSelectedProperty,
    clearSelectedProperty,
    clearError,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export default PropertyContext;
