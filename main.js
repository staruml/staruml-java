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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, staruml, type, appshell, document */
define(function (require, exports, module) {
    "use strict";

    var AppInit         = staruml.getModule("utils/AppInit"),
        Repository      = staruml.getModule("engine/Repository"),
        Engine          = staruml.getModule("engine/Engine"),
        Commands        = staruml.getModule("menu/Commands"),
        CommandManager  = staruml.getModule("menu/CommandManager"),
        MenuManager     = staruml.getModule("menu/MenuManager"),
        Dialogs         = staruml.getModule("widgets/Dialogs"),
        ElementPicker   = staruml.getModule("dialogs/ElementPicker"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        FileSystemError = staruml.getModule("filesystem/FileSystemError"),
        ExtensionUtils  = staruml.getModule("utils/ExtensionUtils"),
        UML             = staruml.getModule("uml/UML");

    var CodeGenUtils        = require("CodeGenUtils"),
        JavaPreferences     = require("JavaPreferences"),
        JavaCodeGenerator   = require("JavaCodeGenerator"),
        JavaReverseEngineer = require("JavaReverseEngineer");

    /**
     * Menu IDs
     */
    var CMD_JAVA          = 'java',
        CMD_JAVA_GENERATE = 'java.generate',
        CMD_JAVA_REVERSE  = 'java.reverse';

    // TODO: Return $.Promise
    function checkConfig(callback) {
        var baseModel = JavaCodeGenerator.getBaseModel(),
            targetDir = JavaCodeGenerator.getTargetDirectory();
        var dir = FileSystem.getDirectoryForPath(targetDir);
        if (dir && dir._isDirectory === true) {
            if (baseModel instanceof type.UMLPackage) {
                callback(true, baseModel, targetDir);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    }

    function generate(baseModel, targetDir) {
        var i, len;
        for (i = 0, len = baseModel.ownedElements.length; i < len; i++) {
            var elem = baseModel.ownedElements[i];
            if (elem instanceof type.UMLPackage) {
                var dir = targetDir + "/" + elem.name;
                FileSystem.makeDir(dir, 0, function (err) {
                    if (err === FileSystem.NO_ERROR) {
                        generate(elem, dir);
                    } else {
                        console.log("[Java] Failed to make directory - " + dir);
                    }
                });
            } else if (elem instanceof type.UMLClass) {
                var file = targetDir + "/" + elem.name + ".java";
                var codeWriter = new CodeGenUtils.CodeWriter();
                JavaCodeGenerator.writePackageDeclaration(codeWriter, elem);
                codeWriter.writeLine();
                codeWriter.writeLine("import java.util.ArrayList;");
                codeWriter.writeLine();
                JavaCodeGenerator.writeClass(codeWriter, elem);
                FileSystem.writeFile(file, codeWriter.getData(), "utf8", function (err) {
                    if (err !== FileSystem.NO_ERROR) {
                        console.log("[Java] Failed to generate - " + file);
                    }
                });
            } else if (elem instanceof type.UMLInterface) {
                var file = targetDir + "/" + elem.name + ".java";
                var codeWriter = new CodeGenUtils.CodeWriter();
                JavaCodeGenerator.writePackageDeclaration(codeWriter, elem);
                codeWriter.writeLine();
                codeWriter.writeLine("import java.util.ArrayList;");
                codeWriter.writeLine();
                JavaCodeGenerator.writeInterface(codeWriter, elem);
                FileSystem.writeFile(file, codeWriter.getData(), "utf8", function (err) {
                    if (err !== FileSystem.NO_ERROR) {
                        console.log("[Java] Failed to generate - " + file);
                    }
                });
            } else if (elem instanceof type.UMLEnumeration) {
                var file = targetDir + "/" + elem.name + ".java";
                var codeWriter = new CodeGenUtils.CodeWriter();
                JavaCodeGenerator.writePackageDeclaration(codeWriter, elem);
                codeWriter.writeLine();
                JavaCodeGenerator.writeEnum(codeWriter, elem);
                FileSystem.writeFile(file, codeWriter.getData(), "utf8", function (err) {
                    if (err !== FileSystem.NO_ERROR) {
                        console.log("[Java] Failed to generate - " + file);
                    }
                });
            }
        }
    }

    function traverse(dir, analyzer) {
        dir.getContents(function (err, entries, stats) {
            if (entries && entries.length > 0) {
                for (var i = 0, len = entries.length; i < len; i++) {
                    var entry = entries[i];
                    analyzer(entry);
                    if (entry._isDirectory === true) {
                        traverse(entry, analyzer);
                    }
                }
            }
        });
    }

    /**
     * CommandManager.execute로부터 파라미터를 받아서 코드 생성 가능하게 한다.
     * 파라미터가 없으면 baseModel, targetDir을 사용한다.
     * options = {
     *   base: (model)
     *   path: "/User/niklaus/..."
     *   javaDoc: true,
     *   useTab: false,
     *   indentSpaces: 4,
     *   headerComment: true
     * }
     */
    function _handleGenerate(options) {
        checkConfig(function (configured, baseModel, targetDir) {
            if (configured) {
                generate(baseModel, targetDir);
            } else {
                Dialogs.showAlertDialog("Java Code Generation is not configured.");
            }
        });
    }

    /**
     * CommandManager.execute로부터 파라미터를 받아서 코드 역공학이 가능하게 한다.
     * e.g.) options = {
     *          path: "/User/niklaus/...",
     *          files: [ "....java", ".java" ],
     *          typeHiarachy: true
     *          packageOverview: true
     *          packageStructure: true
     *       }
     * 파라미터가 없으면 baseModel, targetDir을 사용한다.
     * Must return $.Promise
     */
    // TODO: options.path 가 주어져 있으면 showOpenDialog를 하지 않는다.
    function _handleReverse(options) {
        var result = new $.Deferred();
        FileSystem.showOpenDialog(false, true, "Select Folder", null, null, function (err, files) {
            if (!err) {
                if (files && files.length > 0) {
                    var options = {
                        association: true,
                        path: files[0]
                    };
                    JavaReverseEngineer.analyze(options).then(result.resolve, result.reject);
                } else {
                    result.reject();
                }
            } else {
                result.reject(err);
            }
        });
        return result.promise();
    }

    // Register Commands
    CommandManager.register("Java",         CMD_JAVA,          CommandManager.doNothing);
    CommandManager.register("Generate...",  CMD_JAVA_GENERATE, _handleGenerate);
    CommandManager.register("Reverse...",   CMD_JAVA_REVERSE,  _handleReverse);

    var menu, menuItem;
    menu = MenuManager.getMenu(Commands.TOOLS);
    menuItem = menu.addMenuItem(CMD_JAVA);
    menuItem.addMenuItem(CMD_JAVA_GENERATE);
    menuItem.addMenuItem(CMD_JAVA_REVERSE);

});