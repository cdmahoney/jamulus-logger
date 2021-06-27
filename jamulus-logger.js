const config = require("config");
const luxon = require("luxon");
const mqtt = require("mqtt");

const internals = (function()
{
    const getContext = function(client)
    {
        let json = {
            "context": {
                "client": client,
                "ts": luxon.DateTime.utc()
            }
        }
        let result = JSON.stringify(json);
        return result;
    }

    return {
        "getContext": getContext
    };
}());


let client  = mqtt.connect(`${config.mqttBroker.host}:${config.mqttBroker.port}`);

client.on("connect",
    function ()
    {
        client.subscribe(config.jamulus.topicPingAck,
            function (err)
            {
                if (err)
                {
                    console.error(`Error subscribing to topic ${config.jamulus.topicPingAck}`);
                    console.error(err);
                }
            });

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
                // Ping servers
                client.publish(config.jamulus.topicPing, internals.getContext(config.jamulus.clientId));
                //  - request connections and config for each responding server
                // client.publish("jamulus/22124/state/request/configuration/get", internals.getContext(config.jamulus.clientId));
                // client.publish("jamulus/22124/state/request/connections/get", internals.getContext(config.jamulus.clientId));
            }, config.jamulus.pingDelay);
    });

client.on("message",
    function (topic, message)
    {
        let json = JSON.parse(message.toString());
        if(topic === config.jamulus.topicPingAck)
        {
            console.warn("json.server.type", json.server.type);
            if(json.server.type === "state")
            {
                client.publish(`jamulus/${json.server.port}/state/request/configuration/get`, internals.getContext(config.jamulus.clientId));
                client.publish(`jamulus/${json.server.port}/state/request/connections/get`, internals.getContext(config.jamulus.clientId));
            }
        }
        else
        {
            let jsonString = JSON.stringify(json);
            console.log(`${luxon.DateTime.utc()} ${topic} ${jsonString}`);
        }
    })