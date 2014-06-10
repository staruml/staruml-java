/*
 * Copyright (c) 2014 MKLab. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var JavaParser = require("java7");
    var FileSystem = staruml.getModule("utils/FileSystem");

    var p1 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/java-testset/src-jdk/java/applet/Applet.java",
        p2 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/java-testset/src-jdk/java/awt/Canvas.java",
        p3 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/java-testset/src-jdk/java/util/Collection.java";

    var x = FileSystem.readFile(p3, "utf8", function (err, data) {
        console.log(err);
        console.log(data);
        var r = java7.parse(data);
        console.log(JSON.stringify(r, null, "\t"));
    });

});