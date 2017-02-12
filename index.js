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

module.exports = function (RED) {
    'use strict';

    var Hs100Api = require('fx-hs100-api');

    RED.nodes.registerType('hs100', function (config) {

        RED.nodes.createNode(this, config);
        var node = this;

        var client = new Hs100Api.Client();
        var plug = client.getPlug({host: config.host});

        node.on('input', function (msg) {
            if (msg.payload === 'consumption' || msg.topic === 'consumption') {
                plug.getConsumption().then(function (data) {
                    node.send({payload: data});
                }).catch(errorHandler);
            } else if (msg.payload === 'on' || msg.topic === 'on') {
                setPowerState(true);
            } else if (msg.payload === 'off' || msg.topic === 'off') {
                setPowerState(false);
            } else {
                errorHandler(new Error('Actuation must be one of [on, off, consumption]'));
            }
        });

        node.on('close', function () {
            client.socket.close();
        });

        function setPowerState(on) {
            plug.setPowerState(on).then(function () {
                node.status({
                    fill: 'green',
                    shape: on ? 'dot' : 'circle',
                    text: on ? 'on' : 'off'
                });
            }).catch(errorHandler);
        }

        function errorHandler(err) {
            node.error(err);
            node.status({fill: 'red', shape: 'dot', text: err.message});
        }
    });
};