// diagnose-audio.js - Find where audio messages are stored
require('dotenv').config();
const mongoose = require('mongoose');

async function diagnoseAudio() {
  try {
    console.log('🔍 Diagnosing audio message issues...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/planyty';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name}`);
    });
    
    // Check each collection for audio-related data
    console.log('\n🔍 Searching for audio messages...');
    
    for (const collection of collections) {
      const colName = collection.name;
      const col = db.collection(colName);
      
      // Check for audio fields
      const audioCount = await col.countDocuments({
        $or: [
          { audioUrl: { $exists: true } },
          { audioSize: { $exists: true } },
          { audioDuration: { $exists: true } },
          { files: { $exists: true } },
          { isVoiceMessage: { $exists: true } }
        ]
      });
      
      if (audioCount > 0) {
        console.log(`\n🎯 Found ${audioCount} audio messages in ${colName}:`);
        
        // Show sample documents
        const samples = await col.find({
          $or: [
            { audioUrl: { $exists: true } },
            { audioSize: { $exists: true } },
            { audioDuration: { $exists: true } },
            { files: { $exists: true } },
            { isVoiceMessage: { $exists: true } }
          ]
        }).limit(3).toArray();
        
        samples.forEach((doc, i) => {
          console.log(`\nSample ${i + 1}:`);
          console.log(`  ID: ${doc._id}`);
          console.log(`  Text: ${doc.text || 'No text'}`);
          console.log(`  Audio URL: ${doc.audioUrl || 'None'}`);
          console.log(`  Audio Size: ${doc.audioSize || 'None'}`);
          console.log(`  Audio Duration: ${doc.audioDuration || 'None'}`);
          console.log(`  Files: ${doc.files ? JSON.stringify(doc.files) : 'None'}`);
          console.log(`  Created: ${doc.createdAt || doc.created_at}`);
        });
      }
    }
    
    // Check for the specific problematic message ID
    console.log('\n🔍 Looking for message with ID 6959207afa135b8fd75f3dd7...');
    for (const collection of collections) {
      const col = db.collection(collection.name);
      const message = await col.findOne({ _id: mongoose.Types.ObjectId('6959207afa135b8fd75f3dd7') });
      if (message) {
        console.log(`✅ Found in ${collection.name}:`);
        console.log(JSON.stringify(message, null, 2));
        break;
      }
    }
    
    // Check messages collection specifically
    console.log('\n🔍 Checking messages collection...');
    const messagesCol = db.collection('messages');
    const totalMessages = await messagesCol.countDocuments({});
    console.log(`Total messages: ${totalMessages}`);
    
    // Find messages with voice emoji
    const voiceMessages = await messagesCol.find({
      text: { $regex: /🎤|voice|audio/i }
    }).toArray();
    
    console.log(`Messages with voice/audio indicators: ${voiceMessages.length}`);
    voiceMessages.forEach(msg => {
      console.log(`\n  ID: ${msg._id}`);
      console.log(`  Text: "${msg.text}"`);
      console.log(`  Created: ${msg.createdAt}`);
    });
    
    mongoose.disconnect();
    console.log('\n✅ Diagnosis complete');
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  }
}

diagnoseAudio();