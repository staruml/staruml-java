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

    var AppInit             = staruml.getModule("utils/AppInit"),
        Repository          = staruml.getModule("engine/Repository"),
        Engine              = staruml.getModule("engine/Engine"),
        Commands            = staruml.getModule("menu/Commands"),
        CommandManager      = staruml.getModule("menu/CommandManager"),
        MenuManager         = staruml.getModule("menu/MenuManager"),
        Dialogs             = staruml.getModule("widgets/Dialogs"),
        ElementPickerDialog = staruml.getModule("dialogs/ElementPickerDialog"),
        FileSystem          = staruml.getModule("filesystem/FileSystem"),
        FileSystemError     = staruml.getModule("filesystem/FileSystemError"),
        ExtensionUtils      = staruml.getModule("utils/ExtensionUtils"),
        UML                 = staruml.getModule("uml/UML");

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

    /**
     * CommandManager.execute로부터 파라미터를 받아서 코드 생성 가능하게 한다.
     * 파라미터가 없으면 baseModel, targetDir을 사용한다.
     * @param {Object} options
     * @return {$.Promise}
     */
    function _handleGenerate(options) {
        var result = new $.Deferred();

        // If options is not passed, get from preference
        options = JavaPreferences.getGenOptions();

        // If options.base is not assigned, popup ElementPicker
        if (!options.base) {
            ElementPickerDialog.showDialog("Select a base model to generate codes", null, type.UMLPackage)
                .done(function (buttonId, selected) {
                    if (buttonId === Dialogs.DIALOG_BTN_OK && selected) {
                        options.base = selected;

                        // If options.path is not assigned, popup Open Dialog to select a folder
                        if (!options.path) {
                            FileSystem.showOpenDialog(false, true, "Select a folder where generated codes to be located", null, null, function (err, files) {
                                if (!err) {
                                    if (files.length > 0) {
                                        options.path = files[0];
                                        JavaCodeGenerator.generate(options).then(result.resolve, result.reject);
                                    } else {
                                        result.reject(FileSystem.USER_CANCELED);
                                    }
                                } else {
                                    result.reject(err);
                                }
                            });
                        } else {
                            JavaCodeGenerator.generate(options).then(result.resolve, result.reject);
                        }
                    } else {
                        result.reject();
                    }
                });
        } else {
            // If options.path is not assigned, popup Open Dialog to select a folder
            if (!options.path) {
                FileSystem.showOpenDialog(false, true, "Select a folder where generated codes to be located", null, null, function (err, files) {
                    if (!err) {
                        if (files.length > 0) {
                            options.path = files[0];
                            JavaCodeGenerator.generate(options).then(result.resolve, result.reject);
                        } else {
                            result.reject(FileSystem.USER_CANCELED);
                        }
                    } else {
                        result.reject(err);
                    }
                });
            } else {
                JavaCodeGenerator.generate(options).then(result.resolve, result.reject);
            }
        }
        return result.promise();
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
    function _handleReverse(options) {
        var result = new $.Deferred();
        // If options is not passed, get from preference
        options = JavaPreferences.getRevOptions();

        // If options.path is not assigned, popup Open Dialog to select a folder
        if (!options.path) {
            FileSystem.showOpenDialog(false, true, "Select Folder", null, null, function (err, files) {
                if (!err) {
                    if (files.length > 0) {
                        options.path = files[0];
                        JavaReverseEngineer.analyze(options).then(result.resolve, result.reject);
                    } else {
                        result.reject(FileSystem.USER_CANCELED);
                    }
                } else {
                    result.reject(err);
                }
            });
        }
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