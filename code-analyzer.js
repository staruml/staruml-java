/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
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

const fs = require('fs')
const path = require('path')
const java7 = require('./grammar/java7')

// Java Primitive Types
var javaPrimitiveTypes = [
  'void',
  'byte',
  'short',
  'int',
  'long',
  'float',
  'double',
  'boolean',
  'char',
  'Byte',
  'Double',
  'Float',
  'Integer',
  'Long',
  'Short',
  'String',
  'Character',
  'java.lang.Byte',
  'java.lang.Double',
  'java.lang.Float',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Short',
  'java.lang.String',
  'java.lang.Character'
]

// Java Collection Types
var javaCollectionTypes = [
  'Collection',
  'Set',
  'SortedSet',
  'NavigableSet',
  'HashSet',
  'TreeSet',
  'LinkedHashSet',
  'List',
  'ArrayList',
  'LinkedList',
  'Deque',
  'ArrayDeque',
  'Queue'
]

// Java Collection Types (full names)
var javaUtilCollectionTypes = javaCollectionTypes.map(c => { return 'java.util.' + c })

/**
 * Java Code Analyzer
 */
class JavaCodeAnalyzer {

  /**
   * @constructor
   */
  constructor () {
    /** @member {type.UMLModel} */
    this._root = new type.UMLModel()
    this._root.name = 'JavaReverse'

    /** @member {Array.<File>} */
    this._files = []

    /** @member {Object} */
    this._currentCompilationUnit = null

    /**
     * @member {{classifier:type.UMLClassifier, node: Object, kind:string}}
     */
    this._extendPendings = []

    /**
     * @member {{classifier:type.UMLClassifier, node: Object}}
     */
    this._implementPendings = []

    /**
     * @member {{classifier:type.UMLClassifier, association: type.UMLAssociation, node: Object}}
     */
    this._associationPendings = []

    /**
     * @member {{operation:type.UMLOperation, node: Object}}
     */
    this._throwPendings = []

    /**
     * @member {{namespace:type.UMLModelElement, feature:type.UMLStructuralFeature, node: Object}}
     */
    this._typedFeaturePendings = []
  }

  /**
   * Add File to Reverse Engineer
   * @param {File} file
   */
  addFile (file) {
    this._files.push(file)
  }

  /**
   * Analyze all files.
   * @param {Object} options
   */
  analyze (options) {
    // Perform 1st Phase
    this.performFirstPhase(options)

    // Perform 2nd Phase
    this.performSecondPhase(options)

    // Load To Project
    var writer = new app.repository.Writer()
    writer.writeObj('data', this._root)
    var json = writer.current.data
    app.project.importFromJson(app.project.getProject(), json)

    // Generate Diagrams
    this.generateDiagrams(options)
    console.log('[Java] done.')
  }

  /**
   * Perform First Phase
   *   - Create Packages, Classes, Interfaces, Enums, AnnotationTypes.
   *
   * @param {Object} options
   */
  performFirstPhase (options) {
    this._files.forEach(file => {
      var data = fs.readFileSync(file, 'utf8')
      try {
        var ast = java7.parse(data)
        this._currentCompilationUnit = ast
        this._currentCompilationUnit.file = file
        this.translateCompilationUnit(options, this._root, ast)
      } catch (ex) {
        console.error('[Java] Failed to parse - ' + file)
        console.error(ex)
      }
    })
  }

