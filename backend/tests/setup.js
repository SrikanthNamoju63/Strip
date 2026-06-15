const mongoose = require('mongoose');

beforeAll(async () => {
  // Disconnect from any existing connection
  await mongoose.disconnect();
  
  // Connect to a local test database
  const mongoUri = 'mongodb://127.0.0.1:27017/strip_test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Drop database, close connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});
