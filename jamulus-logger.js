var config = require("config");
var luxon = require("luxon");
var mqtt = require("mqtt");

var client  = mqtt.connect(`${config.mqttBroker.host}:${config.mqttBroker.port}`);

client.on("connect",
    function ()
    {
        config.logging.topics.forEach(
            function(topic)
            {
                client.subscribe(topic,
                    function (err)
                    {
                        if (err)
                        {
                            console.error(`Error subscribing to topic ${topic}`);
                            console.error(err);
                        }
                    });
            });

        setTimeout(
            function()
            {
                // TODO
                //  - Ping servers
                //  - request connections and config for each responding server
                client.publish("jamulus/22124/state/request/configuration/get", "{ \"client\": \"jamulus-logger\"}");
                client.publish("jamulus/22124/state/request/connections/get", "{ \"client\": \"jamulus-logger\"}");
            }, 1000);
    });

client.on("message",
    function (topic, message)
    {
        // message is Buffer
        let json = JSON.parse(message.toString());
        let jsonString = JSON.stringify(json);
        console.log(`${luxon.DateTime.utc()} ${topic} ${jsonString}`);
    })