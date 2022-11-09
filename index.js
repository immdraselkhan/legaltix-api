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

// All reviewes collection
const Reviews = main.collection('reviews');

/// API ENDPOINTS

// Add service
app.post('/add-service', async (req, res) => {

  const {title, slug, thumbnail, description, price, userName, userId, userPhoto} = req.body;

  try {
    const uploadedThumbnail = await cloudinary.uploader.upload(thumbnail, {folder: 'dev/legaltix/services'});

    const uploadedUserPhoto = userPhoto.startsWith('data:') ? await cloudinary.uploader.upload(userPhoto, {folder: 'dev/legaltix/services'}) : {public_id: userPhoto.substring(8), secure_url: userPhoto};

    const service = {title, slug, thumbnail: {public_id: uploadedThumbnail.public_id, url: uploadedThumbnail.secure_url}, description, price, userName, userId, userPhoto: {public_id: uploadedUserPhoto.public_id, url: uploadedUserPhoto.secure_url}};

    const result = await Services.insertOne(service);

    if (result.insertedId) {
      res.send({
        success: true,
        message: `Successfully added the ${req.body.title}`,
        updatedPhoto: uploadedUserPhoto.secure_url,
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t create the service',
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

// Add review
app.post('/add-review/:slug', async (req, res) => {
  try {
    const review = req.body;
    const result = await Reviews.insertOne(review);
    // const service = await Services.findOne({ _id: ObjectId(review.serviceId)});
    // service['rating'] = review.star;
    // service['reviewedBy'] = 1;
    // console.log(service);
    if (result.insertedId) {
      res.send({
        success: true,
        message: 'Successfully added',
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t add the review',
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

// All services
app.get('/services', async (req, res) => {
  try {
    const cursor = Services.find({}).sort({'_id': -1});
    const services = await cursor.limit(parseInt(req.query.total)).toArray();
    res.send({
      success: true,
      data: services,
    });
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Single service and reviews
app.get('/service/:slug', async (req, res) => {
  try {
    const service = await Services.findOne({ slug: req.params.slug});

    const cursor = Reviews.find({serviceId: service._id}).sort({'_id': -1});

    const reviews = await cursor.toArray();
    
    res.send({
      success: true,
      data: {service, reviews},
    });
  } catch (error) {
    console.log(error.name, error.message);
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