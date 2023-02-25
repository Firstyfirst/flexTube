const express = require("express");
const amqp = require('amqplib');
const http = require("http");


if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const RABBIT = process.env.RABBIT;
//
// Connect to the RabbitMQ server.
//
function connectRabbit() {

    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT) // Connect to the RabbitMQ server.
        .then(connection => {
            console.log("Connected to RabbitMQ.");
            return connection.createChannel() // Create a RabbitMQ messaging channel.
                .then(messageChannel => {
                    return messageChannel.assertExchange("viewed", "fanout") // Assert that we have a "viewed" exchange.
                        .then(() => {
                            return messageChannel;
                        });
                });

        });
}

function displayAd(advertisement, messageChannel) {
    // Create a div element to hold the ad
    const adDiv = document.createElement("div");
    adDiv.classList.add("advertisement");
  
    // Create a h3 element for the product name
    const nameHeading = document.createElement("h3");
    nameHeading.textContent = advertisement.name;
    adDiv.appendChild(nameHeading);
  
    // Create a p element for the product description
    const descParagraph = document.createElement("p");
    descParagraph.textContent = advertisement.text;
    adDiv.appendChild(descParagraph);
  
    // Create a link element for the product url
    const link = document.createElement("a");
    link.href = advertisement.url;
    link.textContent = "Learn More";
    adDiv.appendChild(link);
  
    // Add the ad to the DOM
    const container = document.getElementById("ad-container");
    container.appendChild(adDiv);

    console.log(`Message channel : ${messageChannel}.`)
  }

//
// Start the HTTP server.
//
function startHttpServer(messageChannel) {
    return new Promise(resolve => { // Wrap in a promise so we can be notified when the server has started.
        const app = express();
        // setupHandlers(app, messageChannel);
        const ads = require("/mock-storage/storage/ads.json");
        displayAd(ads, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve(); // HTTP server is listening, resolve the promise.
        });
    });
}

//
// Application entry point.
//
function main() {
    return connectRabbit()                          // Connect to RabbitMQ...
        .then(messageChannel => {                   // then...
            return startHttpServer(messageChannel); // start the HTTP server.
        });
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });