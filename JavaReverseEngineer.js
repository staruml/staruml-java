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
// TODO: JavaDoc을 Documentation으로.
// TODO: options.publicOnly 처리

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, staruml, type, document, java7 */
define(function (require, exports, module) {
    "use strict";

    var Core            = staruml.getModule("core/Core"),
        Repository      = staruml.getModule("engine/Repository"),
        CommandManager  = staruml.getModule("menu/CommandManager"),
        UML             = staruml.getModule("uml/UML"),
        FileSystem      = staruml.getModule("filesystem/FileSystem"),
        FileSystemError = staruml.getModule("filesystem/FileSystemError"),
        FileUtils       = staruml.getModule("file/FileUtils"),
        Async           = staruml.getModule("utils/Async");

    require("grammar/java7");

    var javaPrimitiveTypes = [
        "void",
        "byte",
        "short",
        "int",
        "long",
        "float",
        "double",
        "boolean",
        "char",
        "Byte",
        "Double",
        "Float",
        "Integer",
        "Long",
        "Short",
        "String",
        "Character",
        "java.lang.Byte",
        "java.lang.Double",
        "java.lang.Float",
        "java.lang.Integer",
        "java.lang.Long",
        "java.lang.Short",
        "java.lang.String",
        "java.lang.Character"
    ];

    /**
     * CodeWriter
     * @constructor
     */
    function ModelBuilder() {
        this._baseModel = new type.UMLModel();
        this._baseModel.name = "JavaReverse";
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

        this._builder = new ModelBuilder(); // ???

        /** @member {type.UMLModel} */
        this._root = null;

        /** @member {Array.<File>} */
        this._files = [];

        /** @member {Object} */
        this._currentCompilationUnit = null;

        /**
         * @member {{classifier:type.UMLClassifier, node: Object, kind:string}}
         */
        this._extendPendings = [];

        /**
         * @member {{classifier:type.UMLClassifier, node: Object}}
         */
        this._implementPendings = [];

        /**
         * @member {{classifier:type.UMLClassifier, association: type.UMLAssociation, node: Object}}
         */
        this._associationPendings = [];

        /**
         * @member {{operation:type.UMLOperation, node: Object}}
         */
        this._throwPendings = [];

        /**
         * @member {{namespace:type.UMLModelElement, feature:type.UMLStructuralFeature, node: Object}}
         */
        this._typedFeaturePendings = [];
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
        var self = this,
            promise;

        // Perform 1st Phase
        promise = this.performFirstPhase(options);

        // Perform 2nd Phase
        promise.done(function () {
            self.performSecondPhase(options);
        });

        // Load To Project
        promise.done(function () {
            var json = self._builder.toJson();
            Repository.importFromJson(Repository.getProject(), json);
        });

        // Generate Diagrams
        promise.done(function () {
            self.generateDiagrams(options);
            console.log("[Java] done.");
        });

        return promise;
    };


    /**
     * Perform First Phase
     * - Create Generalizations
     * - Create InterfaceRealizations
     * - Create Fields or Associations
     * - Resolve Type References
     */
    JavaAnalyzer.prototype.performFirstPhase = function (options) {
        var self = this;
        return Async.doSequentially(this._files, function (file) {
            var result = new $.Deferred();
            file.read({}, function (err, data, stat) {
                if (!err) {
                    var ast = java7.parse(data);
                    self._root = self._builder.getBaseModel();
                    self._currentCompilationUnit = ast;
                    self.translateCompilationUnit(options, self._root, ast);
                    result.resolve();
                } else {
                    result.reject(err);
                }
            });
            return result.promise();
        }, false);
    };

    /**
     * Perform Second Phase
     * - Create Generalizations
     * - Create InterfaceRealizations
     * - Create Fields or Associations
     * - Resolve Type References
     */
    JavaAnalyzer.prototype.performSecondPhase = function (options) {
        var i, len, j, len2, _typeName, _type, _pathName;

        // Create Generalizations
        //     if super type not found, create a Class correspond to the super type.
        for (i = 0, len = this._extendPendings.length; i < len; i++) {
            var _extend = this._extendPendings[i];
            _typeName = _extend.node.qualifiedName.name;
            _type = this._findType(_extend.classifier, _typeName);
            if (!_type) {
                _pathName = this._toPathName(_typeName);
                if (_extend.kind === "interface") {
                    _type = this._ensureInterface(this._root, _pathName);
                } else {
                    _type = this._ensureClass(this._root, _pathName);
                }
            }

            var generalization = new type.UMLGeneralization();
            generalization._parent = _extend.classifier;
            generalization.source = _extend.classifier;
            generalization.target = _type;
            _extend.classifier.ownedElements.push(generalization);

        }

        // Create InterfaceRealizations
        //     if super interface not found, create a Interface correspond to the super interface
        for (i = 0, len = this._implementPendings.length; i < len; i++) {
            var _implement = this._implementPendings[i];
            _typeName = _implement.node.qualifiedName.name;
            _type = this._findType(_implement.classifier, _typeName);
            if (!_type) {
                _pathName = this._toPathName(_typeName);
                _type = this._ensureInterface(this._root, _pathName);
            }
            var realization = new type.UMLInterfaceRealization();
            realization._parent = _implement.classifier;
            realization.source = _implement.classifier;
            realization.target = _type;
            _implement.classifier.ownedElements.push(realization);
        }

        // Create Associations
        for (i = 0, len = this._associationPendings.length; i < len; i++) {
            var _asso = this._associationPendings[i];
            _typeName = _asso.node.type.qualifiedName.name;
            _type = this._findType(_asso.classifier, _typeName);
            // if type found, add as Association
            if (_type) {
                for (j = 0, len2 = _asso.node.variables.length; j < len2; j++) {
                    var variableNode = _asso.node.variables[j];
                    // Create Association
                    var association = new type.UMLAssociation();
                    association._parent = _asso.classifier;
                    _asso.classifier.ownedElements.push(association);
                    // Set End1
                    association.end1.reference = _asso.classifier;
                    association.end1.name = "";
                    association.end1.visibility = UML.VK_PACKAGE;
                    association.end1.navigable = false;
                    // TODO: Multiplicity
                    // TODO: Aggregation?
                    // Set End2
                    association.end2.reference = _type;
                    association.end2.name = variableNode.name;
                    association.end2.visibility = this._getVisibility(_asso.node.modifiers);
                    association.end2.navigable = true;
                }
            // if type not found, add as Attribute
            } else {
                this.translateFieldAsAttribute(options, _asso.classifier, _asso.node);
            }
        }

        // Assign Throws to Operations
        for (i = 0, len = this._throwPendings.length; i < len; i++) {
            var _throw = this._throwPendings[i];
            _typeName = _throw.node.name;
            _type = this._findType(_throw.operation, _typeName);
            if (!_type) {
                _pathName = this._toPathName(_typeName);
                _type = this._ensureClass(this._root, _pathName);
            }
            _throw.operation.raisedExceptions.push(_type);
        }

        // Resolve Type References
        for (i = 0, len = this._typedFeaturePendings.length; i < len; i++) {
            var _typedFeature = this._typedFeaturePendings[i];
            _typeName = _typedFeature.node.qualifiedName.name;

            // Find type and assign
            _type = this._findType(_typedFeature.namespace, _typeName);
            // if type is exists
            if (_type) {
                _typedFeature.feature.type = _type;
            // if type is not exists
            } else {
                // if type is primitive type
                if (_.contains(javaPrimitiveTypes, _typeName)) {
                    _typedFeature.feature.type = _typeName;
                // otherwise
                } else {
                    _pathName = this._toPathName(_typeName);
                    var _newClass = this._ensureClass(this._root, _pathName);
                    _typedFeature.feature.type = _newClass;
                }
            }

            // Translate type's arrayDimension to multiplicity
            if (_typedFeature.node.arrayDimension && _typedFeature.node.arrayDimension.length > 0) {
                var _dim = [];
                for (j = 0, len2 = _typedFeature.node.arrayDimension.length; j < len2; j++) {
                    _dim.push("*");
                }
                _typedFeature.feature.multiplicity = _dim.join(",");
            }
        }
    };

    /**
     * Generate Diagrams (Type Hierarchy, Package Structure, Package Overview)
     */
    JavaAnalyzer.prototype.generateDiagrams = function (options) {
        var baseModel = Repository.get(this._root._id);
        if (options.packageStructure) {
            CommandManager.execute("diagramGenerator.packageStructure", baseModel, true);
        }
        if (options.typeHierarchy) {
            CommandManager.execute("diagramGenerator.typeHierarchy", baseModel, true);
        }
        if (options.packageOverview) {
            baseModel.traverse(function (elem) {
                if (elem instanceof type.UMLPackage) {
                    CommandManager.execute("diagramGenerator.overview", elem, true);
                }
            });
        }
    };

    /**
     * Convert string type name to path name (Array of string)
     * @param {string} typeName
     * @return {Array.<string>} pathName
     */
    JavaAnalyzer.prototype._toPathName = function (typeName) {
        var pathName = (typeName.indexOf(".") > 0 ? typeName.trim().split(".") : null);
        if (!pathName) {
            pathName = [ typeName ];
        }
        return pathName;
    };


    /**
     * Find Type.
     *
     * @param {Element} namespace
     * @param {string|Object} type - Type name string or type node.
     * @return {Element} element correspond to the type.
     */
    JavaAnalyzer.prototype._findType = function (namespace, type) {
        var typeName,
            pathName,
            _type = null;

        if (type.node === "Type") {
            typeName = type.qualifiedName.name;
        } else if (_.isString(type)) {
            typeName = type;
        }

        pathName = this._toPathName(typeName);

        // 1. Lookdown from context
        if (pathName.length > 1) {
            _type = namespace.lookdown(pathName);
        } else {
            _type = namespace.findByName(typeName);
        }

        // 2. Lookup from context
        if (!_type) {
            _type = namespace.lookup(typeName, null, this._root);
        }

        // 3. Find from imported namespaces
        if (!_type) {
            if (this._currentCompilationUnit.imports) {
                var i, len;
                for (i = 0, len = this._currentCompilationUnit.imports.length; i < len; i++) {
                    var _import = this._currentCompilationUnit.imports[i];
                    // Find in wildcard imports (e.g. import java.lang.*)
                    if (_import.wildcard) {
                        var _namespace = this._root.lookdown(_import.qualifiedName.name);
                        if (_namespace) {
                            _type = _namespace.findByName(typeName);
                        }
                    // Find in import exact matches (e.g. import java.lang.String)
                    } else {
                        _type = this._root.lookdown(_import.qualifiedName.name);
                    }
                }
            }
        }

        // 4. Lookdown from Root
        if (!_type) {
            if (pathName.length > 1) {
                _type = this._root.lookdown(pathName);
            } else {
                _type = this._root.findByName(typeName);
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
     * Return the package of a given pathNames. If not exists, create the package.
     * @param {Element} namespace
     * @param {Array.<string>} pathNames
     * @return {Element} Package element corresponding to the pathNames
     */
    JavaAnalyzer.prototype._ensurePackage = function (namespace, pathNames) {
        if (pathNames.length > 0) {
            var name = pathNames.shift();
            if (name && name.length > 0) {
                var elem = namespace.findByName(name);
                if (elem !== null) {
                    // Package exists
                    if (pathNames.length > 0) {
                        return this._ensurePackage(elem, pathNames);
                    } else {
                        return elem;
                    }
                } else {
                    // Package not exists, then create one.
                    var _package = new type.UMLPackage();
                    namespace.ownedElements.push(_package);
                    _package._parent = namespace;
                    _package.name = name;
                    if (pathNames.length > 0) {
                        return this._ensurePackage(_package, pathNames);
                    } else {
                        return _package;
                    }
                }
            }
        } else {
            return namespace;
        }
    };

    /**
     * Return the class of a given pathNames. If not exists, create the class.
     * @param {Element} namespace
     * @param {Array.<string>} pathNames
     * @return {Element} Class element corresponding to the pathNames
     */
    JavaAnalyzer.prototype._ensureClass = function (namespace, pathNames) {
        if (pathNames.length > 0) {
            var _className = pathNames.pop(),
                _package = this._ensurePackage(namespace, pathNames),
                _class = _package.findByName(_className);
            if (!_class) {
                _class = new type.UMLClass();
                _class._parent = _package;
                _class.name = _className;
                _class.visibility = UML.VK_PUBLIC;
                _package.ownedElements.push(_class);
            }
            return _class;
        }
        return null;
    };

    /**
     * Return the interface of a given pathNames. If not exists, create the interface.
     * @param {Element} namespace
     * @param {Array.<string>} pathNames
     * @return {Element} Interface element corresponding to the pathNames
     */
    JavaAnalyzer.prototype._ensureInterface = function (namespace, pathNames) {
        if (pathNames.length > 0) {
            var _interfaceName = pathNames.pop(),
                _package = this._ensurePackage(namespace, pathNames),
                _interface = _package.findByName(_interfaceName);
            if (!_interface) {
                _interface = new type.UMLInterface();
                _interface._parent = _package;
                _interface.name = _interfaceName;
                _interface.visibility = UML.VK_PUBLIC;
                _package.ownedElements.push(_interface);
            }
            return _interface;
        }
        return null;
    };

    /**
     * Translate Java CompilationUnit Node.
     * @param {Element} namespace
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translateCompilationUnit = function (options, namespace, compilationUnitNode) {
        var _namespace = namespace,
            i,
            len;

        if (compilationUnitNode["package"]) {
            var _package = this.translatePackage(options, namespace, compilationUnitNode["package"]);
            if (_package !== null) {
                _namespace = _package;
            }
        }

        // Translate Types
        this.translateTypes(options, _namespace, compilationUnitNode.types);
    };

    /**
     * Translate Type Nodes
     * @param {Element} namespace
     * @param {Array.<Object>} typeNodeArray
     */
    JavaAnalyzer.prototype.translateTypes = function (options, namespace, typeNodeArray) {
        var i, len;
        if (typeNodeArray.length > 0) {
            for (i = 0, len = typeNodeArray.length; i < len; i++) {
                var typeNode = typeNodeArray[i];
                switch (typeNode.node) {
                case "Class":
                    this.translateClass(options, namespace, typeNode);
                    break;
                case "Interface":
                    this.translateInterface(options, namespace, typeNode);
                    break;
                case "Enum":
                    this.translateEnum(options, namespace, typeNode);
                    break;
                case "AnnotationType":
                    this.translateAnnotationType(options, namespace, typeNode);
                    break;
                }
            }
        }
    };

    /**
     * Translate Java Package Node.
     * @param {Element} namespace
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translatePackage = function (options, namespace, packageNode) {
        if (packageNode && packageNode.qualifiedName && packageNode.qualifiedName.name) {
            var pathNames = packageNode.qualifiedName.name.split(".");
            return this._ensurePackage(namespace, pathNames);
        }
        return null;
    };


    /**
     * Translate Members Nodes
     * @param {Element} namespace
     * @param {Array.<Object>} memberNodeArray
     */
    JavaAnalyzer.prototype.translateMembers = function (options, namespace, memberNodeArray) {
        var i, len;
        if (memberNodeArray.length > 0) {
            for (i = 0, len = memberNodeArray.length; i < len; i++) {
                var memberNode = memberNodeArray[i],
                    visibility = this._getVisibility(memberNode.modifiers);

                // Generate public members only if publicOnly == true
                if (options.publicOnly && visibility !== UML.VK_PUBLIC) {
                    continue;
                }

                switch (memberNode.node) {
                case "Field":
                    if (options.association) {
                        this.translateFieldAsAssociation(options, namespace, memberNode);
                    } else {
                        this.translateFieldAsAttribute(options, namespace, memberNode);
                    }
                    break;
                case "Constructor":
                    this.translateMethod(options, namespace, memberNode);
                    break;
                case "Method":
                    this.translateMethod(options, namespace, memberNode);
                    break;
                case "EnumConstant":
                    this.translateEnumConstant(options, namespace, memberNode);
                    break;
                }
            }
        }
    };


    /**
     * Translate Java Type Parameter Nodes.
     * @param {Element} namespace
     * @param {Object} typeParameterNodeArray
     */
    JavaAnalyzer.prototype.translateTypeParameters = function (options, namespace, typeParameterNodeArray) {
        if (typeParameterNodeArray) {
            var i, len, _typeParam;
            for (i = 0, len = typeParameterNodeArray.length; i < len; i++) {
                _typeParam = typeParameterNodeArray[i];
                if (_typeParam.node === "TypeParameter") {
                    var _templateParameter = new type.UMLTemplateParameter();
                    _templateParameter._parent = namespace;
                    _templateParameter.name = _typeParam.name;
                    if (_typeParam.type) {
                        _templateParameter.parameterType = _typeParam.type;
                    }
                    namespace.templateParameters.push(_templateParameter);
                }
            }
        }
    };


    /**
     * Translate Java Class Node.
     * @param {Element} namespace
     * @param {Object} compilationUnitNode
     */
    JavaAnalyzer.prototype.translateClass = function (options, namespace, classNode) {
        var i, len, _class;

        // Create Class
        _class = new type.UMLClass();
        _class._parent = namespace;
        _class.name = classNode.name;
        _class.visibility = this._getVisibility(classNode.modifiers);
        namespace.ownedElements.push(_class);

        // Register Extends for 2nd Phase Translation
        if (classNode["extends"]) {
            this._extendPendings.push({
                classifier: _class,
                node: classNode["extends"],
                kind: "class"
            });
        }

        // - 1) 타입이 소스에 있는 경우 --> 해당 타입으로 Generalization 생성
        // - 2) 타입이 소스에 없는 경우 (e.g. java.util.ArrayList) --> 타입을 생성(어디에?)한 뒤 Generalization 생성
        // 모든 타입이 생성된 다음에 Generalization (혹은 기타 Relationships)이 연결되어야 하므로, 어딘가에 등록한 다음이 2nd Phase에서 처리.

        // Register Implements for 2nd Phase Translation
        if (classNode["implements"]) {
            for (i = 0, len = classNode["implements"].length; i < len; i++) {
                var _impl = classNode["implements"][i];
                this._implementPendings.push({
                    classifier: _class,
                    node: _impl
                });
            }
        }
        // Translate Type Parameters
        this.translateTypeParameters(options, _class, classNode.typeParameters);
        // Translate Types
        this.translateTypes(options, _class, classNode.body);
        // Translate Members
        this.translateMembers(options, _class, classNode.body);
    };

    /**
     * Translate Java Interface Node.
     * @param {Element} namespace
     * @param {Object} interfaceNode
     */
    JavaAnalyzer.prototype.translateInterface = function (options, namespace, interfaceNode) {
        var i, len, _interface;

        // Create Interface
        _interface = new type.UMLInterface();
        _interface._parent = namespace;
        _interface.name = interfaceNode.name;
        _interface.visibility = this._getVisibility(interfaceNode.modifiers);
        namespace.ownedElements.push(_interface);

        // Register Extends for 2nd Phase Translation
        if (interfaceNode["extends"]) {
            for (i = 0, len = interfaceNode["extends"].length; i < len; i++) {
                var _extend = interfaceNode["extends"][i];
                this._extendPendings.push({
                    classifier: _interface,
                    node: _extend,
                    kind: "interface"
                });
            }
        }

        // Translate Type Parameters
        this.translateTypeParameters(options, _interface, interfaceNode.typeParameters);
        // Translate Types
        this.translateTypes(options, _interface, interfaceNode.body);
        // Translate Members
        this.translateMembers(options, _interface, interfaceNode.body);
    };

    /**
     * Translate Java Enum Node.
     * @param {Element} namespace
     * @param {Object} enumNode
     */
    JavaAnalyzer.prototype.translateEnum = function (options, namespace, enumNode) {
        var _enum;

        // Create Enumeration
        _enum = new type.UMLEnumeration();
        _enum._parent = namespace;
        _enum.name = enumNode.name;
        _enum.visibility = this._getVisibility(enumNode.modifiers);
        namespace.ownedElements.push(_enum);

        // Translate Type Parameters
        this.translateTypeParameters(options, _enum, enumNode.typeParameters);
        // Translate Types
        this.translateTypes(options, _enum, enumNode.body);
        // Translate Members
        this.translateMembers(options, _enum, enumNode.body);
    };

    /**
     * Translate Java AnnotationType Node.
     * @param {Element} namespace
     * @param {Object} annotationTypeNode
     */
    JavaAnalyzer.prototype.translateAnnotationType = function (options, namespace, annotationTypeNode) {
        var _annotationType;

        // Create Class <<annotationType>>
        _annotationType = new type.UMLClass();
        _annotationType._parent = namespace;
        _annotationType.name = annotationTypeNode.name;
        _annotationType.stereotype = "annotationType";
        _annotationType.visibility = this._getVisibility(annotationTypeNode.modifiers);
        namespace.ownedElements.push(_annotationType);

        // Translate Type Parameters
        this.translateTypeParameters(options, _annotationType, annotationTypeNode.typeParameters);
        // Translate Types
        this.translateTypes(options, _annotationType, annotationTypeNode.body);
        // Translate Members
        this.translateMembers(options, _annotationType, annotationTypeNode.body);
    };

    /**
     * Translate Java Field Node as UMLAssociation.
     * @param {Element} namespace
     * @param {Object} fieldNode
     */
    JavaAnalyzer.prototype.translateFieldAsAssociation = function (options, namespace, fieldNode) {
        var i, len;
        if (fieldNode.variables && fieldNode.variables.length > 0) {
            // Add to _associationPendings
            this._associationPendings.push({
                classifier: namespace,
                node: fieldNode
            });
        }
    };

    /**
     * Translate Java Field Node as UMLAttribute.
     * @param {Element} namespace
     * @param {Object} fieldNode
     */
    JavaAnalyzer.prototype.translateFieldAsAttribute = function (options, namespace, fieldNode) {
        var i, len;
        if (fieldNode.variables && fieldNode.variables.length > 0) {
            for (i = 0, len = fieldNode.variables.length; i < len; i++) {
                var variableNode = fieldNode.variables[i];

                // Create Attribute
                var _attribute = new type.UMLAttribute();
                _attribute._parent = namespace;
                _attribute.name = variableNode.name;

                // Modifiers
                _attribute.visibility = this._getVisibility(fieldNode.modifiers);
                if (variableNode.initializer) {
                    _attribute.defaultValue = variableNode.initializer;
                }
                if (_.contains(fieldNode.modifiers, "static")) {
                    _attribute.isStatic = true;
                }
                if (_.contains(fieldNode.modifiers, "final")) {
                    _attribute.isLeaf = true;
                    _attribute.isReadOnly = true;
                }
                // TODO: volatile, transient
                namespace.attributes.push(_attribute);

                // Add to _typedFeaturePendings
                this._typedFeaturePendings.push({
                    namespace: namespace,
                    feature: _attribute,
                    node: fieldNode.type
                });

            }
        }
    };


    /**
     * Translate Method
     */
    JavaAnalyzer.prototype.translateMethod = function (options, namespace, methodNode) {
        var i, len,
            _operation = new type.UMLOperation();
        _operation._parent = namespace;
        _operation.name = methodNode.name;
        namespace.operations.push(_operation);

        // Modifiers
        _operation.visibility = this._getVisibility(methodNode.modifiers);
        if (_.contains(methodNode.modifiers, "static")) {
            _operation.isStatic = true;
        }
        if (_.contains(methodNode.modifiers, "abstract")) {
            _operation.isAbstract = true;
        }
        if (_.contains(methodNode.modifiers, "final")) {
            _operation.isLeaf = true;
        }
        if (_.contains(methodNode.modifiers, "synchronized")) {
            _operation.concurrency = UML.CCK_CONCURRENT;
        }
        // TODO: modifiers: native, strictfp

        // Formal Parameters
        if (methodNode.parameters && methodNode.parameters.length > 0) {
            for (i = 0, len = methodNode.parameters.length; i < len; i++) {
                var parameterNode = methodNode.parameters[i];
                this.translateParameter(options, _operation, parameterNode);
            }
        }

        // Return Type
        if (methodNode.type) {
            var _returnParam = new type.UMLParameter();
            _returnParam._parent = _operation;
            _returnParam.name = "";
            _returnParam.direction = UML.DK_RETURN;
            // Add to _typedFeaturePendings
            this._typedFeaturePendings.push({
                namespace: namespace,
                feature: _returnParam,
                node: methodNode.type
            });
            _operation.parameters.push(_returnParam);
        }

        // Throws
        if (methodNode.throws) {
            for (i = 0, len = methodNode.throws.length; i < len; i++) {
                var _throwNode = methodNode.throws[i];
                this._throwPendings.push({
                    operation: _operation,
                    node: _throwNode
                });
            }
        }

        // Translate Type Parameters
        this.translateTypeParameters(options, _operation, methodNode.typeParameters);
    };

    /**
     * Translate Enumeration Constant
     */
    JavaAnalyzer.prototype.translateEnumConstant = function (options, namespace, enumConstantNode) {
        var _literal = new type.UMLEnumerationLiteral();
        _literal._parent = namespace;
        _literal.name = enumConstantNode.name;
        namespace.literals.push(_literal);
    };


    /**
     * Translate Method Parameters
     */
    JavaAnalyzer.prototype.translateParameter = function (options, namespace, parameterNode) {
        var _parameter = new type.UMLParameter();
        _parameter._parent = namespace;
        _parameter.name = parameterNode.variable.name;
        namespace.parameters.push(_parameter);

        // Add to _typedFeaturePendings
        this._typedFeaturePendings.push({
            namespace: namespace._parent,
            feature: _parameter,
            node: parameterNode.type
        });
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