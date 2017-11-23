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

('use strict');
var assert = require('chai').assert;
var mock = require('node-red-contrib-mock-node');
var nodeRedModule = require('../index.js');
var _ = require('lodash');

describe('hs100', function() {
    this.timeout(60000);
    it('should turn a socket on', function(done) {
        var node = newNode();
        node.emit('input', { payload: 'on' });
        setTimeout(function() {
            assert.strictEqual(node.status().text, 'on');
            assert.strictEqual(node.status().shape, 'dot');
            node.emit('close');
            done();
        }, 10);
    });
    it('should turn a socket off', function(done) {
        var node = newNode();
        node.emit('input', { payload: 'off' });
        setTimeout(function() {
            assert.strictEqual(node.status().text, 'off');
            assert.strictEqual(node.status().shape, 'circle');
            node.emit('close');
            done();
        }, 10);
    });
    it('should emit consumption data', function(done) {
        var node = newNode();
        node.emit('input', { payload: 'consumption' });
        setTimeout(function() {
            assert.deepEqual(node.sent(0).payload, { mocked: 'getConsumption' });
            assert.strictEqual(node.sent(0).topic, 'consumption');
            node.emit('close');
            done();
        }, 10);
    });
    it('should emit sysinfo data', function(done) {
        var node = newNode();
        node.emit('input', { topic: 'SysInfo' });
        setTimeout(function() {
            assert.deepEqual(node.sent(0).payload, { mocked: 'getSysInfo' });
            assert.strictEqual(node.sent(0).topic, 'SysInfo');
            node.emit('close');
            done();
        }, 10);
    });
    it('should handle errors', function(done) {
        var node = newNode();
        node.emit('input', { payload: 'wibble' });
        setTimeout(function() {
            assert.isNotNull(node.error(0));
            node.emit('close');
            done();
        }, 10);
    });
});

function newNode() {
    return mock(nodeRedModule, {}, null, function(module, node) {
        module.newHs100Client = function() {
            return {
                getPlug: function() {
                    var plug = {};
                    _.values(module.supportedActuations).forEach(function(method) {
                        plug[method] = function() {
                            return new Promise(function(resolve, reject) {
                                resolve({ mocked: method });
                            });
                        };
                    });
                    plug.setPowerState = function(state) {
                        return new Promise(function(resolve, reject) {
                            resolve({ mocked: state });
                        });
                    };
                    return plug;
                },
                socket: { close: function() {} }
            };
        };
    });
}
