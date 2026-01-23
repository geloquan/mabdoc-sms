/**
 * ConfigurationPanel Component Tests
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ConfigurationPanel from '../src/components/ConfigurationPanel';

// Mock the dependencies
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('test-device-id')),
  getManufacturer: jest.fn(() => Promise.resolve('TestManufacturer')),
  getModel: jest.fn(() => Promise.resolve('TestModel')),
  getSystemVersion: jest.fn(() => Promise.resolve('13')),
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getBuildNumber: jest.fn(() => Promise.resolve('1')),
}));

jest.mock('../src/services/SettingsService', () => ({
  getSettings: jest.fn(() => Promise.resolve({
    apiUrl: 'https://api.test.com',
    username: 'testuser',
    password: 'testpassword',
    smsInterval: 60,
    healthInterval: 120,
    commandInterval: 60,
  })),
}));

describe('ConfigurationPanel Component', () => {
  test('renders correctly when collapsed', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(<ConfigurationPanel collapsed={true} />);
    });
    
    const tree = component.toJSON();
    expect(tree).toBeTruthy();
  });

  test('renders correctly when expanded', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(<ConfigurationPanel collapsed={false} />);
    });
    
    const tree = component.toJSON();
    expect(tree).toBeTruthy();
  });

  test('defaults to collapsed state', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(<ConfigurationPanel />);
    });
    
    const tree = component.toJSON();
    expect(tree).toBeTruthy();
  });
});
