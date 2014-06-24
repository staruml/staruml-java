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
/*global define, describe, _, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, staruml, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = staruml.getModule("spec/SpecRunnerUtils"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        ExtensionUtils  = staruml.getModule("utils/ExtensionUtils");

    require("grammar/java7");

    describe("Java Parser", function () {

        var parseComplete = false,
            ast;

        beforeEach(function () {
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
        });

        afterEach(function () {
            parseComplete = false;
            ast = null;
        });

        it("can parse CompilationUnit", function () {
            runs(function () {
                // package com.mycompany.test;
                expect(ast.node).toEqual("CompilationUnit");
                expect(ast["package"].node).toEqual("Package");
                expect(ast["package"].qualifiedName.node).toEqual("QualifiedName");
                expect(ast["package"].qualifiedName.name).toEqual("com.mycompany.test");
            });
        });

        it("can parse Import", function () {
            runs(function () {
                expect(ast.imports.length).toEqual(4);

                // import java.util.ArrayList;
                expect(ast.imports[0].node).toEqual("Import");
                expect(ast.imports[0].qualifiedName.name).toEqual("java.util.ArrayList");

                // import java.lang.*;
                expect(ast.imports[1].node).toEqual("Import");
                expect(ast.imports[1].qualifiedName.name).toEqual("java.lang");
                expect(ast.imports[1].wildcard).toEqual(true);

                // import static java.awt.Color;
                expect(ast.imports[2].node).toEqual("Import");
                expect(ast.imports[2].qualifiedName.name).toEqual("java.awt.Color");
                expect(ast.imports[2].isStatic).toEqual(true);

                // import static java.lang.Math.*;
                expect(ast.imports[3].node).toEqual("Import");
                expect(ast.imports[3].qualifiedName.name).toEqual("java.lang.Math");
                expect(ast.imports[3].wildcard).toEqual(true);
                expect(ast.imports[3].isStatic).toEqual(true);
            });
        });

        it("can parse Class", function () {
            runs(function () {
                var _class = ast.types[0];

                // public class ClassTest
                expect(_class.node).toEqual("Class");
                expect(_class.name).toEqual("ClassTest");
                expect(_class.modifiers[0]).toEqual("public");

                // extends java.util.Vector ...
                expect(_class["extends"].node).toEqual("Type");
                expect(_class["extends"].qualifiedName.name).toEqual("java.util.Vector");

                // implements java.lang.Runnable, java.lang.Serializable
                expect(_class["implements"].length).toEqual(2);
                expect(_class["implements"][0].node).toEqual("Type");
                expect(_class["implements"][0].qualifiedName.name).toEqual("java.lang.Runnable");
                expect(_class["implements"][1].node).toEqual("Type");
                expect(_class["implements"][1].qualifiedName.name).toEqual("java.lang.Serializable");

            });
        });

        it("can parse Fields", function () {
            runs(function () {
                var _class = ast.types[0];

                // private int _privateField;
                expect(_class.body[0].node).toEqual("Field");
                expect(_class.body[0].modifiers[0]).toEqual("private");
                expect(_class.body[0].type.node).toEqual("Type");
                expect(_class.body[0].type.qualifiedName.name).toEqual("int");
                expect(_class.body[0].variables.length).toEqual(1);
                expect(_class.body[0].variables[0].node).toEqual("Variable");
                expect(_class.body[0].variables[0].name).toEqual("_privateField");

                // protected int _protectedField;
                expect(_class.body[1].node).toEqual("Field");
                expect(_class.body[1].modifiers[0]).toEqual("protected");

                // public int _publicField;
                expect(_class.body[2].node).toEqual("Field");
                expect(_class.body[2].modifiers[0]).toEqual("public");

                // int _packageField;  -- menas 'package' visibility
                expect(_class.body[3].node).toEqual("Field");
                expect(_class.body[3].modifiers).not.toBeDefined();
            });
        });

        it("can parse Array Fields", function () {
            runs(function () {
                var _class = ast.types[0];
                // String[] StringArray;
                expect(_class.body[4].node).toEqual("Field");
                expect(_class.body[4].type.arrayDimension.length).toEqual(1);
                expect(_class.body[4].type.qualifiedName.name).toEqual("String");
                expect(_class.body[4].variables[0].name).toEqual("StringArray");

                // int[][] int2DimentionalArray;
                expect(_class.body[5].node).toEqual("Field");
                expect(_class.body[5].type.arrayDimension.length).toEqual(2);
            });
        });

        it("can parse Multiple Variable Fields", function () {
            runs(function () {
                var _class = ast.types[0];
                // int a, b, c, d;
                expect(_class.body[6].node).toEqual("Field");
                expect(_class.body[6].variables.length).toEqual(4);
                expect(_class.body[6].variables[0].name).toEqual("a");
                expect(_class.body[6].variables[1].name).toEqual("b");
                expect(_class.body[6].variables[2].name).toEqual("c");
                expect(_class.body[6].variables[3].name).toEqual("d");
            });
        });

        it("can parse Field Modifiers", function () {
            runs(function () {
                var _class = ast.types[0];
                // static final transient volatile int _field;
                expect(_class.body[7].node).toEqual("Field");
                expect(_class.body[7].modifiers.length).toEqual(4);
                expect(_.contains(_class.body[7].modifiers, "static")).toBe(true);
                expect(_.contains(_class.body[7].modifiers, "final")).toBe(true);
                expect(_.contains(_class.body[7].modifiers, "transient")).toBe(true);
                expect(_.contains(_class.body[7].modifiers, "volatile")).toBe(true);
            });
        });

        it("can parse Field Initializer", function () {
            runs(function () {
                var _class = ast.types[0];
                // int _fieldInt = 10;
                expect(_class.body[8].variables[0].initializer).toEqual("10");

                // String _fieldString = "String Literal";
                expect(_class.body[9].variables[0].initializer).toEqual('"String Literal"');

                // char _fieldChar = 'c';
                expect(_class.body[10].variables[0].initializer).toEqual("'c'");

                // boolean _fieldBoolean = true;
                expect(_class.body[11].variables[0].initializer).toEqual("true");

                // Object _fieldNull = null;
                expect(_class.body[12].variables[0].initializer).toEqual("null");
            });
        });


        it("can parse Method", function () {
            runs(function () {
                var _op = ast.types[0].body[13];

                // public void test(int arg1, final String arg2) throws IllegalAccess, java.lang.Exception {}
                expect(_op.node).toEqual("Method");
                expect(_op.modifiers[0]).toEqual("public");
                expect(_op.type.qualifiedName.name).toEqual("void");
                expect(_op.name).toEqual("test");

                expect(_op.parameters.length).toEqual(2);
                expect(_op.parameters[0].node).toEqual("Parameter");
                expect(_op.parameters[0].type.qualifiedName.name).toEqual("int");
                expect(_op.parameters[0].variable.name).toEqual("arg1");

                expect(_op.parameters[1].node).toEqual("Parameter");
                expect(_op.parameters[1].type.qualifiedName.name).toEqual("String");
                expect(_op.parameters[1].variable.name).toEqual("arg2");
                expect(_op.parameters[1].modifiers[0]).toEqual("final");

                expect(_op.throws.length).toEqual(2);
                expect(_op.throws[0].name).toEqual("IllegalAccess");
                expect(_op.throws[1].name).toEqual("java.lang.Exception");
            });
        });

        it("can parse Method Modifiers", function () {
            runs(function () {
                var _op = ast.types[0].body[14];

                // static final synchronized native strictfp void test2() {}
                expect(_.contains(_op.modifiers, "static")).toBe(true);
                expect(_.contains(_op.modifiers, "final")).toBe(true);
                expect(_.contains(_op.modifiers, "synchronized")).toBe(true);
                expect(_.contains(_op.modifiers, "native")).toBe(true);
                expect(_.contains(_op.modifiers, "strictfp")).toBe(true);
            });
        });

        it("can parse Abstract Method", function () {
            runs(function () {
                var _op = ast.types[0].body[15];
                // abstract int test3() {}
                expect(_.contains(_op.modifiers, "abstract")).toBe(true);
            });
        });

        it("can parse Annotated Method", function () {
            runs(function () {
                var _op = ast.types[0].body[16];
                // abstract int test3() {}
                // expect(_.contains(_op.modifiers, "abstract")).toBe(true);
            });
        });

        it("can parse Inner Class", function () {
            runs(function () {
                var _innerClass = ast.types[0].body[17];
                // static class InnerClass {}
                expect(_innerClass.node).toEqual("Class");
                expect(_innerClass.name).toEqual("InnerClass");
                expect(_innerClass.modifiers[0]).toEqual("static");

                console.log(JSON.stringify(ast, null, 4));
            });
        });

        it("can parse Annotations", function () {

        });


        it("can parse Interface", function () {

        });

        it("can parse Enum", function () {

        });

        it("can parse AnnotationType", function () {

        });

    });
});
