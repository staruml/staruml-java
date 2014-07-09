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
/*global define, describe, _, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, type, staruml, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = staruml.getModule("spec/SpecRunnerUtils"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        ExtensionUtils  = staruml.getModule("utils/ExtensionUtils"),
        Repository      = staruml.getModule("engine/Repository"),
        UML             = staruml.getModule("uml/UML");

    var JavaCodeGenerator   = require("JavaCodeGenerator"),
        JavaReverseEngineer = require("JavaReverseEngineer");

    require("grammar/java7");


    function parse(fileName) {
        var result = new $.Deferred();
        var path = ExtensionUtils.getModulePath(module) + "unittest-files/" + fileName;
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

    function reverse(partialOptions) {
        Repository.newProject();
        var options = {
            path: ExtensionUtils.getModulePath(module) + "unittest-files"
        };
        _.extend(options, partialOptions);
        var promise = JavaReverseEngineer.analyze(options);
        return promise;
    }

    function findOne(name, type) {
        return Repository.findAll(function (e) {
            if (type) {
                return e.name === name && e instanceof type;
            } else {
                return e.name === name;
            }
        })[0];
    }

    describe("Java Support", function () {

        // Specs for Java Source Code Parsing
        describe("Java Parsing", function () {

            it("can parse CompilationUnit", function () {
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

                runs(function () {
                    // package com.mycompany.test;
                    expect(ast.node).toEqual("CompilationUnit");
                    expect(ast["package"].node).toEqual("Package");
                    expect(ast["package"].qualifiedName.node).toEqual("QualifiedName");
                    expect(ast["package"].qualifiedName.name).toEqual("com.mycompany.test");
                });
            });

            it("can parse Import", function () {
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

                runs(function () {
                    var _op = ast.types[0].body[15];
                    // abstract int test3() {}
                    expect(_.contains(_op.modifiers, "abstract")).toBe(true);
                });
            });

            it("can parse Annotated Method", function () {
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("ClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

                runs(function () {
                    var _innerClass = ast.types[0].body[17];
                    // static class InnerClass {}
                    expect(_innerClass.node).toEqual("Class");
                    expect(_innerClass.name).toEqual("InnerClass");
                    expect(_innerClass.modifiers[0]).toEqual("static");
                });
            });

            it("can parse Generic Class", function () {
                var ast, promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("GenericClassTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("InterfaceTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("EnumTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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
                var ast, promise = parse("AnnotationTypeTest.java").done(function (_ast) { ast = _ast; });
                waitsForDone(promise, "Parsing...", 3000);

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


        // Specs for Java Code Generation
        describe("Java Code Generation", function () {

            // can generate UMLPackage to a folder
            // can generate UMLClass to a .java file
            // can generate UMLClass in UMLClassifier to Java Inner Class
            // can generate UMLTemplateParameter to Java Type Parameter
            // can generate UMLAttribute to Java Field
            // can generate UMLAssociation to Java Field
            // can generate UMLOperation to Java Method
            // can generate UMLInterface to Java Interface
            // can generate UMLEnumeration to Java Enum
            // can generate UMLClass with <<annotationType>> to Java AnnotationType
            // can generate documentation to Java Doc Comments
            // can generate ...

        });


        // Specs for Java Reverse Engineering
        describe("Java Reverse Engineering", function () {

            it("can reverse Java Package to UMLPackage", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model = Repository.getProject().ownedElements[0];
                    expect(_model.ownedElements[0].name).toEqual("com");
                    expect(_model.ownedElements[0].ownedElements[0].name).toEqual("mycompany");
                    expect(_model.ownedElements[0].ownedElements[0].ownedElements[0].name).toEqual("test");
                });
            });


            it("can reverse Java Class to UMLClass", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model = Repository.getProject().ownedElements[0],
                        _class = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassTest");

                    // public class ClassTest
                    expect(_class).toBeDefined();
                    expect(_class.visibility).toEqual(UML.VK_PUBLIC);
                });
            });

            it("can reverse Java Type Parameters to UMLTemplateParameter", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _class = findOne("GenericClassTest", type.UMLClass);
                    expect(_class.templateParameters.length).toEqual(2);
                    expect(_class.templateParameters[0].name).toEqual("E");
                    expect(_class.templateParameters[1].name).toEqual("T");
                    expect(_class.templateParameters[1].parameterType).toEqual("java.util.Collection");
                });
            });

            it("can reverse Java Fields to UMLAttributes", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model = Repository.getProject().ownedElements[0],
                        _class = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassTest");

                    // Total 16 Attributes
                    expect(_class.attributes.length).toEqual(16);

                    // Visibility
                    expect(_class.findByName("_privateField").visibility).toEqual(UML.VK_PRIVATE);
                    expect(_class.findByName("_protectedField").visibility).toEqual(UML.VK_PROTECTED);
                    expect(_class.findByName("_publicField").visibility).toEqual(UML.VK_PUBLIC);
                    expect(_class.findByName("_packageField").visibility).toEqual(UML.VK_PACKAGE);

                    // Arrays
                    expect(_class.findByName("StringArray").multiplicity).toEqual("*");
                    expect(_class.findByName("int2DimentionalArray").multiplicity).toEqual("*,*");

                    // Modifiers
                    expect(_class.findByName("_field").isStatic).toBe(true);
                    expect(_class.findByName("_field").isReadOnly).toBe(true);

                    // Initializers
                    expect(_class.findByName("_fieldInt").defaultValue).toBe("10");
                    expect(_class.findByName("_fieldString").defaultValue).toBe('"String Literal"');
                    expect(_class.findByName("_fieldChar").defaultValue).toBe("'c'");
                    expect(_class.findByName("_fieldBoolean").defaultValue).toBe("true");
                    expect(_class.findByName("_fieldNull").defaultValue).toBe("null");

                    // can resolve type inner interface types
                    expect(_class.attributes[15].type === _class.findByName("InterfaceTest")).toBe(true);
                });
            });

            it("can reverse Java Fields to UMLAssociations", function () {
                runs(function () {
                    var promise = reverse({ association: true });
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _class = findOne("GenericClassTest", type.UMLClass),
                        _to    = findOne("ClassTest"),
                        _asso  = Repository.getRelationshipsOf(_class, function (r) { return r instanceof type.UMLAssociation; })[0];

                    expect(_asso.end1.reference).toEqual(_class);
                    expect(_asso.end2.reference).toEqual(_to);
                    expect(_asso.end2.name).toEqual("classTestRef");
                });
            });

            it("can reverse Java Methods to UMLOperations", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model = Repository.getProject().ownedElements[0],
                        _class = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassTest");

                    // Total 4 Operations
                    expect(_class.operations.length).toEqual(4);

                    // Parameters
                    expect(_class.findByName("test").parameters.length).toEqual(3);
                    expect(_class.findByName("test").parameters[0].name).toEqual("arg1");
                    expect(_class.findByName("test").parameters[0].direction).toEqual(UML.DK_IN);
                    expect(_class.findByName("test").parameters[1].name).toEqual("arg2");
                    expect(_class.findByName("test").parameters[1].direction).toEqual(UML.DK_IN);
                    expect(_class.findByName("test").parameters[2].direction).toEqual(UML.DK_RETURN);

                    // Modifiers
                    expect(_class.findByName("test2").isStatic).toBe(true);
                    expect(_class.findByName("test2").isLeaf).toBe(true);
                    expect(_class.findByName("test3").isAbstract).toBe(true);

                });
            });

            it("can reverse Java Extends to UMLGeneralization", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _class  = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassTest"),
                        _class2 = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("GenericClassTest");

                    var generalizations = Repository.getRelationshipsOf(_class, function (rel) { return rel instanceof type.UMLGeneralization; });
                    expect(generalizations.length).toEqual(1);
                    expect(generalizations[0].source).toEqual(_class);
                    expect(generalizations[0].target).toEqual(_class2);
                });
            });

            it("can reverse Java Implements to UMLInterfaceRealization", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _class  = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassTest"),
                        _intf   = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("InterfaceTest");

                    var realizations = Repository.getRelationshipsOf(_intf, function (rel) { return rel instanceof type.UMLInterfaceRealization; });
                    expect(realizations.length).toEqual(1);
                    expect(realizations[0].source).toEqual(_class);
                    expect(realizations[0].target).toEqual(_intf);
                });
            });

            it("can reverse Fields of Java Generic Class", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _class  = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("GenericClassTest");

                    expect(_class.templateParameters.length).toEqual(2);
                    expect(_class.templateParameters[0].name).toEqual("E");
                    expect(_class.templateParameters[1].name).toEqual("T");
                    expect(_class.templateParameters[1].parameterType).toEqual("java.util.Collection");
                });
            });

            it("can reverse Java Interface", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _intf   = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("InterfaceTest");
                    expect(_intf).toBeDefined();
                    expect(_intf instanceof type.UMLInterface).toBe(true);
                    expect(_intf.attributes.length).toEqual(1);
                    expect(_intf.operations.length).toEqual(1);
                });
            });

            it("can reverse Java Enum", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _enum   = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("RetryType");
                    expect(_enum).toBeDefined();
                    expect(_enum instanceof type.UMLEnumeration).toBe(true);
                    expect(_enum.literals.length).toEqual(3);
                    expect(_enum.literals[0].name).toEqual("NONE");
                    expect(_enum.literals[1].name).toEqual("BEFORE_RESPONSE");
                    expect(_enum.literals[2].name).toEqual("AFTER_RESPONSE");
                });
            });

            it("can reverse Java AnnotationType", function () {
                runs(function () {
                    var promise = reverse({});
                    waitsForDone(promise, "Analyzing...", 3000);
                });
                runs(function () {
                    var _model  = Repository.getProject().ownedElements[0],
                        _annotationType = _model.ownedElements[0].ownedElements[0].ownedElements[0].findByName("ClassPreamble");
                    expect(_annotationType).toBeDefined();
                    expect(_annotationType instanceof type.UMLClass).toBe(true);
                    expect(_annotationType.stereotype).toEqual("annotationType");
                    expect(_annotationType.attributes.length).toEqual(1);
                    expect(_annotationType.attributes[0].name).toEqual("_annotationConstant");
                    expect(_annotationType.operations.length).toEqual(2);
                    expect(_annotationType.operations[0].name).toEqual("author");
                    expect(_annotationType.operations[1].name).toEqual("lastModified");
                });
            });
        });




    });

});
