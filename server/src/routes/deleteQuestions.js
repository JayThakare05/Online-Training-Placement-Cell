//donot touch this file

import mongoose from 'mongoose';
import CodingQuestion from '../models/uploadQuestions.js'; // Adjust the path as needed

// Replace with your MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/career_training'; 

async function deleteAllQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB.');

    // Delete all documents from the CodingQuestion collection
    const result = await CodingQuestion.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} documents.`);

  } catch (error) {
    console.error('Error deleting questions:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

deleteAllQuestions();