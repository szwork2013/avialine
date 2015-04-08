#!/usr/bin/env node

/**
 * script that starts logcat for cordova
 */

(function () {
    "use strict";

    var exec = require('child_process').exec;

    exec("adb logcat CordovaLog:d *:S")
}());
