#!/usr/bin/env node

(function () {
    "use strict";

    var fs = require('fs')
        , path = require('path')
        , glob = require('glob')
        , Imagemin = require('imagemin');

    var rootDir = process.argv[2];

    function removeNotMinified(files) {
        for (var i in files) {
            if (!files.hasOwnProperty(i))continue;
            var notMinified = files[i].replace('.min', '');
            if (fs.existsSync(notMinified)) {
                fs.unlinkSync(notMinified);
                console.log('removed ' + notMinified);
            }
        }
    }

    if (rootDir) {

        // go through each of the platform directories that have been prepared
        var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);

        for (var x = 0; x < platforms.length; x++) {
            try {
                var platform = platforms[x].trim().toLowerCase();
                var wwwFolder;

                if (platform == 'android') {
                    wwwFolder = path.join('platforms', platform, 'assets', 'www');
                } else {
                    wwwFolder = path.join('platforms', platform, 'www');
                }

                var minFiles = glob.sync(path.join(wwwFolder, "/**/*.min.*"));
                removeNotMinified(minFiles);

                console.log("compressing images...");
                var imagemin = new Imagemin()
                    .src(path.join(wwwFolder, 'img/*.{gif,jpg,png,svg}'))
                    .use(Imagemin.optipng({optimizationLevel: 3}))
                    .use(Imagemin.svgo())
                    .use(Imagemin.jpegtran({progressive: true}));
                var ready;
                imagemin.run(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    ready = true;
                });
                while (ready === undefined) {
                    require('deasync').runLoopOnce();
                }

                console.log("replace links in index.html...");

                var indexFilePath = path.join(wwwFolder, 'index.html');
                var indexFile = fs.readFileSync(indexFilePath).toString();
                indexFile = indexFile
                    .replace("<!-- DEV -->","<!-- DEV")
                    .replace("<!-- /DEV -->","/DEV -->")
                    .replace("<!-- PROD","<!-- PROD -->")
                    .replace("/PROD -->","<!-- /PROD -->");
                fs.writeFileSync(indexFilePath, indexFile);
            } catch (e) {
                console.log(e);
            }
        }
    }
}());