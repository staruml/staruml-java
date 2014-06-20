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
        Strings        = staruml.getModule("strings"),
        Dialogs        = staruml.getModule("widgets/Dialogs"),
        ElementPicker  = staruml.getModule("dialogs/ElementPicker"),
        FileSystem     = staruml.getModule("filesystem/FileSystem"),
        ExtensionUtils = staruml.getModule("utils/ExtensionUtils"),
        UML            = staruml.getModule("uml/UML");

    // Load Stylesheet
    ExtensionUtils.loadStyleSheet(module, "styles/style.less");

    /**
     * Configuration Dialog Template
     */
    var JavaCodeGenerator    = require("JavaCodeGenerator"),
        configDialogTemplate = require("text!htmlContent/config-dialog.html");

    /**
     * Update Configuration Dialog
     */
    function updateDialog($dlg) {
        var baseModel = JavaCodeGenerator.getBaseModel(),
            targetDir = JavaCodeGenerator.getTargetDirectory(),
            $baseModel = $dlg.data("base-model"),
            $targetDirectory = $dlg.data("target-directory");
        if (baseModel) {
            var baseModelTemplate = "<span class='k-sprite {{getNodeIcon}}'></span>{{getPathname}}";
            $baseModel.html(Mustache.render(baseModelTemplate, baseModel));
        } else {
            $baseModel.html("(UNSPECIFIED)");
        }
        if (targetDir) {
            $targetDirectory.val(targetDir);
        }
    }

    /**
     * Show Configuration Dialog
     */
    function showDialog() {
        var context = { Strings: Strings };
        var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(configDialogTemplate, context), true, function ($dlg) {

        });
        var $dlg = dialog.getElement(),
            $findElement = $dlg.find(".find-element"),
            $findDirectory = $dlg.find(".find-directory"),
            $baseModel = $dlg.find(".base-model"),
            $targetDirectory = $dlg.find(".target-directory");

        $dlg.data("base-model", $baseModel);
        $dlg.data("target-directory", $targetDirectory);

        // Find Base Model Button
        $findElement.click(function () {
            ElementPicker.showModal("Select Base Model", type.UMLPackage).done(function (buttonId, selected) {
                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                    JavaCodeGenerator.setBaseModel(selected);
                    updateDialog($dlg);
                }
            });
        });
        // Find Target Directory Button
        $findDirectory.click(function () {
            FileSystem.showOpenDialog(false, true, "Select Target Directory", null, null, function (err, files) {
                if (!err) {
                    if (files.length > 0) {
                        JavaCodeGenerator.setTargetDirectory(files[0]);
                    }
                }
                updateDialog($dlg);
            });
        });
        updateDialog($dlg);
    }

    exports.showDialog = showDialog;

});