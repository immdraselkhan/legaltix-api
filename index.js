const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Middlewares
app.use(cors());
app.use(express.json({limit: '50mb'}));

// Cloudinary API config
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// If MongoDB Atlast use this server URL (Cluster)
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@practice-cluster.kfbhlaq.mongodb.net/?retryWrites=true&w=majority`;

// If MongoDB Compass use this server URL
const uri = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.0';

// Creating a new client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Connecting the client to the cluster then creating database
const dbConnect = async () => {
  try {
    // Connect client
    await client.connect();

    // Verify If connected, else bellow lines will not execute
    console.log('Database is connected...');

    // [USE IT TO TEST] Creating database and adding a collection then inserting a document
    // const Services = client.db('legaltix').collection('services');
    // const result = await Services.insertOne({'name': 'Md Rasel Khan'});
    // console.log(result);

  } catch (error) {
    // Error handling
    console.log(error);
  };
};

// Execute the above function
dbConnect();

/// CREATE DATABASES

// Main database
const main = client.db('legaltix');

/// CREATE COLLECTIONS

// All services collection
const Services = main.collection('services');

/// API ENDPOINTS

// New service adding
app.post('/add-service', async (req, res) => {
  const {name, image} = req.body;
  try {
    const uploadedImage = await cloudinary.uploader.upload(image, {folder: 'dev/legaltix/services'});
    const service = {name, image: {public_id: uploadedImage.public_id, url: uploadedImage.secure_url}};
    const result = await Services.insertOne(service);
    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully added the ${req.body.name} with id ${result.insertedId}`,
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't create the service",
      });
    };
  } catch (error) {
    console.log(error.name, error);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Verify the server is running or not
app.get('/', (req, res) => {
  try {
    res.send({
      success: true,
      message: 'Server is running...',
    });
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Listening the app on a particular port
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});