  /**
   * Perform Second Phase
   *   - Create Generalizations
   *   - Create InterfaceRealizations
   *   - Create Fields or Associations
   *   - Resolve Type References
   *
   * @param {Object} options
   */
  performSecondPhase (options) {
    var i, len, j, len2, _typeName, _type, _itemTypeName, _itemType, _pathName

    // Create Generalizations
    //     if super type not found, create a Class correspond to the super type.
    for (i = 0, len = this._extendPendings.length; i < len; i++) {
      var _extend = this._extendPendings[i]
      _typeName = _extend.node.qualifiedName.name

      _type = this._findType(_extend.classifier, _typeName, _extend.compilationUnitNode)
      if (!_type) {
        _pathName = this._toPathName(_typeName)
        if (_extend.kind === 'interface') {
          _type = this._ensureInterface(this._root, _pathName)
        } else {
          _type = this._ensureClass(this._root, _pathName)
        }
      }

      var generalization = new type.UMLGeneralization()
      generalization._parent = _extend.classifier
      generalization.source = _extend.classifier
      generalization.target = _type
      _extend.classifier.ownedElements.push(generalization)
    }

    // Create InterfaceRealizations
    //     if super interface not found, create a Interface correspond to the super interface
    for (i = 0, len = this._implementPendings.length; i < len; i++) {
      var _implement = this._implementPendings[i]
      _typeName = _implement.node.qualifiedName.name
      _type = this._findType(_implement.classifier, _typeName, _implement.compilationUnitNode)
      if (!_type) {
        _pathName = this._toPathName(_typeName)
        _type = this._ensureInterface(this._root, _pathName)
      }
      var realization = new type.UMLInterfaceRealization()
      realization._parent = _implement.classifier
      realization.source = _implement.classifier
      realization.target = _type
      _implement.classifier.ownedElements.push(realization)
    }

    // Create Associations
    for (i = 0, len = this._associationPendings.length; i < len; i++) {
      var _asso = this._associationPendings[i]
      _typeName = _asso.node.type.qualifiedName.name
      _type = this._findType(_asso.classifier, _typeName, _asso.node.compilationUnitNode)
      _itemTypeName = this._isGenericCollection(_asso.node.type, _asso.node.compilationUnitNode)
      if (_itemTypeName) {
        _itemType = this._findType(_asso.classifier, _itemTypeName, _asso.node.compilationUnitNode)
      } else {
        _itemType = null
      }

      // if type found, add as Association
      if (_type || _itemType) {
        for (j = 0, len2 = _asso.node.variables.length; j < len2; j++) {
          var variableNode = _asso.node.variables[j]

          // Create Association
          var association = new type.UMLAssociation()
          association._parent = _asso.classifier
          _asso.classifier.ownedElements.push(association)

          // Set End1
          association.end1.reference = _asso.classifier
          association.end1.name = ''
          association.end1.visibility = type.UMLModelElement.VK_PACKAGE
          association.end1.navigable = false

          // Set End2
          if (_itemType) {
            association.end2.reference = _itemType
            association.end2.multiplicity = '*'
            this._addTag(association.end2, type.Tag.TK_STRING, 'collection', _asso.node.type.qualifiedName.name)
          } else {
            association.end2.reference = _type
          }
          association.end2.name = variableNode.name
          association.end2.visibility = this._getVisibility(_asso.node.modifiers)
          association.end2.navigable = true

          // Final Modifier
          if (_asso.node.modifiers && _asso.node.modifiers.includes('final')) {
            association.end2.isReadOnly = true
          }

          // Static Modifier
          if (_asso.node.modifiers && _asso.node.modifiers.includes('static')) {
            this._addTag(association.end2, type.Tag.TK_BOOLEAN, 'static', true)
          }

          // Volatile Modifier
          if (_asso.node.modifiers && _asso.node.modifiers.includes('volatile')) {
            this._addTag(association.end2, type.Tag.TK_BOOLEAN, 'volatile', true)
          }

          // Transient Modifier
          if (_asso.node.modifiers && _asso.node.modifiers.includes('transient')) {
            this._addTag(association.end2, type.Tag.TK_BOOLEAN, 'transient', true)
          }
        }
        // if type not found, add as Attribute
      } else {
        this.translateFieldAsAttribute(options, _asso.classifier, _asso.node)
      }
    }

    // Assign Throws to Operations
    for (i = 0, len = this._throwPendings.length; i < len; i++) {
      var _throw = this._throwPendings[i]
      _typeName = _throw.node.name
      _type = this._findType(_throw.operation, _typeName, _throw.compilationUnitNode)
      if (!_type) {
        _pathName = this._toPathName(_typeName)
        _type = this._ensureClass(this._root, _pathName)
      }
      _throw.operation.raisedExceptions.push(_type)
    }

    // Resolve Type References
    for (i = 0, len = this._typedFeaturePendings.length; i < len; i++) {
      var _typedFeature = this._typedFeaturePendings[i]
      _typeName = _typedFeature.node.type.qualifiedName.name

      // Find type and assign
      _type = this._findType(_typedFeature.namespace, _typeName, _typedFeature.node.compilationUnitNode)

      // if type is exists
      if (_type) {
        _typedFeature.feature.type = _type
        // if type is not exists
      } else {
        // if type is generic collection type (e.g. java.util.List<String>)
        _itemTypeName = this._isGenericCollection(_typedFeature.node.type, _typedFeature.node.compilationUnitNode)
        if (_itemTypeName) {
          _typeName = _itemTypeName
          _typedFeature.feature.multiplicity = '*'
          this._addTag(_typedFeature.feature, type.Tag.TK_STRING, 'collection', _typedFeature.node.type.qualifiedName.name)
        }

        // if type is primitive type
        if (javaPrimitiveTypes.includes(_typeName)) {
          _typedFeature.feature.type = _typeName
          // otherwise
        } else {
          _pathName = this._toPathName(_typeName)
          var _newClass = this._ensureClass(this._root, _pathName)
          _typedFeature.feature.type = _newClass
        }
      }

      // Translate type's arrayDimension to multiplicity
      if (_typedFeature.node.type.arrayDimension && _typedFeature.node.type.arrayDimension.length > 0) {
        var _dim = []
        for (j = 0, len2 = _typedFeature.node.type.arrayDimension.length; j < len2; j++) {
          _dim.push('*')
        }
        _typedFeature.feature.multiplicity = _dim.join(',')
      }
    }
  }

