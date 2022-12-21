/* eslint-disable func-style */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
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

const Assert = require('chai').assert;
const Mock = require('node-red-contrib-mock-node');
const NodeRedModule = require('../index.js');
const _ = require('lodash');

describe('hs100', function () {
    this.timeout(60000);
    it('should turn a socket on', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { payload: 'on' });
        setTimeout(function () {
            Assert.strictEqual(node.status().text, 'on');
            Assert.strictEqual(node.status().shape, 'dot');
            node.emit('close');
            done();
        }, 10);
    });
    // it('should turn a socket on after host reconfiguration', function (done) {
    //     const node = NewNode({ host: 'localhost' });
    //     node.emit('input', { hs100_address: 'localhost2', payload: 'on' });
    //     setTimeout(function () {
    //         Assert.strictEqual(node.status().text, 'on');
    //         Assert.strictEqual(node.status().shape, 'dot');
    //         Assert.deepEqual(node.sent(0).payload, {
    //             mocked: 'on',
    //             host: 'localhost',
    //         });
    //         node.emit('close');
    //         done();
    //     }, 10);
    // });
    it('should turn a socket off', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { payload: 'off' });
        setTimeout(function () {
            Assert.strictEqual(node.status().text, 'off');
            Assert.strictEqual(node.status().shape, 'circle');
            node.emit('close');
            done();
        }, 10);
    });
    it('should emit consumption data', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { payload: 'consumption' });
        setTimeout(function () {
            Assert.deepEqual(node.sent(0).payload, {
                mocked: 'getConsumption',
                host: 'localhost',
            });
            Assert.strictEqual(node.sent(0).topic, 'consumption');
            node.emit('close');
            done();
        }, 10);
    });
    it('should emit sysinfo data', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { topic: 'SysInfo' });
        setTimeout(function () {
            Assert.deepEqual(node.sent(0).payload, { mocked: 'getSysInfo', host: 'localhost' });
            Assert.strictEqual(node.sent(0).topic, 'SysInfo');
            node.emit('close');
            done();
        }, 10);
    });
    it('should emit sysinfo data after hs100 address reconfiguration', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { hs100_address: 'localhost2', topic: 'SysInfo' });
        setTimeout(function () {
            Assert.deepEqual(node.sent(0).payload, {
                mocked: 'getSysInfo',
                host: 'localhost2',
            });
            Assert.strictEqual(node.sent(0).topic, 'SysInfo');
            node.emit('close');
            done();
        }, 10);
    });
    it('should handle errors', function (done) {
        const node = NewNode({ host: 'localhost' });
        node.emit('input', { payload: 'wibble' });
        setTimeout(function () {
            Assert.isNotNull(node.error(0));
            node.emit('close');
            done();
        }, 10);
    });
    it('should handle unconfigured host errors', function (done) {
        const node = NewNode({});
        node.emit('input', { payload: 'wibble' });
        setTimeout(function () {
            Assert.deepEqual(
                node.error(0).message,
                'You must set config.host or msg.hs100_address'
            );
            node.emit('close');
            done();
        }, 10);
    });
});

function NewNode(config) {
    return Mock(NodeRedModule, config, null, function (module, node) {
        module.newHs100Client = function () {
            return {
                getPlug: function (config) {
                    const plugConfig = config;
                    const plug = {};
                    _.values(module.supportedActuations).forEach(function (method) {
                        plug[method] = function () {
                            return new Promise(function (resolve, reject) {
                                resolve({ mocked: method, host: plugConfig.host });
                            });
                        };
                    });
                    plug.setPowerState = function (state) {
                        return new Promise(function (resolve, reject) {
                            resolve({ mocked: state, host: plugConfig.host });
                        });
                    };

                    return plug;
                },
                socket: { close: function () {} },
            };
        };
    });
}
