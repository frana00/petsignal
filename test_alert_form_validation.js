/**
 * Test script to verify AlertForm validation and button state
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import AlertForm from './src/components/forms/AlertForm';

// Mock the auth context
jest.mock('./src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' }
  })
}));

describe('AlertForm Validation Tests', () => {
  test('Button should be disabled when form is invalid', () => {
    const { getByText } = render(<AlertForm />);
    
    // Button should be disabled initially (empty form)
    const button = getByText('Crear Alerta');
    expect(button).toBeDisabled();
  });

  test('Button should be enabled when form is valid', () => {
    const validData = {
      title: 'Test Alert',
      petName: 'Buddy',
      breed: 'Golden Retriever',
      color: 'Golden',
      description: 'Lost dog',
      location: 'Madrid',
      contactPhone: '123456789',
      contactEmail: 'test@example.com'
    };

    const { getByText } = render(<AlertForm initialData={validData} />);
    
    // Button should be enabled with valid data
    const button = getByText('Crear Alerta');
    expect(button).not.toBeDisabled();
  });

  test('Email should be auto-completed from user data', () => {
    const { getByDisplayValue } = render(<AlertForm />);
    
    // Should have user email pre-filled
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  test('Edit mode should load data correctly', () => {
    const alertData = {
      id: '123',
      title: 'Lost Dog',
      type: 'LOST',
      breed: 'Golden Retriever',
      sex: 'MALE',
      description: 'Beautiful golden retriever\n\nNombre: Buddy\nColor: Golden\nEdad: 3 años\nUbicación específica: Parque del Retiro\nContacto: 123456789\nEmail: owner@example.com',
      date: '2024-01-01T10:00:00Z',
      countryCode: 'ES'
    };

    const { getByDisplayValue } = render(<AlertForm initialData={alertData} />);
    
    // Should extract data from description
    expect(getByDisplayValue('Buddy')).toBeTruthy(); // petName
    expect(getByDisplayValue('Golden')).toBeTruthy(); // color
    expect(getByDisplayValue('3')).toBeTruthy(); // age
    expect(getByDisplayValue('Parque del Retiro')).toBeTruthy(); // location
    expect(getByDisplayValue('123456789')).toBeTruthy(); // phone
    expect(getByDisplayValue('owner@example.com')).toBeTruthy(); // email
  });
});

console.log('AlertForm validation tests defined successfully!');