  /**
   * Generate Diagrams (Type Hierarchy, Package Structure, Package Overview)
   * @param {Object} options
   */
  generateDiagrams (options) {
    var baseModel = app.repository.get(this._root._id)
    if (options.packageStructure) {
      app.commands.execute('diagram-generator:package-structure', baseModel, true)
    }
    if (options.typeHierarchy) {
      app.commands.execute('diagram-generator:type-hierarchy', baseModel, true)
    }
    if (options.packageOverview) {
      baseModel.traverse(elem => {
        if (elem instanceof type.UMLPackage) {
          app.commands.execute('diagram-generator:overview', elem, true)
        }
      })
    }
  }

  /**
   * Convert string type name to path name (Array of string)
   * @param {string} typeName
   * @return {Array.<string>} pathName
   */
  _toPathName (typeName) {
    var pathName = (typeName.indexOf('.') > 0 ? typeName.trim().split('.') : null)
    if (!pathName) {
      pathName = [ typeName ]
    }
    return pathName
  }

  /**
   * Find Type.
   *
   * @param {type.Model} namespace
   * @param {string|Object} type Type name string or type node.
   * @param {Object} compilationUnitNode To search type with import statements.
   * @return {type.Model} element correspond to the type.
   */
  _findType (namespace, type, compilationUnitNode) {
    var typeName, pathName
    var _type = null

    if (type.node === 'Type') {
      typeName = type.qualifiedName.name
    } else if (typeof type === 'string') {
      typeName = type
    }

    pathName = this._toPathName(typeName)

    // 1. Lookdown from context
    if (pathName.length > 1) {
      _type = namespace.lookdown(pathName)
    } else {
      _type = namespace.findByName(typeName)
    }

    // 2. Lookup from context
    if (!_type) {
      _type = namespace.lookup(typeName, null, this._root)
    }

    // 3. Find from imported namespaces
    if (!_type) {
      if (compilationUnitNode.imports) {
        var i, len
        for (i = 0, len = compilationUnitNode.imports.length; i < len; i++) {
          var _import = compilationUnitNode.imports[i]
          // Find in wildcard imports (e.g. import java.lang.*)
          if (_import.wildcard) {
            var _namespace = this._root.lookdown(_import.qualifiedName.name)
            if (_namespace) {
              _type = _namespace.findByName(typeName)
            }
            // Find in import exact matches (e.g. import java.lang.String)
          } else {
            _type = this._root.lookdown(_import.qualifiedName.name)
          }
        }
      }
    }

    // 4. Lookdown from Root
    if (!_type) {
      if (pathName.length > 1) {
        _type = this._root.lookdown(pathName)
      } else {
        _type = this._root.findByName(typeName)
      }
    }

    return _type
  }

