const express = require("express");
const cors = require("cors")
const app = express();
const fs = require('fs/promises')
const morgan = require("morgan");
const constants = require("constants");

let notifs = [];
let subscribers = [];

app.use(cors());
app.use(express.json()); // Active le parsing JSON
app.use(morgan('tiny'));

app.get("/notifs", (req, res) => {
    let lastModified = null;
    if(notifs.length) {
        lastModified = notifs[notifs.length - 1].date;
    }

    if(req.headers["if-modified-since"] === lastModified){
        return res.sendStatus(304);
    }

    if(lastModified) {
        res.set("Last-Modified", lastModified);
    }
    res.json(!req.headers["if-modified-since"] ? notifs : notifs.filter(n => req.headers["if-modified-since"] < n.date));
});

app.get('/notifs/subscribe', (req, res) => {
    subscribers.push(res);
    res.on('end', () => {
        subscribers = subscribers.filter(s => s !== res);
    });
});

app.post("/notifs", (req, res) => {
    const notif = {...req.body, date: new Date().toISOString()}; // "..." permet de reprendre la structure JSON de l'objet
    notifs.push(notif);
    subscribers.forEach(s => s.json(notif));
    fs.writeFile("./data.json", JSON.stringify(notifs))
        .then(() =>  res.status(201).json(notif))
        .catch(() =>  res.status(500));
});

// stock les données dans un fichier JSON
fs.access("./data.json", constants.R_OK)
    .then(() => fs.readFile("./data.json"))
    .then(data => notifs = JSON.parse(data.toString()))
    .catch(() => notifs = [])
    .then(() => app.listen(3000, () => {
        console.log("Server listening on port 3000...");
    }));

