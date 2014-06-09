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

    var Repository     = staruml.getModule("engine/Repository"),
        Engine         = staruml.getModule("engine/Engine"),
        Commands       = staruml.getModule("menu/Commands"),
        MenuManager    = staruml.getModule("menu/MenuManager"),
        Dialogs        = staruml.getModule("widgets/Dialogs"),
        ElementPicker  = staruml.getModule("dialogs/ElementPicker"),
        FileSystem     = staruml.getModule("utils/FileSystem"),
        ExtensionUtils = staruml.getModule("utils/ExtensionUtils"),
        UML            = staruml.getModule("uml/UML");

    var ConfigDialog        = require("ConfigDialog"),
        CodeGenUtils        = require("CodeGenUtils"),
        JavaCodeGenerator   = require("JavaCodeGenerator"),
        JavaReverseEngineer = require("JavaReverseEngineer");

    /**
     * Menu IDs
     */
    var TOOLS_JAVACODEGEN          = 'tools-javacodegen',
        TOOLS_JAVACODEGEN_CONFIG   = 'tools-javacodegen-config',
        TOOLS_JAVACODEGEN_GENERATE = 'tools-javacodegen-generate';

    function checkConfig(callback) {
        var baseModel = JavaCodeGenerator.getBaseModel(),
            targetDir = JavaCodeGenerator.getTargetDirectory();
        FileSystem.stat(targetDir, function (err, stat) {
            if (err === FileSystem.NO_ERROR && stat.isDirectory()) {
                if (baseModel instanceof type.UMLPackage) {
                    callback(true, baseModel, targetDir);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    }

    function generate(baseModel, targetDir) {
        for (var i = 0, len = baseModel.ownedElements.length; i < len; i++) {
            var elem = baseModel.ownedElements[i];
            if (elem instanceof type.UMLPackage) {
                var dir = targetDir + "/" + elem.name;
                FileSystem.makeDir(dir, 0, function (err) {
                    if (err === FileSystem.NO_ERROR) {
                        generate(elem, dir);
                    } else {
                        console.log("[JavaCodeGen] Failed to make directory - " + dir);
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
                        console.log("[JavaCodeGen] Failed to generate - " + file);
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
                        console.log("[JavaCodeGen] Failed to generate - " + file);
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
                        console.log("[JavaCodeGen] Failed to generate - " + file);
                    }
                });
            }
        }
    }

    /**
     * Initialize extension
     */
    function init() {
        // MenuManager.addMenuItemSeparator(Commands.TOOLS);
        MenuManager.addMenuItem(TOOLS_JAVACODEGEN,          Commands.TOOLS,    "Java Code Generation", "", "", null, null);
        MenuManager.addMenuItem(TOOLS_JAVACODEGEN_CONFIG,   TOOLS_JAVACODEGEN, "Configuration...",     "", "", null, null);
        MenuManager.addMenuItem(TOOLS_JAVACODEGEN_GENERATE, TOOLS_JAVACODEGEN, "Generate Code",        "", "", null, null);
        $(MenuManager).on('menuItemClicked', function (event, id) {
            switch (id) {                
            case TOOLS_JAVACODEGEN_CONFIG:
                ConfigDialog.showDialog();
                break;
            case TOOLS_JAVACODEGEN_GENERATE:
                checkConfig(function (configured, baseModel, targetDir) {
                    if (configured) {
                        generate(baseModel, targetDir);
                    } else {
                        Dialogs.showAlertDialog("Java Code Generation is not configured.");
                    }
                });
                break;
            }
        });
    };

    init();

});