  /**
   * Return visiblity from modifiers
   *
   * @param {Array.<string>} modifiers
   * @return {string} Visibility constants for UML Elements
   */
  _getVisibility (modifiers) {
    if (modifiers) {
      if (modifiers.includes('public')) {
        return type.UMLModelElement.VK_PUBLIC
      } else if (modifiers.includes('protected')) {
        return type.UMLModelElement.VK_PROTECTED
      } else if (modifiers.includes('private')) {
        return type.UMLModelElement.VK_PRIVATE
      }
    }
    return type.UMLModelElement.VK_PACKAGE
  }

  /**
   * Add a Tag
   * @param {type.Model} elem
   * @param {string} kind Kind of Tag
   * @param {string} name
   * @param {?} value Value of Tag
   */
  _addTag (elem, kind, name, value) {
    var tag = new type.Tag()
    tag._parent = elem
    tag.name = name
    tag.kind = kind
    switch (kind) {
    case type.Tag.TK_STRING:
      tag.value = value
      break
    case type.Tag.TK_BOOLEAN:
      tag.checked = value
      break
    case type.Tag.TK_NUMBER:
      tag.number = value
      break
    case type.Tag.TK_REFERENCE:
      tag.reference = value
      break
    case type.Tag.TK_HIDDEN:
      tag.value = value
      break
    }
    elem.tags.push(tag)
  }

  /**
   * Return the package of a given pathNames. If not exists, create the package.
   * @param {type.Model} namespace
   * @param {Array.<string>} pathNames
   * @return {type.Model} Package element corresponding to the pathNames
   */
  _ensurePackage (namespace, pathNames) {
    if (pathNames.length > 0) {
      var name = pathNames.shift()
      if (name && name.length > 0) {
        var elem = namespace.findByName(name)
        if (elem !== null) {
          // Package exists
          if (pathNames.length > 0) {
            return this._ensurePackage(elem, pathNames)
          } else {
            return elem
          }
        } else {
          // Package not exists, then create one.
          var _package = new type.UMLPackage()
          namespace.ownedElements.push(_package)
          _package._parent = namespace
          _package.name = name
          if (pathNames.length > 0) {
            return this._ensurePackage(_package, pathNames)
          } else {
            return _package
          }
        }
      }
    } else {
      return namespace
    }
  }

  /**
  * Return the class of a given pathNames. If not exists, create the class.
  * @param {type.Model} namespace
  * @param {Array.<string>} pathNames
  * @return {type.Model} Class element corresponding to the pathNames
  */
  _ensureClass (namespace, pathNames) {
    if (pathNames.length > 0) {
      var _className = pathNames.pop()
      var _package = this._ensurePackage(namespace, pathNames)
      var _class = _package.findByName(_className)
      if (!_class) {
        _class = new type.UMLClass()
        _class._parent = _package
        _class.name = _className
        _class.visibility = type.UMLModelElement.VK_PUBLIC
        _package.ownedElements.push(_class)
      }
      return _class
    }
    return null
  }

  /**
   * Return the interface of a given pathNames. If not exists, create the interface.
   * @param {type.Model} namespace
   * @param {Array.<string>} pathNames
   * @return {type.Model} Interface element corresponding to the pathNames
   */
  _ensureInterface (namespace, pathNames) {
    if (pathNames.length > 0) {
      var _interfaceName = pathNames.pop()
      var _package = this._ensurePackage(namespace, pathNames)
      var _interface = _package.findByName(_interfaceName)
      if (!_interface) {
        _interface = new type.UMLInterface()
        _interface._parent = _package
        _interface.name = _interfaceName
        _interface.visibility = type.UMLModelElement.VK_PUBLIC
        _package.ownedElements.push(_interface)
      }
      return _interface
    }
    return null
  }

