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
'use strict';

module.exports = function hs100(RED) {
    const Hs100Api = require('fx-hs100-api');

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
        model: 'getModel',
    };

    hs100.newHs100Client = function () {
        return new Hs100Api.Client();
    };

    RED.nodes.registerType('hs100', function (config) {
        RED.nodes.createNode(this, config);
        // eslint-disable-next-line consistent-this
        const node = this;

        const client = hs100.newHs100Client();
        const plug = client.getPlug({ host: config.host });

        const errorHandler = function (err) {
            node.error(err);
            node.status({ fill: 'red', shape: 'dot', text: err.message });
        };

        const setPowerState = function (on) {
            node.status({
                fill: 'orange',
                shape: on ? 'dot' : 'circle',
                text: 'Turning ' + (on ? 'on' : 'off'),
            });
            plug.setPowerState(on)
                .then(() => {
                    node.status({
                        fill: 'green',
                        shape: on ? 'dot' : 'circle',
                        text: on ? 'on' : 'off',
                    });
                })
                .catch(errorHandler);
        };

        const getActuation = function (actuation) {
            if (actuation) {
                const method = hs100.supportedActuations[actuation.toLowerCase()];
                if (method) {
                    return { name: actuation, method };
                }
            }

            return null;
        };

        node.on('input', (msg) => {
            if (msg.payload === 'on' || msg.topic === 'on') {
                setPowerState(true);
            } else if (msg.payload === 'off' || msg.topic === 'off') {
                setPowerState(false);
            } else {
                const actuation = getActuation(msg.payload) || getActuation(msg.topic);
                if (actuation) {
                    plug[actuation.method]()
                        .then((data) => {
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

        node.on('close', () => {
            client.socket.close();
        });
    });
};
