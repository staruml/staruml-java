/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, staruml, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = staruml.getModule("spec/SpecRunnerUtils"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        ExtensionUtils  = staruml.getModule("utils/ExtensionUtils");

    require("grammar/java7");

    describe("Java Parser", function () {

        it("can parse CompilationUnit", function () {
            var parseComplete,
                ast;

            runs(function () {
                var path = ExtensionUtils.getModulePath(module) + "unittest-files/ClassTest.java";
                var file = FileSystem.getFileForPath(path);
                file.read({}, function (err, data, stat) {
                    if (!err) {
                        ast = java7.parse(data);
                        parseComplete = true;
                        console.log(ast);
                    }
                });
            });

            waitsFor(
                function () { return parseComplete; },
                "Waiting for parsing",
                3000
            );

            runs(function () {
                expect(ast.node).toEqual("CompilationUnit");
                expect(ast["package"].node).toEqual("Package");
                expect(ast["package"].qualifiedName.node).toEqual("QualifiedName");
                expect(ast["package"].qualifiedName.name).toEqual("com.mycompany.test");

                // TODO: Test import statements.

            });
        });

        it("can parse Class", function () {
            var parseComplete,
                ast;

            runs(function () {
                var path = ExtensionUtils.getModulePath(module) + "unittest-files/ClassTest.java";
                var file = FileSystem.getFileForPath(path);
                file.read({}, function (err, data, stat) {
                    if (!err) {
                        ast = java7.parse(data);
                        parseComplete = true;
                    }
                });
            });

            waitsFor(
                function () { return parseComplete; },
                "Waiting for parsing",
                3000
            );

            runs(function () {

            });
        });

        it("can parse Fields", function () {

        });

        it("can parse Operations", function () {

        });

        it("can parse Interface", function () {

        });

        it("can parse Enum", function () {

        });

        it("can parse AnnotationType", function () {

        });

    });
});