  /**
   * Test a given type is a generic collection or not
   * @param {Object} typeNode
   * @return {string} Collection item type name
   */
  _isGenericCollection (typeNode, compilationUnitNode) {
    if (typeNode.qualifiedName.typeParameters && typeNode.qualifiedName.typeParameters.length > 0) {
      var _collectionType = typeNode.qualifiedName.name
      var _itemType = typeNode.qualifiedName.typeParameters[0].name

      // Used Full name (e.g. java.util.List)
      if (javaUtilCollectionTypes.includes(_collectionType)) {
        return _itemType
      }

      // Used name with imports (e.g. List and import java.util.List or java.util.*)
      if (javaCollectionTypes.includes(_collectionType)) {
        if (compilationUnitNode.imports) {
          var i, len
          for (i = 0, len = compilationUnitNode.imports.length; i < len; i++) {
            var _import = compilationUnitNode.imports[i]

            // Full name import (e.g. import java.util.List)
            if (_import.qualifiedName.name === 'java.util.' + _collectionType) {
              return _itemType
            }

            // Wildcard import (e.g. import java.util.*)
            if (_import.qualifiedName.name === 'java.util' && _import.wildcard) {
              return _itemType
            }
          }
        }
      }
    }
    return null
  }

  /**
   * Translate Java CompilationUnit Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} compilationUnitNode
   */
  translateCompilationUnit (options, namespace, compilationUnitNode) {
    var _namespace = namespace

    if (compilationUnitNode['package']) {
      var _package = this.translatePackage(options, namespace, compilationUnitNode['package'])
      if (_package !== null) {
        _namespace = _package
      }
    }

    // Translate Types
    this.translateTypes(options, _namespace, compilationUnitNode.types)
  }

  /**
   * Translate Type Nodes
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Array.<Object>} typeNodeArray
   */
  translateTypes (options, namespace, typeNodeArray) {
    var i, len
    if (Array.isArray(typeNodeArray) && typeNodeArray.length > 0) {
      for (i = 0, len = typeNodeArray.length; i < len; i++) {
        var typeNode = typeNodeArray[i]
        switch (typeNode.node) {
        case 'Class':
          this.translateClass(options, namespace, typeNode)
          break
        case 'Interface':
          this.translateInterface(options, namespace, typeNode)
          break
        case 'Enum':
          this.translateEnum(options, namespace, typeNode)
          break
        case 'AnnotationType':
          this.translateAnnotationType(options, namespace, typeNode)
          break
        }
      }
    }
  }

  /**
   * Translate Java Package Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} compilationUnitNode
   */
  translatePackage (options, namespace, packageNode) {
    if (packageNode && packageNode.qualifiedName && packageNode.qualifiedName.name) {
      var pathNames = packageNode.qualifiedName.name.split('.')
      return this._ensurePackage(namespace, pathNames)
    }
    return null
  }

  /**
   * Translate Members Nodes
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Array.<Object>} memberNodeArray
   */
  translateMembers (options, namespace, memberNodeArray) {
    var i, len
    if (Array.isArray(memberNodeArray) && memberNodeArray.length > 0) {
      for (i = 0, len = memberNodeArray.length; i < len; i++) {
        var memberNode = memberNodeArray[i]
        if (memberNode && (typeof memberNode.node === 'string')) {
          var visibility = this._getVisibility(memberNode.modifiers)

          // Generate public members only if publicOnly == true
          if (options.publicOnly && visibility !== type.UMLModelElement.VK_PUBLIC) {
            continue
          }

          memberNode.compilationUnitNode = this._currentCompilationUnit

          switch (memberNode.node) {
          case 'Field':
            if (options.association) {
              this.translateFieldAsAssociation(options, namespace, memberNode)
            } else {
              this.translateFieldAsAttribute(options, namespace, memberNode)
            }
            break
          case 'Constructor':
            this.translateMethod(options, namespace, memberNode, true)
            break
          case 'Method':
            this.translateMethod(options, namespace, memberNode)
            break
          case 'EnumConstant':
            this.translateEnumConstant(options, namespace, memberNode)
            break
          }
        }
      }
    }
  }

  /**
   * Translate Java Type Parameter Nodes.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} typeParameterNodeArray
   */
  translateTypeParameters (options, namespace, typeParameterNodeArray) {
    if (Array.isArray(typeParameterNodeArray)) {
      var i, len, _typeParam
      for (i = 0, len = typeParameterNodeArray.length; i < len; i++) {
        _typeParam = typeParameterNodeArray[i]
        if (_typeParam.node === 'TypeParameter') {
          var _templateParameter = new type.UMLTemplateParameter()
          _templateParameter._parent = namespace
          _templateParameter.name = _typeParam.name
          if (_typeParam.type) {
            _templateParameter.parameterType = _typeParam.type
          }
          namespace.templateParameters.push(_templateParameter)
        }
      }
    }
  }

