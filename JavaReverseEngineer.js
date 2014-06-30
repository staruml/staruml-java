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


// TODO: Field를 Association으로 변환하는 경우, Directional은 쉽지만 Bidirectional은 어떻게 할건지?
//       무조건 directional로 하든지, 아니면 options의 bidirectional = true 이면 임의로 Bidirectional로 생성하는 방법.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, staruml, type, document, java7 */
define(function (require, exports, module) {
    "use strict";

    var Core            = staruml.getModule("core/Core"),
        Repository      = staruml.getModule("engine/Repository"),
        UML             = staruml.getModule("uml/UML"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        FileSystemError = staruml.getModule("filesystem/FileSystemError"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        Async           = staruml.getModule("utils/Async");

    require("grammar/java7");

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
    };



    ModelBuilder.prototype.toJson = function () {
        var writer = new Core.Writer();
        writer.writeObj("data", this._baseModel);
        return writer.current.data;
    };


    // --------------------

    /**
     * Java Code Analyzer
     * @constructor
     */
    function JavaAnalyzer() {

        /** @member {Array.<File>} */
        this._files = [];

        this._builder = new ModelBuilder(); // ???

        /**
         * @member {{classifier:type.UMLClassifier, node: Object}}
         */
        this._generalizations = [];

        /**
         * @member {{classifier:type.UMLClassifier, node: Object}}
         */
        this._realizations = [];

        /**
         * @member {{classifier:type.UMLClassifier, node: Object}}
         */
        this._fields = [];

        /**
         * @member {{structuralFeature:type.UMLStructuralFeature, node: Object}}
         */
        this._types = [];

    }

    /**
     * Add File to Reverse Engineer
     * @param {File} file
     */
    JavaAnalyzer.prototype.addFile = function (file) {
        this._files.push(file);
    };

    /**
     * Analyze all files.
     * @return {$.Promise}
     */
    JavaAnalyzer.prototype.analyze = function (options) {
        var self = this;

        // Perform 1st Phase
        var promise = Async.doSequentially(this._files, function (file) {
            var result = new $.Deferred();
            file.read({}, function (err, data, stat) {
                if (!err) {
                    try {
                        var parent = self._builder.getBaseModel(),
                            ast    = java7.parse(data);
                        self.translateCompilationUnit(options, parent, ast);
                    } catch (e) {
                        console.log("[Java] Failed to parse : " + file._path);
                    }
                    result.resolve();
                } else {
                    result.reject(err);
                }
            });
            return result.promise();
        }, false);

        // Perform 2nd Phase
        promise.always(function () {
            self.perform2ndPhase(options);
        });

        // Load To Project
        promise.always(function () {
            var json = self._builder.toJson();
            Repository.importFromJson(Repository.getProject(), json);
            console.log("[Java] done.");
        });

        return promise;
    };

    /**
     * Perform 2nd Phase
     * - Create Generalizations
     * - Create InterfaceRealizations
     * - Create Fields or Associations
     * - Resolve Type References
     */
    JavaAnalyzer.prototype.perform2ndPhase = function (options) {
        var i, len, _type;

        // Create Generalizations
        for (i = 0, len = this._generalizations.length; i < len; i++) {
            var _gen = this._generalizations[i];
            _type = this._findType(_gen.classifier, _gen.node.qualifiedName.name);
            if (_type) {
                var gen = new type.UMLGeneralization();
                gen._parent = _gen.classifier;
                gen.source = _gen.classifier;
                gen.target = _type;
                _gen.classifier.ownedElements.push(gen);
            }
        }

        // Create InterfaceRealizations
        for (i = 0, len = this._realizations.length; i < len; i++) {
            var _real = this._realizations[i];
            _type = this._findType(_real.classifier, _real.node.qualifiedName.name);
            if (_type) {
                var real = new type.UMLInterfaceRealization();
                real._parent = _real.classifier;
                real.source = _real.classifier;
                real.target = _type;
                _real.classifier.ownedElements.push(real);
            }
        }

    };

    /**
     * Find Type.
     *
     * @param {Element} context
     * @param {string} typeName
     */
    JavaAnalyzer.prototype._findType = function (context, typeName) {
        var root = this._builder.getBaseModel(),
            pathName = (typeName.indexOf(".") > 0 ? typeName.trim().split(".") : []),
            _type = null;

        // 1. Lookdown from context
        if (pathName.length > 1) {
            _type = context.lookdown(pathName);
        } else {
            _type = context.findByName(typeName);
        }

        // 2. Lookup from context
        if (!_type) {
            _type = context.lookup(typeName, null, root);
        }

        // 3. Find from imported namespaces
        if (!_type) {
            // TODO: import에서 찾기.
        }

        // 4. Lookdown from Root
        if (!_type) {
            if (pathName.length > 1) {
                _type = root.lookdown(pathName);
            } else {
                _type = root.findByName(typeName);
            }
        }
        return _type;
    };


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
    };

    /**
     * @param {Object} typeNode
     */
    JavaAnalyzer.prototype._getType = function (typeNode) {
        if (typeNode.qualifiedName && _.isString(typeNode.qualifiedName.name)) {
            return typeNode.qualifiedName.name;
        }
        return null;
    };

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
    };

    /**
     * Translate Java CompilationUnit Node.
     * @param {Element} parent
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translateCompilationUnit = function (options, parent, compilationUnitNode) {
        var _namespace = parent,
            i,
            len;

        if (compilationUnitNode["package"]) {
            var _package = this.translatePackage(options, parent, compilationUnitNode["package"]);
            if (_package !== null) {
                _namespace = _package;
            }
        }

        if (compilationUnitNode.types && compilationUnitNode.types.length > 0) {
            for (i = 0, len = compilationUnitNode.types.length; i < len; i++) {
                var typeNode = compilationUnitNode.types[i];
                switch (typeNode.node) {
                case "Class":
                    this.translateClass(options, _namespace, typeNode);
                    break;
                case "Interface":
                    this.translateInterface(options, _namespace, typeNode);
                    break;
                case "Enum":
                    this.translateEnum(options, _namespace, typeNode);
                    break;
                case "AnnotationType":
                    this.translateAnnotationType(options, _namespace, typeNode);
                    break;
                }
            }
        }
    };

    /**
     * Translate Java Package Node.
     * @param {Element} parent
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translatePackage = function (options, parent, packageNode) {
        if (packageNode && packageNode.qualifiedName && packageNode.qualifiedName.name) {
            var pathNames = packageNode.qualifiedName.name.split(".");
            return this.ensurePackage(parent, pathNames);
        }
        return null;
    };


    /**
     * Translate Members Nodes
     * @param {Element} parent
     * @param {Array.<Object>} memberNodeArray
     */
    JavaAnalyzer.prototype.translateMembers = function (options, parent, memberNodeArray) {
        var i, len;
        if (memberNodeArray.length > 0) {
            for (i = 0, len = memberNodeArray.length; i < len; i++) {
                var memberNode = memberNodeArray[i];
                switch (memberNode.node) {
                case "Field":
                    this.translateField(options, parent, memberNode);
                    break;
                case "Method":
                    this.translateMethod(options, parent, memberNode);
                    break;
                case "EnumConstant":
                    this.translateEnumConstant(options, parent, memberNode);
                    break;
                }
            }
        }
    };

    /**
     * Translate Java Class Node.
     * @param {Element} parent
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translateClass = function (options, parent, classNode) {
        var i, len, _class;

        // Create Class
        _class = new type.UMLClass();
        _class._parent = parent;
        _class.name = classNode.name;
        _class.visibility = this._getVisibility(classNode.modifiers);
        parent.ownedElements.push(_class);

        // Register Extends for 2nd Phase Translation
        if (classNode["extends"]) {
            this._generalizations.push({
                classifier: _class,
                node: classNode["extends"]
            });
        }

        // - 1) 타입이 소스에 있는 경우 --> 해당 타입으로 Generalization 생성
        // - 2) 타입이 소스에 없는 경우 (e.g. java.util.ArrayList) --> 타입을 생성(어디에?)한 뒤 Generalization 생성
        // 모든 타입이 생성된 다음에 Generalization (혹은 기타 Relationships)이 연결되어야 하므로, 어딘가에 등록한 다음이 2nd Phase에서 처리.

        // Register Implements for 2nd Phase Translation
        if (classNode["implements"]) {
            for (i = 0, len = classNode["implements"].length; i < len; i++) {
                var _impl = classNode["implements"][i];
                this._realizations.push({
                    classifier: _class,
                    node: _impl
                });
            }
        }

        // Translate Members
        this.translateMembers(options, _class, classNode.body);
    };

    JavaAnalyzer.prototype.translateInterface = function (options, parent, interfaceNode) {
        var i, len, _interface;

        // Create Interface
        _interface = new type.UMLInterface();
        _interface._parent = parent;
        _interface.name = interfaceNode.name;
        _interface.visibility = this._getVisibility(interfaceNode.modifiers);
        parent.ownedElements.push(_interface);

        // Register Extends for 2nd Phase Translation
        if (interfaceNode["extends"]) {
            for (i = 0, len = interfaceNode["extends"].length; i < len; i++) {
                var _ext = interfaceNode["extends"][i];
                this._generalizations.push({
                    classifier: _interface,
                    node: _ext
                });
            }
        }

        // Translate Members
        this.translateMembers(options, _interface, interfaceNode.body);
    };

    JavaAnalyzer.prototype.translateEnum = function (options, parent, enumNode) {
        var _enum;

        // Create Enumeration
        _enum = new type.UMLEnumeration();
        _enum._parent = parent;
        _enum.name = enumNode.name;
        _enum.visibility = this._getVisibility(enumNode.modifiers);
        parent.ownedElements.push(_enum);

        // Translate Members
        this.translateMembers(options, _enum, enumNode.body);
    };

    JavaAnalyzer.prototype.translateAnnotationType = function (options, parent, annotationTypeNode) {
        var _annotationType;

        // Create Class <<annotationType>>
        _annotationType = new type.UMLClass();
        _annotationType._parent = parent;
        _annotationType.name = annotationTypeNode.name;
        _annotationType.stereotype = "annotationType";
        _annotationType.visibility = this._getVisibility(annotationTypeNode.modifiers);
        parent.ownedElements.push(_annotationType);

        // Translate Members
        this.translateMembers(options, _annotationType, annotationTypeNode.body);
    };

    JavaAnalyzer.prototype.translateField = function (options, parent, fieldNode) {
        var i, len;
        if (fieldNode.variables && fieldNode.variables.length > 0) {
            for (i = 0, len = fieldNode.variables.length; i < len; i++) {
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
                // TODO: 타입?이 2nd Phase에서 Resolve될 수 있도록 해야 함.
                // TODO: Attribute? or Assocation?

                parent.attributes.push(_attribute);
            }
        }
    };

    /**
     * Translate Method
     */
    JavaAnalyzer.prototype.translateMethod = function (options, parent, methodNode) {
        var i, len,
            _operation = new type.UMLOperation();
        _operation._parent = parent;
        _operation.name = methodNode.name;
        _operation.visibility = this._getVisibility(methodNode.modifiers);

        if (methodNode.parameters && methodNode.parameters.length > 0) {
            for (i = 0, len = methodNode.parameters.length; i < len; i++) {
                var parameterNode = methodNode.parameters[i];
                this.translateParameter(options, _operation, parameterNode);
            }
        }
        // TODO: ReturnType

        parent.operations.push(_operation);
    };

    /**
     * Translate Enumeration Constant
     */
    JavaAnalyzer.prototype.translateEnumConstant = function (options, parent, enumConstantNode) {
        var _literal = new type.UMLEnumerationLiteral();
        _literal._parent = parent;
        _literal.name = enumConstantNode.name;
        parent.literals.push(_literal);
    };


    /**
     * Translate Method Parameters
     */
    JavaAnalyzer.prototype.translateParameter = function (options, parent, parameterNode) {
        var _parameter = new type.UMLParameter();
        _parameter._parent = parent;
        _parameter.name = parameterNode.variable.name;
        _parameter.type = this._getType(parameterNode.type);

        parent.parameters.push(_parameter);
    };

    /**
     *
     * @param {Object} options
     *       options = {
     *          path: "/User/niklaus/...",
     *          association: true,
     *          publicOnly: true,
     *          typeHiarachy: true,
     *          packageOverview: true,
     *          packageStructure: true
     *       }
     * @return {$.Promise}
     */
    function analyze(options) {
        var result = new $.Deferred(),
            javaAnalyzer = new JavaAnalyzer();

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
        var dir = FileSystem.getDirectoryForPath(options.path);
        dir.visit(visitEntry, {}, function (err) {
            if (!err) {
                javaAnalyzer.analyze(options).then(result.resolve, result.reject);
            } else {
                result.reject(err);
            }
        });

        return result.promise();
    }

    exports.analyze = analyze;

});