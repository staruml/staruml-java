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
            function find(name) {
                return Repository.find(function (e) {
                    return e.name === name;
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
            
        });
        
    });
        
});