  /**
   * Translate Java Class Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} compilationUnitNode
   */
  translateClass (options, namespace, classNode) {
    var i, len, _class

    // Create Class
    _class = new type.UMLClass()
    _class._parent = namespace
    _class.name = classNode.name

    // Access Modifiers
    _class.visibility = this._getVisibility(classNode.modifiers)

    // Abstract Class
    if (classNode.modifiers && classNode.modifiers.includes('abstract')) {
      _class.isAbstract = true
    }

    // Final Class
    if (classNode.modifiers && classNode.modifiers.includes('final')) {
      _class.isFinalSpecialization = true
      _class.isLeaf = true
    }

    // JavaDoc
    if (classNode.comment) {
      _class.documentation = classNode.comment
    }

    namespace.ownedElements.push(_class)

    // Register Extends for 2nd Phase Translation
    if (classNode['extends']) {
      var _extendPending = {
        classifier: _class,
        node: classNode['extends'],
        kind: 'class',
        compilationUnitNode: this._currentCompilationUnit
      }
      this._extendPendings.push(_extendPending)
    }

    // - 1) 타입이 소스에 있는 경우 --> 해당 타입으로 Generalization 생성
    // - 2) 타입이 소스에 없는 경우 (e.g. java.util.ArrayList) --> 타입을 생성(어디에?)한 뒤 Generalization 생성
    // 모든 타입이 생성된 다음에 Generalization (혹은 기타 Relationships)이 연결되어야 하므로, 어딘가에 등록한 다음이 2nd Phase에서 처리.

    // Register Implements for 2nd Phase Translation
    if (classNode['implements']) {
      for (i = 0, len = classNode['implements'].length; i < len; i++) {
        var _impl = classNode['implements'][i]
        var _implementPending = {
          classifier: _class,
          node: _impl,
          compilationUnitNode: this._currentCompilationUnit
        }
        this._implementPendings.push(_implementPending)
      }
    }
    // Translate Type Parameters
    this.translateTypeParameters(options, _class, classNode.typeParameters)
    // Translate Types
    this.translateTypes(options, _class, classNode.body)
    // Translate Members
    this.translateMembers(options, _class, classNode.body)
  }

  /**
   * Translate Java Interface Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} interfaceNode
   */
  translateInterface (options, namespace, interfaceNode) {
    var i, len, _interface

    // Create Interface
    _interface = new type.UMLInterface()
    _interface._parent = namespace
    _interface.name = interfaceNode.name
    _interface.visibility = this._getVisibility(interfaceNode.modifiers)

    // JavaDoc
    if (interfaceNode.comment) {
      _interface.documentation = interfaceNode.comment
    }

    namespace.ownedElements.push(_interface)

    // Register Extends for 2nd Phase Translation
    if (interfaceNode['extends']) {
      for (i = 0, len = interfaceNode['extends'].length; i < len; i++) {
        var _extend = interfaceNode['extends'][i]
        this._extendPendings.push({
          classifier: _interface,
          node: _extend,
          kind: 'interface',
          compilationUnitNode: this._currentCompilationUnit
        })
      }
    }

    // Translate Type Parameters
    this.translateTypeParameters(options, _interface, interfaceNode.typeParameters)
    // Translate Types
    this.translateTypes(options, _interface, interfaceNode.body)
    // Translate Members
    this.translateMembers(options, _interface, interfaceNode.body)
  }

  /**
   * Translate Java Enum Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} enumNode
   */
  translateEnum (options, namespace, enumNode) {
    var _enum

    // Create Enumeration
    _enum = new type.UMLEnumeration()
    _enum._parent = namespace
    _enum.name = enumNode.name
    _enum.visibility = this._getVisibility(enumNode.modifiers)

    // JavaDoc
    if (enumNode.comment) {
      _enum.documentation = enumNode.comment
    }

    namespace.ownedElements.push(_enum)

    // Translate Type Parameters
    this.translateTypeParameters(options, _enum, enumNode.typeParameters)
    // Translate Types
    this.translateTypes(options, _enum, enumNode.body)
    // Translate Members
    this.translateMembers(options, _enum, enumNode.body)
  }

