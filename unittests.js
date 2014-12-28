/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, _, it, xit, expect, beforeFirst, afterLast, spyOn, beforeEach, afterEach, waitsFor, runs, $, type, app, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var Repository,       // loaded from app.test
        ProjectManager,   // loaded from app.test
        CommandManager,   // loaded from app.test
        Commands,         // loaded from app.test
        Dialogs,          // loaded from app.test
        FileSystem      = app.getModule("filesystem/FileSystem"),
        SpecRunnerUtils = app.getModule("spec/SpecRunnerUtils"),
        FileUtils       = app.getModule("file/FileUtils"),
        ExtensionUtils  = app.getModule("utils/ExtensionUtils"),
        UML             = app.getModule("uml/UML");

    require("grammar/java7");

    describe("Java", function () {

        describe("Java Parsing", function () {

            function parse(fileName) {
                var result = new $.Deferred();
                var path = ExtensionUtils.getModulePath(module) + "unittest-files/parse/" + fileName;
                var file = FileSystem.getFileForPath(path);
                file.read({}, function (err, data, stat) {
                    if (!err) {
                        result.resolve(java7.parse(data));
                    } else {
                        result.reject(err);
                    }
                });
                return result.promise();
            }

            it("can parse CompilationUnit", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    // package com.mycompany.test;
                    expect(ast.node).toEqual("CompilationUnit");
                    expect(ast["package"].node).toEqual("Package");
                    expect(ast["package"].qualifiedName.node).toEqual("QualifiedName");
                    expect(ast["package"].qualifiedName.name).toEqual("com.mycompany.test");
                });
            });

            it("can parse Import", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _class = ast.types[0];

                    // public class ClassTest
                    expect(_class.node).toEqual("Class");
                    expect(_class.name).toEqual("ClassTest");
                    expect(_class.modifiers[0]).toEqual("public");

                    // extends GenericClassTest
                    expect(_class["extends"].node).toEqual("Type");
                    expect(_class["extends"].qualifiedName.name).toEqual("GenericClassTest");

                    // implements com.mycompany.test.InterfaceTest, java.lang.Runnable
                    expect(_class["implements"].length).toEqual(2);
                    expect(_class["implements"][0].node).toEqual("Type");
                    expect(_class["implements"][0].qualifiedName.name).toEqual("com.mycompany.test.InterfaceTest");
                    expect(_class["implements"][1].node).toEqual("Type");
                    expect(_class["implements"][1].qualifiedName.name).toEqual("java.lang.Runnable");

                });
            });

            it("can parse Fields", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

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
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _op = ast.types[0].body[15];
                    // abstract int test3() {}
                    expect(_.contains(_op.modifiers, "abstract")).toBe(true);
                });
            });

            it("can parse Annotated Method", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _op = ast.types[0].body[16];
                    // @Deprecated
                    // @SuppressWarnings({ "unchecked", "deprecation" })
                    // @MethodInfo(author = "Pankaj", comments = "Main method", date = "Nov 17 2012", revision = 10)
                    // void annotatedMethod() {}
                    expect(_op.annotations.length).toEqual(3);
                    expect(_op.annotations[0].node).toEqual("Annotation");
                    expect(_op.annotations[0].qualifiedName.name).toEqual("Deprecated");

                    expect(_op.annotations[1].node).toEqual("Annotation");
                    expect(_op.annotations[1].qualifiedName.name).toEqual("SuppressWarnings");
                    expect(_op.annotations[1].valueList.length).toEqual(1);
                    expect(Array.isArray(_op.annotations[1].valueList[0])).toBe(true);
                    expect(_op.annotations[1].valueList[0].length).toEqual(2);
                    expect(_op.annotations[1].valueList[0][0]).toEqual("\"unchecked\"");
                    expect(_op.annotations[1].valueList[0][1]).toEqual("\"deprecation\"");

                    expect(_op.annotations[2].node).toEqual("Annotation");
                    expect(_op.annotations[2].qualifiedName.name).toEqual("MethodInfo");
                    expect(_op.annotations[2].valuePairs.length).toEqual(4);
                    expect(_op.annotations[2].valuePairs[0].node).toEqual("ValuePair");
                    expect(_op.annotations[2].valuePairs[0].name).toEqual("author");
                    expect(_op.annotations[2].valuePairs[0].value).toEqual("\"Pankaj\"");
                    expect(_op.annotations[2].valuePairs[1].node).toEqual("ValuePair");
                    expect(_op.annotations[2].valuePairs[1].name).toEqual("comments");
                    expect(_op.annotations[2].valuePairs[1].value).toEqual("\"Main method\"");
                    expect(_op.annotations[2].valuePairs[2].node).toEqual("ValuePair");
                    expect(_op.annotations[2].valuePairs[2].name).toEqual("date");
                    expect(_op.annotations[2].valuePairs[2].value).toEqual("\"Nov 17 2012\"");
                    expect(_op.annotations[2].valuePairs[3].node).toEqual("ValuePair");
                    expect(_op.annotations[2].valuePairs[3].name).toEqual("revision");
                    expect(_op.annotations[2].valuePairs[3].value).toEqual("10");
                });
            });

            it("can parse Inner Class", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _innerClass = ast.types[0].body[17];
                    // static class InnerClass {}
                    expect(_innerClass.node).toEqual("Class");
                    expect(_innerClass.name).toEqual("InnerClass");
                    expect(_innerClass.modifiers[0]).toEqual("static");
                });
            });

            it("can parse Generic Class", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _class = ast.types[0];

                    // public class Vector<E, T>
                    expect(_class.node).toEqual("Class");
                    expect(_class.name).toEqual("GenericClassTest");
                    expect(_class.modifiers[0]).toEqual("public");
                    expect(_class.typeParameters.length).toEqual(2);
                    expect(_class.typeParameters[0].node).toEqual("TypeParameter");
                    expect(_class.typeParameters[0].name).toEqual("E");
                    expect(_class.typeParameters[1].name).toEqual("T");
                    expect(_class.typeParameters[1].type).toEqual("java.util.Collection");

                    // extends AbstractList<E>
                    expect(_class["extends"].node).toEqual("Type");
                    expect(_class["extends"].qualifiedName.name).toEqual("AbstractList");
                    expect(_class["extends"].qualifiedName.typeParameters[0].name).toEqual("E");

                    // implements List<E>, RandomAccess, Cloneable, java.io.Serializable
                    expect(_class["implements"].length).toEqual(4);
                    expect(_class["implements"][0].node).toEqual("Type");
                    expect(_class["implements"][0].qualifiedName.name).toEqual("List");
                    expect(_class["implements"][0].qualifiedName.typeParameters[0].name).toEqual("E");
                });
            });

            it("can parse Field of Generic Class", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _class = ast.types[0];

                    // private OrderedPair<String, Box<Integer>> p = new OrderedPair<>("primes", new Box<Integer>());
                    expect(_class.body[0].node).toEqual("Field");
                    expect(_class.body[0].modifiers[0]).toEqual("private");
                    expect(_class.body[0].type.node).toEqual("Type");
                    expect(_class.body[0].type.qualifiedName.name).toEqual("OrderedPair");
                    expect(_class.body[0].type.qualifiedName.typeParameters[0].name).toEqual("String");
                    expect(_class.body[0].type.qualifiedName.typeParameters[1].name).toEqual("Box<Integer>");
                    expect(_class.body[0].variables.length).toEqual(1);
                    expect(_class.body[0].variables[0].node).toEqual("Variable");
                    expect(_class.body[0].variables[0].name).toEqual("p");
                });
            });

            it("can parse Methods of Generic Class", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _op;

                    // Constructor
                    // public Vector(Collection<? extends E> c) {}
                    _op = ast.types[0].body[2];
                    expect(_op.node).toEqual("Constructor");
                    expect(_op.name).toEqual("GenericClassTest");
                    expect(_op.modifiers[0]).toEqual("public");
                    expect(_op.parameters[0].type.qualifiedName.name).toEqual("Collection");
                    expect(_op.parameters[0].type.qualifiedName.typeParameters[0].name).toEqual("?");
                    expect(_op.parameters[0].type.qualifiedName.typeParameters[0].type).toEqual("E");
                    expect(_op.parameters[0].variable.name).toEqual("c");

                    // public Enumeration<E> elements() {}
                    _op = ast.types[0].body[3];
                    expect(_op.name).toEqual("elements");
                    expect(_op.type.qualifiedName.name).toEqual("Enumeration");
                    expect(_op.type.qualifiedName.typeParameters[0].name).toEqual("E");
                });
            });

            it("can parse Interface", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _interface = ast.types[0];

                    // public interface InterfaceTest
                    expect(_interface.node).toEqual("Interface");
                    expect(_interface.name).toEqual("InterfaceTest");
                    expect(_interface.modifiers[0]).toEqual("public");

                    // extends java.lang.Runnable, java.lang.Serializable
                    expect(_interface["extends"].length).toEqual(2);
                    expect(_interface["extends"][0].node).toEqual("Type");
                    expect(_interface["extends"][0].qualifiedName.name).toEqual("java.lang.Runnable");
                    expect(_interface["extends"][1].node).toEqual("Type");
                    expect(_interface["extends"][1].qualifiedName.name).toEqual("java.lang.Serializable");
                });
            });

            it("can parse Field of Interface", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _class = ast.types[0];

                    // public static final int interfaceStaticField = 100;
                    expect(_class.body[0].node).toEqual("Field");
                    expect(_.contains(_class.body[0].modifiers, "public")).toBe(true);
                    expect(_.contains(_class.body[0].modifiers, "static")).toBe(true);
                    expect(_.contains(_class.body[0].modifiers, "final")).toBe(true);
                    expect(_class.body[0].type.node).toEqual("Type");
                    expect(_class.body[0].type.qualifiedName.name).toEqual("int");
                    expect(_class.body[0].variables.length).toEqual(1);
                    expect(_class.body[0].variables[0].node).toEqual("Variable");
                    expect(_class.body[0].variables[0].name).toEqual("interfaceStaticField");
                    expect(_class.body[0].variables[0].initializer).toEqual("100");
                });
            });

            it("can parse Operation of Interface", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    // public CompositeContext createContext(ColorModel srcColorModel, ColorModel dstColorModel);
                    var _op = ast.types[0].body[1];
                    expect(_op.node).toEqual("Method");
                    expect(_op.name).toEqual("createContext");
                    expect(_op.modifiers[0]).toEqual("public");
                    expect(_op.type.qualifiedName.name).toEqual("CompositeContext");
                    expect(_op.parameters[0].type.qualifiedName.name).toEqual("ColorModel");
                    expect(_op.parameters[0].variable.name).toEqual("srcColorModel");
                    expect(_op.parameters[1].type.qualifiedName.name).toEqual("ColorModel");
                    expect(_op.parameters[1].variable.name).toEqual("dstColorModel");
                });
            });


            it("can parse Enum", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("EnumTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _enum = ast.types[0];

                    // public enum RetryType
                    expect(_enum.node).toEqual("Enum");
                    expect(_enum.name).toEqual("RetryType");
                    expect(_enum.modifiers[0]).toEqual("public");

                    // NONE( false ),
                    expect(_enum.body[0].node).toEqual("EnumConstant");
                    expect(_enum.body[0].name).toEqual("NONE");
                    expect(_enum.body[0]["arguments"][0]).toEqual("false");

                    // BEFORE_RESPONSE( true ),
                    expect(_enum.body[1].node).toEqual("EnumConstant");
                    expect(_enum.body[1].name).toEqual("BEFORE_RESPONSE");
                    expect(_enum.body[1]["arguments"][0]).toEqual("true");

                    // AFTER_RESPONSE( true ) ;
                    expect(_enum.body[2].node).toEqual("EnumConstant");
                    expect(_enum.body[2].name).toEqual("AFTER_RESPONSE");
                    expect(_enum.body[2]["arguments"][0]).toEqual("true");
                });
            });

            it("can parse AnnotationType", function () {
                var ast, promise;

                runs(function () {
                    promise = parse("AnnotationTypeTest.java").done(function (_ast) { ast = _ast; });
                    waitsForDone(promise, "Parsing...", 3000);
                });

                runs(function () {
                    var _annotationType = ast.types[0];

                    // @interface ClassPreamble
                    expect(_annotationType.node).toEqual("AnnotationType");
                    expect(_annotationType.name).toEqual("ClassPreamble");

                    // int _annotationConstant;
                    expect(_annotationType.body[0].node).toEqual("Field");
                    expect(_annotationType.body[0].type.qualifiedName.name).toEqual("int");
                    expect(_annotationType.body[0].variables[0].name).toEqual("_annotationConstant");

                    // String author();
                    expect(_annotationType.body[1].node).toEqual("Method");
                    expect(_annotationType.body[1].name).toEqual("author");
                    expect(_annotationType.body[1].type.qualifiedName.name).toEqual("String");

                    // String lastModified() default "N/A";
                    expect(_annotationType.body[2].node).toEqual("Method");
                    expect(_annotationType.body[2].name).toEqual("lastModified");
                    expect(_annotationType.body[2].type.qualifiedName.name).toEqual("String");
                    expect(_annotationType.body[2].defaultValue).toEqual("\"N/A\"");
                });
            });

        });

        describe("Java Code Generation", function () {
            // TODO: Test Cases for Code Generation
        });

        describe("Java Reverse Engineering", function () {
            var testPath = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files",
                testWindow;

            beforeFirst(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from app.test
                    window.type         = testWindow.type;
                    Repository          = testWindow.app.test.Repository;
                    CommandManager      = testWindow.app.test.CommandManager;
                    Commands            = testWindow.app.test.Commands;
                    FileSystem          = testWindow.app.test.FileSystem;
                    Dialogs             = testWindow.app.test.Dialogs;

                    // Reverse Java Codes in "/unittest-files/reverse/*.java"
                    var filePath;

                    runs(function () {
                        CommandManager.execute(Commands.FILE_NEW);
                    });

                    runs(function () {
                        // Select a folder in Open Dialog
                        filePath = testPath + "/reverse";
                        spyOn(FileSystem, 'showOpenDialog').andCallFake(function (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
                            callback(undefined, [filePath]);
                        });

                        var promise = CommandManager.execute("java.reverse");
                        waitsForDone(promise, "java.reverse", 5000); // java reverse may takes long time.
                    });

                });
            });

            afterLast(function () {

                // Close Project after Java Reverse Tests
                runs(function () {
                    // Click "Don't Save" Button
                    spyOn(Dialogs, "showSaveConfirmDialog").andCallFake(function (filename) {
                        return { done: function (callback) { callback(Dialogs.DIALOG_BTN_DONTSAVE); } };
                    });

                    var promise = CommandManager.execute(Commands.FILE_CLOSE);
                    waitsForDone(promise);
                });

                runs(function () {
                    testWindow          = null;
                    Repository          = null;
                    CommandManager      = null;
                    Commands            = null;
                    FileSystem          = null;
                    Dialogs             = null;
                    SpecRunnerUtils.closeTestWindow();
                });

            });

            beforeEach(function () {
            });

            afterEach(function () {
            });

            /** Find an element by name in Repository */
            function find(name, type) {
                return Repository.find(function (e) {
                    if (type) {
                        return (e.name === name) && (e instanceof type);
                    } else {
                        return e.name === name;
                    }
                });
            }

            /** Expect a file to exist (failing test if not) and then delete it */
            function expectAndDelete(fullPath) {
                runs(function () {
                    var promise = SpecRunnerUtils.resolveNativeFileSystemPath(fullPath);
                    waitsForDone(promise, "Verify file exists: " + fullPath);
                });
                runs(function () {
                    var promise = SpecRunnerUtils.deletePath(fullPath);
                    waitsForDone(promise, "Remove testfile " + fullPath, 5000);
                });
            }

            it("can reverse Java Package", function () {
                runs(function () {
                    var _package = find("packagetest");
                    expect(_package instanceof type.UMLPackage).toBe(true);
                    expect(_package._parent.name).toEqual("mycompany");
                    expect(_package._parent._parent.name).toEqual("com");
                });
            });

            it("can reverse Java Class", function () {
                runs(function () {
                    var _class = find("ClassTest");
                    expect(_class instanceof type.UMLClass).toBe(true);
                });
            });

            it("can reverse Java Class Access Modifiers", function () {
                runs(function () {
                    var _publicClass    = find("PublicClassTest"),
                        _protectedClass = find("ProtectedClassTest"),
                        _privateClass   = find("PrivateClassTest"),
                        _packageClass   = find("PackageClassTest");
                    expect(_publicClass.visibility).toEqual(UML.VK_PUBLIC);
                    expect(_protectedClass.visibility).toEqual(UML.VK_PROTECTED);
                    expect(_privateClass.visibility).toEqual(UML.VK_PRIVATE);
                    expect(_packageClass.visibility).toEqual(UML.VK_PACKAGE);
                });
            });

            it("can reverse Java Final Class", function () {
                runs(function () {
                    var _class = find("ClassFinalTest");
                    expect(_class.isFinalSpecialization).toBe(true);
                });
            });

            it("can reverse Java Abstract Class", function () {
                runs(function () {
                    var _class = find("ClassAbstractTest");
                    expect(_class.isAbstract).toBe(true);
                });
            });

            it("can reverse Java Generic Class", function () {
                runs(function () {
                    var _class = find("ClassGenericTest");
                    expect(_class.templateParameters.length).toEqual(2);
                    expect(_class.templateParameters[0].name).toEqual("E");
                    expect(_class.templateParameters[1].name).toEqual("T");
                    expect(_class.templateParameters[1].parameterType).toEqual("java.util.Collection");
                });
            });

            it("can reverse Java Class Extends", function () {
                runs(function () {
                    var _class1 = find("ClassExtendsTest"),
                        _class2 = find("ClassTest"),
                        _generalizations = Repository.getRelationshipsOf(_class1, function (rel) { return rel instanceof type.UMLGeneralization; });
                    expect(_generalizations.length).toEqual(1);
                    expect(_generalizations[0].source).toEqual(_class1);
                    expect(_generalizations[0].target).toEqual(_class2);
                });
            });

            it("can reverse Java Class Implements", function () {
                runs(function () {
                    var _class = find("ClassImplementsTest"),
                        _interface = find("InterfaceTest"),
                        _realizations = Repository.getRelationshipsOf(_class, function (rel) { return rel instanceof type.UMLInterfaceRealization; });
                    expect(_realizations.length).toEqual(1);
                    expect(_realizations[0].source).toEqual(_class);
                    expect(_realizations[0].target).toEqual(_interface);
                });
            });

            it("can reverse Java Class Constructor", function () {
                runs(function () {
                    expect(find("ClassConstructorTest", type.UMLOperation) instanceof type.UMLOperation).toBe(true);
                    expect(find("ClassConstructorTest").stereotype).toEqual("constructor");
                });
            });

            it("can reverse Java Interface", function () {
                runs(function () {
                    expect(find("InterfaceTest") instanceof type.UMLInterface).toBe(true);
                });
            });

            it("can reverse Java Interface Extends", function () {
                runs(function () {
                    var _interface1 = find("InterfaceExtendsTest"),
                        _interface2 = find("InterfaceTest"),
                        _generalizations = Repository.getRelationshipsOf(_interface1, function (rel) { return rel instanceof type.UMLGeneralization; });
                    expect(_generalizations.length).toEqual(1);
                    expect(_generalizations[0].source).toEqual(_interface1);
                    expect(_generalizations[0].target).toEqual(_interface2);
                });
            });

            it("can reverse Java Field Access Modifiers", function () {
                runs(function () {
                    expect(find("publicField").visibility).toEqual(UML.VK_PUBLIC);
                    expect(find("protectedField").visibility).toEqual(UML.VK_PROTECTED);
                    expect(find("privateField").visibility).toEqual(UML.VK_PRIVATE);
                    expect(find("packageField").visibility).toEqual(UML.VK_PACKAGE);
                });
            });

            it("can reverse Java Field Types", function () {
                runs(function () {
                    expect(find("intField").type).toEqual("int");
                    expect(find("floatField").type).toEqual("float");
                    expect(find("longField").type).toEqual("long");
                    expect(find("doubleField").type).toEqual("double");
                    expect(find("stringField").type).toEqual("String");
                });
            });

            it("can reverse Java Field Array Types", function () {
                runs(function () {
                    expect(find("stringArrayField").type).toEqual("String");
                    expect(find("stringArrayField").multiplicity).toEqual("*");
                    expect(find("int2DArrayField").type).toEqual("int");
                    expect(find("int2DArrayField").multiplicity).toEqual("*,*");
                });
            });

            it("can reverse Java Field Collection Types", function () {
                runs(function () {
                    expect(find("stringListField") instanceof type.UMLAttribute).toBe(true);
                    expect(find("stringListField").type).toEqual("String");
                    expect(find("stringListField").multiplicity).toEqual("*");
                    expect(find("stringListField").tags[0].name).toEqual("collection");
                    expect(find("stringListField").tags[0].value).toEqual("java.util.List");

                    expect(find("classTestListField") instanceof type.UMLAssociationEnd).toBe(true);
                    expect(find("classTestListField").reference).toEqual(find("ClassTest"));
                    expect(find("classTestListField").multiplicity).toEqual("*");
                    expect(find("classTestListField").tags[0].name).toEqual("collection");
                    expect(find("classTestListField").tags[0].value).toEqual("ArrayList");
                });
            });

            it("can reverse Java Multiple Field Variables", function () {
                runs(function () {
                    expect(find("field1") instanceof type.UMLAttribute).toBe(true);
                    expect(find("field2") instanceof type.UMLAttribute).toBe(true);
                    expect(find("field3") instanceof type.UMLAttribute).toBe(true);
                    expect(find("field4") instanceof type.UMLAttribute).toBe(true);
                });
            });

            it("can reverse Java Field Modifiers", function () {
                runs(function () {
                    expect(find("staticField").isStatic).toEqual(true);
                    expect(find("finalField").isLeaf).toEqual(true);
                    expect(find("finalField").isReadOnly).toEqual(true);
                    expect(find("transientField").tags[0].name).toEqual("transient");
                    expect(find("transientField").tags[0].checked).toEqual(true);
                    expect(find("volatileField").tags[0].name).toEqual("volatile");
                    expect(find("volatileField").tags[0].checked).toEqual(true);
                });
            });

            it("can reverse Java Field Initializers", function () {
                runs(function () {
                    expect(find("intFieldInitializer").defaultValue).toEqual("10");
                    expect(find("stringFieldInitializer").defaultValue).toEqual('"String Literal"');
                    expect(find("charFieldInitializer").defaultValue).toEqual("'c'");
                    expect(find("booleanFieldInitializer").defaultValue).toEqual("true");
                    expect(find("objectFieldInitializer").defaultValue).toEqual("null");
                });
            });

            it("can reverse Java Method", function () {
                runs(function () {
                    expect(find("methodTest") instanceof type.UMLOperation).toBe(true);
                });
            });

            it("can reverse Java Method Parameters", function () {
                runs(function () {
                    expect(find("paramTestMethod") instanceof type.UMLOperation).toBe(true);
                    expect(find("paramTestMethod").getNonReturnParameters().length).toEqual(3);
                    expect(find("stringParam") instanceof type.UMLParameter).toBe(true);
                    expect(find("stringParam").type).toEqual("String");
                    expect(find("intParam") instanceof type.UMLParameter).toBe(true);
                    expect(find("intParam").type).toEqual("int");
                    expect(find("classTestParam") instanceof type.UMLParameter).toBe(true);
                    expect(find("classTestParam").type).toEqual(find("ClassTest"));
                });
            });

            it("can reverse Java Method Return Types", function () {
                runs(function () {
                    expect(find("intReturnMethod").getReturnParameter().type).toEqual("int");
                    expect(find("classTestReturnMethod").getReturnParameter().type).toEqual(find("ClassTest"));
                    expect(find("enumerationReturnMethod").getReturnParameter().type).toEqual(find("Enumeration"));
                });
            });

            it("can reverse Java Method Modifiers", function () {
                runs(function () {
                    expect(find("staticMethod").isStatic).toEqual(true);
                    expect(find("abstractMethod").isAbstract).toEqual(true);
                    expect(find("finalMethod").isLeaf).toEqual(true);
                    expect(find("synchronizedMethod").concurrency).toEqual(UML.CCK_CONCURRENT);
                    expect(find("nativeMethod").tags[0].name).toEqual("native");
                    expect(find("nativeMethod").tags[0].checked).toEqual(true);
                    expect(find("strictfpMethod").tags[0].name).toEqual("strictfp");
                    expect(find("strictfpMethod").tags[0].checked).toEqual(true);
                });
            });

            it("can reverse Java Generic Method", function () {
                runs(function () {
                    expect(find("genericMethod") instanceof type.UMLOperation).toBe(true);
                    expect(find("genericMethod").templateParameters[0].parameterType).toEqual("Product");
                    expect(find("genericMethod").templateParameters[0].name).toEqual("T");
                    expect(find("genericMethodListParam") instanceof type.UMLParameter).toBe(true);
                    expect(find("genericMethodListParam").type).toEqual(find("ArrayList"));
                });
            });

            it("can reverse Java Method Throws", function () {
                runs(function () {
                    expect(find("throwsTestMethod") instanceof type.UMLOperation).toBe(true);
                    expect(find("throwsTestMethod").raisedExceptions[0]).toEqual(find("Exception"));
                });
            });

            it("can reverse Java Enum", function () {
                runs(function () {
                    expect(find("EnumTest", type.UMLEnumeration) instanceof type.UMLEnumeration).toBe(true);
                });
            });

            it("can reverse Java Enum Constants", function () {
                runs(function () {
                    expect(find("EnumTest", type.UMLEnumeration).literals.length).toEqual(3);
                    expect(find("ENUM_CONSTANT1") instanceof type.UMLEnumerationLiteral).toBe(true);
                    expect(find("ENUM_CONSTANT2") instanceof type.UMLEnumerationLiteral).toBe(true);
                    expect(find("ENUM_CONSTANT3") instanceof type.UMLEnumerationLiteral).toBe(true);
                });
            });

            it("can reverse Java Enum Field", function () {
                runs(function () {
                    expect(find("enumField") instanceof type.UMLAttribute).toBe(true);
                });
            });

            it("can reverse Java Enum Method", function () {
                runs(function () {
                    expect(find("enumMethod") instanceof type.UMLOperation).toBe(true);
                });
            });

            it("can reverse Java Annotation Type", function () {
                runs(function () {
                    expect(find("AnnotationTypeTest") instanceof type.UMLClass).toBe(true);
                    expect(find("AnnotationTypeTest").stereotype).toEqual("annotationType");
                });
            });

            it("can reverse Java Annotation Type Elements", function () {
                runs(function () {
                    expect(find("annotationTypeElement") instanceof type.UMLOperation).toBe(true);
                    expect(find("annotationTypeElement").getReturnParameter().type).toEqual("String");
                    expect(find("annotationTypeElementWithDefault") instanceof type.UMLOperation).toBe(true);
                    expect(find("annotationTypeElementWithDefault").getReturnParameter().type).toEqual("String");
                    expect(find("annotationTypeElementWithDefault").tags[0].name).toEqual("default");
                    expect(find("annotationTypeElementWithDefault").tags[0].value).toEqual('"N/A"');
                });
            });

            it("can reverse JavaDoc for Class", function () {
                runs(function () {
                    var _doc = find("JavaDocClassTest").documentation,
                        _lines = _doc.split("\n");
                    expect(_lines.length).toEqual(3);
                    expect(_lines[0]).toEqual("This is first line of JavaDoc documentation.");
                    expect(_lines[1]).toEqual("This is second line of JavaDoc documentation.");
                    expect(_lines[2]).toEqual("@author Minkyu Lee");
                });
            });

        });

    });

});
