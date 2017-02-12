# node-red-contrib-hs100

This Node-RED node is for controlling tp-link Wi-Fi Smart Plug - Model HS100.

This node has only been tested with a HS100(UK). The HS100 is also available in US and EU plug versions. We expect they will work too.

This node simply wraps the excellent work here https://github.com/czjs2/hs100-api. 

# Installation

Change directory to your node red installation:

    $ npm install node-red-contrib-hs100
  
Alternatively, use the Palette Manager in Node-RED.

# Configuration

Drag this node on to a worksheet and double click it. Enter the IP address of the plug on your network. Save and deploy.


# Actuation

To turn the HS100 on, send a message with the topic or payload set to `on`.

To turn the HS100 off, send a message with the topic or payload set to `off`.

To obtain the power consumption, send a message with the topic or payload set to `consumption`. The consumption data will
be sent via this node's output in `msg.payload`.
