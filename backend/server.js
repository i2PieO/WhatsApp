// importing 
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config 
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1808370",
    key: "03be9f11202624763392",
    secret: "9b1351f7b3314cfe0426",
    cluster: "ap2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors())

// DB config 
const connection_url = 'mongodb+srv://admin:cwAD1qSjFqIIyOUb@cluster0.ffezfum.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0cwAD1qSjFqIIyOUb'

mongoose.connect(connection_url)

const db = mongoose.connection

db.once('open', () => {
  console.log("DB connected");

  const msgCollection = db.collection('messagecontents')
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A Change occured", change);

    if (change.operationType === 'insert') {
        const messageDetails = change.fullDocument;
        pusher.trigger('messages', 'inserted', 
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
        );
    } else {
       console.log('Error triggering Pusher')
    }

  });
});


// api routes 
app.get("/", (req,res) => res.status(200).send("hello world"));

app.get('/messages/sync', async (req, res) => {
    try {
        const data = await Messages.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/messages/new', async (req, res) => {
    const dbMessage = req.body;

    try {
        const data = await Messages.create(dbMessage);
        res.status(201).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));