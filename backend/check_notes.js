const mongoose = require('mongoose');
const Note = require('./models/Note');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const notes = await Note.find().sort({ date: -1 }).limit(3);
        notes.forEach(n => {
            console.log(`Title: ${n.title}, Date: ${n.date.toISOString()}, Local: ${n.date.toLocaleString()}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