  /**
   * Translate Java AnnotationType Node.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} annotationTypeNode
   */
  translateAnnotationType (options, namespace, annotationTypeNode) {
    var _annotationType

    // Create Class <<annotationType>>
    _annotationType = new type.UMLClass()
    _annotationType._parent = namespace
    _annotationType.name = annotationTypeNode.name
    _annotationType.stereotype = 'annotationType'
    _annotationType.visibility = this._getVisibility(annotationTypeNode.modifiers)

    // JavaDoc
    if (annotationTypeNode.comment) {
      _annotationType.documentation = annotationTypeNode.comment
    }

    namespace.ownedElements.push(_annotationType)

    // Translate Type Parameters
    this.translateTypeParameters(options, _annotationType, annotationTypeNode.typeParameters)
    // Translate Types
    this.translateTypes(options, _annotationType, annotationTypeNode.body)
    // Translate Members
    this.translateMembers(options, _annotationType, annotationTypeNode.body)
  }

  /**
   * Translate Java Field Node as UMLAssociation.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} fieldNode
   */
  translateFieldAsAssociation (options, namespace, fieldNode) {
    if (fieldNode.variables && fieldNode.variables.length > 0) {
      // Add to _associationPendings
      var _associationPending = {
        classifier: namespace,
        node: fieldNode
      }
      this._associationPendings.push(_associationPending)
    }
  }

  /**
   * Translate Java Field Node as UMLAttribute.
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} fieldNode
   */
  translateFieldAsAttribute (options, namespace, fieldNode) {
    var i, len
    if (fieldNode.variables && fieldNode.variables.length > 0) {
      for (i = 0, len = fieldNode.variables.length; i < len; i++) {
        var variableNode = fieldNode.variables[i]

        // Create Attribute
        var _attribute = new type.UMLAttribute()
        _attribute._parent = namespace
        _attribute.name = variableNode.name

        // Access Modifiers
        _attribute.visibility = this._getVisibility(fieldNode.modifiers)
        if (variableNode.initializer) {
          _attribute.defaultValue = variableNode.initializer
        }

        // Static Modifier
        if (fieldNode.modifiers && fieldNode.modifiers.includes('static')) {
          _attribute.isStatic = true
        }

        // Final Modifier
        if (fieldNode.modifiers && fieldNode.modifiers.includes('final')) {
          _attribute.isLeaf = true
          _attribute.isReadOnly = true
        }

        // Volatile Modifier
        if (fieldNode.modifiers && fieldNode.modifiers.includes('volatile')) {
          this._addTag(_attribute, type.Tag.TK_BOOLEAN, 'volatile', true)
        }

        // Transient Modifier
        if (fieldNode.modifiers && fieldNode.modifiers.includes('transient')) {
          this._addTag(_attribute, type.Tag.TK_BOOLEAN, 'transient', true)
        }

        // JavaDoc
        if (fieldNode.comment) {
          _attribute.documentation = fieldNode.comment
        }

        namespace.attributes.push(_attribute)

        // Add to _typedFeaturePendings
        var _typedFeature = {
          namespace: namespace,
          feature: _attribute,
          node: fieldNode
        }
        this._typedFeaturePendings.push(_typedFeature)
      }
    }
  }

