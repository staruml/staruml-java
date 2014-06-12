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

    var Core            = staruml.getModule("core/Core"),
        Repository      = staruml.getModule("engine/Repository"),
        UML             = staruml.getModule("uml/UML"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        FileSystemError = staruml.getModule("filesystem/FileSystemError"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        Async           = staruml.getModule("utils/Async");

    require("java7");

    /*
    var p1 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/test/src-jdk/java/applet/Applet.java",
        p2 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/test/src-jdk/java/awt/Canvas.java",
        p3 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/test/src-jdk/java/util/Collection.java",
        p4 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/test/src-jdk/com/sun/corba/se/spi/protocol/RetryType.java",
        p5 = "/Users/niklaus/Library/Application Support/StarUML/extensions/user/JavaCodeEng/test/src-jdk/com/sun/org/glassfish/external/arc/Taxonomy.java";

    var x = FileSystem.readFile(p1, "utf8", function (err, data) {
        console.log(err);
        console.log(data);
        var r = java7.parse(data);
        console.log(JSON.stringify(r, null, "\t"));
    });
    */

    /**
     * CodeWriter
     * @constructor
     */
    function ModelBuilder() {

        this._baseModel = new type.UMLModel();

    }

    ModelBuilder.prototype.getBaseModel = function () {
        return this._baseModel;
    }



    ModelBuilder.prototype.toJson = function () {
        var writer = new Core.Writer();
        writer.writeObj("data", this._baseModel);
        return writer.current["data"];
    }


    // --------------------

    /**
     * Java Code Analyzer
     * @constructor
     */
    function JavaAnalyzer() {

        /** @member {Array.<File>} */
        this._files = [];

        this._builder = new ModelBuilder();

    }

    /**
     * @param {Array.<string>} modifiers
     */
    JavaAnalyzer.prototype._getVisibility = function (modifiers) {
        if (_.contains(modifiers, "public")) {
            return UML.VK_PUBLIC;
        } else if (_.contains(modifiers, "protected")) {
            return UML.VK_PROTECTED;
        } else if (_.contains(modifiers, "private")) {
            return UML.VK_PRIVATE;
        }
        return UML.VK_PACKAGE;
    }

    JavaAnalyzer.prototype._getType = function (typeNode) {
        if (_.isString(typeNode.name)) {
            return typeNode.name;
        } else if (typeNode.name.name) {
            return typeNode.name.name;
        }
    }

    /**
     * Add File to Reverse Engineer
     * @param {File} file
     */
    JavaAnalyzer.prototype.addFile = function (file) {
        this._files.push(file);
    }


    /**
     * Analyze all files.
     */
    JavaAnalyzer.prototype.analyze = function () {
        var self = this;
        // First Phase
        var promise = Async.doSequentially(this._files, function (file) {
            var result = new $.Deferred();
            file.read({}, function (err, data, stat) {
                try {
                    var parent = self._builder.getBaseModel(),
                        ast    = java7.parse(data);
                    self.translateCompilationUnit(parent, ast);
                    result.resolve();
                } catch (e) {
                    console.log(e);
                    console.log("[Java] Failed to parse : " + file._path);
                    result.reject();
                }
            });
            return result.promise();
        }, false);

        promise.always(function () {
            var json = self._builder.toJson();
            Repository.importFromJson(Repository.getProject(), json, function (elem) {
                console.log("done.");
            });
        });

    }

    /**
     * Return the package of a given pathNames. If not exists, create the package.
     * @param {Element} parent
     * @param {Array.<string>} pathNames
     * @return {Element} Package element corresponding to the pathNames
     */
    JavaAnalyzer.prototype.ensurePackage = function (parent, pathNames) {
        if (pathNames.length > 0) {
            var name = pathNames.shift();
            if (name && name.length > 0) {
                var elem = parent.findByName(name);
                if (elem !== null) {
                    // Package exists
                    if (pathNames.length > 0) {
                        return this.ensurePackage(elem, pathNames);
                    } else {
                        return elem;
                    }
                } else {
                    // Package not exists, then create one.
                    var _package = new type.UMLPackage();
                    parent.ownedElements.push(_package);
                    _package._parent = parent;
                    _package.name = name;
                    if (pathNames.length > 0) {
                        return this.ensurePackage(_package, pathNames);    
                    } else {
                        return _package;
                    }
                }
            }
        } else {
            return null;
        }
    }

    JavaAnalyzer.prototype.translateCompilationUnit = function (parent, compilationUnitNode) {
        var _namespace = parent;
        if (compilationUnitNode["package"]) {
            var _package = this.translatePackage(parent, compilationUnitNode["package"]);
            if (_package !== null) {
                _namespace = _package;
            }
        }
        if (compilationUnitNode.types && compilationUnitNode.types.length > 0) {
            for (var i = 0, len = compilationUnitNode.types.length; i < len; i++) {
                var type = compilationUnitNode.types[i];
                switch (type.node) {
                case "Class":
                    this.translateClass(_namespace, type);
                    break;
                case "Interface":
                    this.translateInterface(_namespace, type);
                    break;
                case "Enum":
                    this.translateEnum(_namespace, type);
                    break;
                case "AnnotationType":
                    this.translateAnnotationType(_namespace, type);
                    break;
                }
            }
        }
    }

    JavaAnalyzer.prototype.translatePackage = function (parent, packageNode) {
        if (packageNode && packageNode.name && packageNode.name.name) {
            var pathNames = packageNode.name.name.split(".");
            return this.ensurePackage(parent, pathNames);
        }
        return null;
    }

    JavaAnalyzer.prototype.translateClass = function (parent, classNode) {
        var _class = new type.UMLClass();
        _class._parent = parent;
        _class.name = classNode.name;
        _class.visibility = this._getVisibility(classNode.modifiers);
        parent.ownedElements.push(_class);
        // Translate Body
        if (classNode.body && classNode.body.length > 0) {
            for (var i = 0, len = classNode.body.length; i < len; i++) {
                var memberNode = classNode.body[i];
                switch (memberNode.node) {
                case "Field":
                    this.translateField(_class, memberNode);
                    break;
                case "Method":
                    this.translateMethod(_class, memberNode);
                    break;
                }
            }
        }
        console.log(classNode);
        // if (classNode[""])
    }

    JavaAnalyzer.prototype.translateInterface = function (parent, interfaceNode) {
        var _interface = new type.UMLInterface();
        _interface._parent = parent;
        _interface.name = interfaceNode.name;
        _interface.visibility = this._getVisibility(interfaceNode.modifiers);
        parent.ownedElements.push(_interface);
    }

    JavaAnalyzer.prototype.translateEnum = function (parent, enumNode) {
    }

    JavaAnalyzer.prototype.translateAnnotationType = function (parent, annotationTypeNode) {
    }

    JavaAnalyzer.prototype.translateField = function (parent, fieldNode) {
        if (fieldNode.variables && fieldNode.variables.length > 0) {
            for (var i = 0, len = fieldNode.variables.length; i < len; i++) {
                var variableNode = fieldNode.variables[i];
                var _attribute = new type.UMLAttribute();
                _attribute._parent = parent;
                _attribute.name = variableNode.name;
                _attribute.visibility = this._getVisibility(fieldNode.modifiers);
                // TODO: type, type.arrayDimension
                _attribute.type = this._getType(fieldNode.type);
                // TODO: arrayDimension
                // TODO: initializer
                // TODO: static, ..., other modifiers...
                parent.attributes.push(_attribute);
            }
        }
    }

    JavaAnalyzer.prototype.translateMethod = function (parent, methodNode) {
        var _operation = new type.UMLOperation();
        _operation._parent = parent;
        _operation.name = methodNode.name;
        _operation.visibility = this._getVisibility(methodNode.modifiers);

        if (methodNode.parameters && methodNode.parameters.length > 0) {
            for (var i = 0, len = methodNode.parameters.length; i < len; i++) {
                var parameterNode = methodNode.parameters[i];
                this.translateParameter(_operation, parameterNode);
            }
        }
        // TODO: ReturnType

        parent.operations.push(_operation);
    }

    JavaAnalyzer.prototype.translateParameter = function (parent, parameterNode) {
        var _parameter = new type.UMLParameter();
        _parameter._parent = parent;
        _parameter.name = parameterNode.variable.name;
        _parameter.type = this._getType(parameterNode.type);

        parent.parameters.push(_parameter);
    }

    // --------------------

    function analyze(dir) {
        var javaAnalyzer = new JavaAnalyzer();
        function visitEntry(entry) {
            if (entry._isFile === true) {
                var ext = FileUtils.getFileExtension(entry._path);
                if (ext && ext.toLowerCase() === "java") {
                    javaAnalyzer.addFile(entry);
                }
            }
            return true;
        }
        // Traverse all file entries
        dir.visit(visitEntry, {}, function (err) {
            if (err === null) {
                javaAnalyzer.analyze();
            }
        });
    }

    exports.analyze = analyze;

});