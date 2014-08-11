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
/*global define, describe, _, it, xit, expect, beforeFirst, afterLast, spyOn, beforeEach, afterEach, waitsFor, runs, $, type, staruml, waitsForDone, java7 */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var Repository,       // loaded from staruml.test
        CommandManager,   // loaded from staruml.test
        Commands,         // loaded from staruml.test
        FileSystem,       // loaded from staruml.test
        Dialogs,          // loaded from staruml.test
        SpecRunnerUtils = staruml.getModule("spec/SpecRunnerUtils"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        ExtensionUtils  = staruml.getModule("utils/ExtensionUtils"),
        UML             = staruml.getModule("uml/UML");

    describe("Java", function () {




        describe("Java Reverse Engineering", function () {
            var testPath = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files",
                testWindow;

            beforeFirst(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from staruml.test
                    window.type         = testWindow.type;
                    Repository          = testWindow.staruml.test.Repository;
                    CommandManager      = testWindow.staruml.test.CommandManager;
                    Commands            = testWindow.staruml.test.Commands;
                    FileSystem          = testWindow.staruml.test.FileSystem;
                    Dialogs             = testWindow.staruml.test.Dialogs;

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
                    expect(_class.isFinalSpecification).toBe(true);
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