  /**
   * Translate Method
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} methodNode
   * @param {boolean} isConstructor
   */
  translateMethod (options, namespace, methodNode, isConstructor) {
    var i, len
    var _operation = new type.UMLOperation()
    _operation._parent = namespace
    _operation.name = methodNode.name
    namespace.operations.push(_operation)

    // Modifiers
    _operation.visibility = this._getVisibility(methodNode.modifiers)
    if (methodNode.modifiers && methodNode.modifiers.includes('static')) {
      _operation.isStatic = true
    }
    if (methodNode.modifiers && methodNode.modifiers.includes('abstract')) {
      _operation.isAbstract = true
    }
    if (methodNode.modifiers && methodNode.modifiers.includes('final')) {
      _operation.isLeaf = true
    }
    if (methodNode.modifiers && methodNode.modifiers.includes('synchronized')) {
      _operation.concurrency = type.UMLBehavioralFeature.CCK_CONCURRENT
    }
    if (methodNode.modifiers && methodNode.modifiers.includes('native')) {
      this._addTag(_operation, type.Tag.TK_BOOLEAN, 'native', true)
    }
    if (methodNode.modifiers && methodNode.modifiers.includes('strictfp')) {
      this._addTag(_operation, type.Tag.TK_BOOLEAN, 'strictfp', true)
    }

    // Constructor
    if (isConstructor) {
      _operation.stereotype = 'constructor'
    }

    // Stuff to do here to grab the correct Javadoc and put it into parameters and return

    // Formal Parameters
    if (methodNode.parameters && methodNode.parameters.length > 0) {
      for (i = 0, len = methodNode.parameters.length; i < len; i++) {
        var parameterNode = methodNode.parameters[i]
        parameterNode.compilationUnitNode = methodNode.compilationUnitNode
        this.translateParameter(options, _operation, parameterNode)
      }
    }

    // Return Type
    if (methodNode.type) {
      var _returnParam = new type.UMLParameter()
      _returnParam._parent = _operation
      _returnParam.name = ''
      _returnParam.direction = type.UMLParameter.DK_RETURN
      // Add to _typedFeaturePendings
      this._typedFeaturePendings.push({
        namespace: namespace,
        feature: _returnParam,
        node: methodNode
      })
      _operation.parameters.push(_returnParam)
    }

    // Throws
    if (methodNode.throws) {
      for (i = 0, len = methodNode.throws.length; i < len; i++) {
        var _throwNode = methodNode.throws[i]
        var _throwPending = {
          operation: _operation,
          node: _throwNode,
          compilationUnitNode: methodNode.compilationUnitNode
        }
        this._throwPendings.push(_throwPending)
      }
    }

    // JavaDoc
    if (methodNode.comment) {
      _operation.documentation = methodNode.comment
    }

    // "default" for Annotation Type Element
    if (methodNode.defaultValue) {
      this._addTag(_operation, type.Tag.TK_STRING, 'default', methodNode.defaultValue)
    }

    // Translate Type Parameters
    this.translateTypeParameters(options, _operation, methodNode.typeParameters)
  }

  /**
   * Translate Enumeration Constant
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} enumConstantNode
   */
  translateEnumConstant (options, namespace, enumConstantNode) {
    var _literal = new type.UMLEnumerationLiteral()
    _literal._parent = namespace
    _literal.name = enumConstantNode.name

    // JavaDoc
    if (enumConstantNode.comment) {
      _literal.documentation = enumConstantNode.comment
    }

    namespace.literals.push(_literal)
  }

  /**
   * Translate Method Parameters
   * @param {Object} options
   * @param {type.Model} namespace
   * @param {Object} parameterNode
   */
  translateParameter (options, namespace, parameterNode) {
    var _parameter = new type.UMLParameter()
    _parameter._parent = namespace
    _parameter.name = parameterNode.variable.name
    namespace.parameters.push(_parameter)

    // Add to _typedFeaturePendings
    this._typedFeaturePendings.push({
      namespace: namespace._parent,
      feature: _parameter,
      node: parameterNode
    })
  }
}

/**
 * Analyze all java files in basePath
 * @param {string} basePath
 * @param {Object} options
 */
function analyze (basePath, options) {
  var javaAnalyzer = new JavaCodeAnalyzer()

  function visit (base) {
    var stat = fs.lstatSync(base)
    if (stat.isFile()) {
      var ext = path.extname(base).toLowerCase()
      if (ext === '.java') {
        javaAnalyzer.addFile(base)
      }
    } else if (stat.isDirectory()) {
      var files = fs.readdirSync(base)
      if (files && files.length > 0) {
        files.forEach(entry => {
          var fullPath = path.join(base, entry)
          visit(fullPath)
        })
      }
    }
  }

  // Traverse all file entries
  visit(basePath)

  // Perform reverse engineering
  javaAnalyzer.analyze(options)
}

exports.analyze = analyze
