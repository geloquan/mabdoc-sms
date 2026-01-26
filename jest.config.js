module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@react-native|react-native|react-native-get-random-values|react-native-aes-crypto|react-native-uuid|react-native-sms)/)',
  ],
};
