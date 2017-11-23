/**
 The MIT License (MIT)

 Copyright (c) 2017 @biddster

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

module.exports = function hs100(RED) {
    'use strict';

    var Hs100Api = require('fx-hs100-api');

    // TODO address the disparity of not having on and off in here. It bothers me.
    hs100.supportedActuations = {
        info: 'getInfo',
        sysinfo: 'getSysInfo',
        cloudinfo: 'getCloudInfo',
        consumption: 'getConsumption',
        powerstate: 'getPowerState',
        schedulenextaction: 'getScheduleNextAction',
        schedulerules: 'getScheduleRules',
        awayrules: 'getAwayRules',
        timerrules: 'getTimerRules',
        time: 'getTime',
        timezone: 'getTimeZone',
        scaninfo: 'getScanInfo',
        model: 'getModel'
    };

    hs100.newHs100Client = function() {
        return new Hs100Api.Client();
    };

    RED.nodes.registerType('hs100', function(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var client = hs100.newHs100Client();
        var plug = client.getPlug({ host: config.host });

        node.on('input', function(msg) {
            if (msg.payload === 'on' || msg.topic === 'on') {
                setPowerState(true);
            } else if (msg.payload === 'off' || msg.topic === 'off') {
                setPowerState(false);
            } else {
                var actuation = getActuation(msg.payload) || getActuation(msg.topic);
                if (actuation) {
                    plug[actuation.method]()
                        .then(function(data) {
                            node.send({ topic: actuation.name, payload: data });
                        })
                        .catch(errorHandler);
                } else {
                    errorHandler(
                        new Error(
                            'Actuation must be one of on,off,' +
                                Object.keys(hs100.supportedActuations).toString()
                        )
                    );
                }
            }
        });

        node.on('close', function() {
            client.socket.close();
        });

        function setPowerState(on) {
            node.status({
                fill: 'orange',
                shape: on ? 'dot' : 'circle',
                text: 'Turning ' + (on ? 'on' : 'off')
            });
            plug
                .setPowerState(on)
                .then(function() {
                    node.status({
                        fill: 'green',
                        shape: on ? 'dot' : 'circle',
                        text: on ? 'on' : 'off'
                    });
                })
                .catch(errorHandler);
        }

        function getActuation(actuation) {
            if (actuation) {
                var method = hs100.supportedActuations[actuation.toLowerCase()];
                if (method) {
                    return { name: actuation, method: method };
                }
            }
            return null;
        }

        function errorHandler(err) {
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.message });
        }
    });
};
