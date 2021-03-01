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
const codegen = require('./codegen-utils')

/**
 * Return element's full path including parent's classes or interfaces
 * @param {type.Model} elem
 * @param {Array.<String>} imports Used to collect import declarations
 * @return {string}
 */
function getElemPath (elem, imports, curPackage) {
  // find package of elem and whole _type string with parents' decarations
  var owner = elem._parent
  var _name = elem.name
  while (owner instanceof type.UMLClass || owner instanceof type.UMLInterface) {
    if (owner.name.length > 0) {
      _name = owner.name +'.'+ _name
    } else {
      _name = '.'+ _name
    }
    elem = owner
    owner = owner._parent
  }

  // generate _import as fullpath of owner package
  var _fullImport = elem.name
  var _import = ''
  if (owner != null && owner != curPackage) {
    while (owner instanceof type.UMLPackage) {
      _import = _fullImport //ignore final root package that would be view point
      _fullImport = owner.name + '.' + _fullImport
      owner = owner._parent
    }
    imports.add(_import)
  }

  return _name
}

/**
 * Java Code Generator
 */
class JavaCodeGenerator {

  /**
   * @constructor
   *
   * @param {type.UMLPackage} baseModel
   * @param {string} basePath generated files and directories to be placed
   */
  constructor (baseModel, basePath) {
    /** @member {type.Model} */
    this.baseModel = baseModel

    /** @member {string} */
    this.basePath = basePath
  }

  /**
   * Return Indent String based on options
   * @param {Object} options
   * @return {string}
   */
  getIndentString (options) {
    if (options.useTab) {
      return '\t'
    } else {
      var i
      var len
      var indent = []
      for (i = 0, len = options.indentSpaces; i < len; i++) {
        indent.push(' ')
      }
      return indent.join('')
    }
  }

  /**
   * Generate codes from a given element
   * @param {type.Model} elem
   * @param {string} basePath
   * @param {Object} options
   * @param {Object} curPackage
   */
  generate (elem, basePath, options, curPackage) {
    var fullPath
    var codeWriter
    var codeWriter2

    var imports = new Set()

    // Package
    if (elem instanceof type.UMLPackage) {
      fullPath = path.join(basePath, elem.name)
      fs.mkdirSync(fullPath)
      if (Array.isArray(elem.ownedElements)) {
        elem.ownedElements.forEach(child => {
          return this.generate(child, fullPath, options, elem)
        })
      }
    } else if (elem instanceof type.UMLClass) {
      // AnnotationType
      if (elem.stereotype === 'annotationType') {
        fullPath = path.join(basePath, elem.name + '.java')
        codeWriter = new codegen.CodeWriter(this.getIndentString(options))
        this.writePackageDeclaration(codeWriter, elem, options, imports, curPackage)
        
        codeWriter2 = new codegen.CodeWriter(this.getIndentString(options))
        this.writeAnnotationType(codeWriter2, elem, options, imports, curPackage)

        if (imports.size > 0) {
          codeWriter.writeLine()
          imports.forEach(function(v,i,s) {codeWriter.writeLine('import ' + v + ';')})
        }
        codeWriter.writeLine()
        codeWriter.writeLine('import java.util.*;')
        codeWriter.writeLine('\n')

        fs.writeFileSync(fullPath, codeWriter.getData() + codeWriter2.getData())
      // Class
      } else {
        fullPath = basePath + '/' + elem.name + '.java'
        codeWriter = new codegen.CodeWriter(this.getIndentString(options))
        this.writePackageDeclaration(codeWriter, elem, options, imports, curPackage)

        codeWriter2 = new codegen.CodeWriter(this.getIndentString(options))
        this.writeClass(codeWriter2, elem, options, imports, curPackage)
        
        if (imports.size > 0) {
          codeWriter.writeLine()
          imports.forEach(function(v,i,s) {codeWriter.writeLine('import ' + v + ';')})
        }
        codeWriter.writeLine()
        codeWriter.writeLine('import java.util.*;')
        codeWriter.writeLine('\n')

        fs.writeFileSync(fullPath, codeWriter.getData() + codeWriter2.getData())
      }

    // Interface
    } else if (elem instanceof type.UMLInterface) {
      fullPath = basePath + '/' + elem.name + '.java'
      codeWriter = new codegen.CodeWriter(this.getIndentString(options))
      this.writePackageDeclaration(codeWriter, elem, options, imports, curPackage)
      
      codeWriter2 = new codegen.CodeWriter(this.getIndentString(options))
      this.writeInterface(codeWriter2, elem, options, imports, curPackage)
      
      if (imports.size > 0) {
        codeWriter.writeLine()
        imports.forEach(function(v,i,s) {codeWriter.writeLine('import ' + v + ';')})
      }
      codeWriter.writeLine()
      codeWriter.writeLine('import java.util.*;')
      codeWriter.writeLine('\n')

      fs.writeFileSync(fullPath, codeWriter.getData() + codeWriter2.getData())

    // Enum
    } else if (elem instanceof type.UMLEnumeration) {
      fullPath = basePath + '/' + elem.name + '.java'
      codeWriter = new codegen.CodeWriter(this.getIndentString(options))
      this.writePackageDeclaration(codeWriter, elem, options, imports, curPackage)

      codeWriter2 = new codegen.CodeWriter(this.getIndentString(options))
      this.writeEnum(codeWriter2, elem, options, imports, curPackage)
      
      if (imports.size > 0) {
        codeWriter.writeLine()
        imports.forEach(function(v,i,s) {codeWriter.writeLine('import ' + v + ';')})
      }
      codeWriter.writeLine('\n')

      fs.writeFileSync(fullPath, codeWriter.getData() + codeWriter2.getData())
    }
  }

  /**
   * Return visibility
   * @param {type.Model} elem
   * @return {string}
   */
  getVisibility (elem) {
    switch (elem.visibility) {
    case type.UMLModelElement.VK_PUBLIC:
      return 'public'
    case type.UMLModelElement.VK_PROTECTED:
      return 'protected'
    case type.UMLModelElement.VK_PRIVATE:
      return 'private'
    }
    return null
  }

  /**
   * Collect modifiers of a given element.
   * @param {type.Model} elem
   * @return {Array.<string>}
   */
  getModifiers (elem) {
    var modifiers = []
    var visibility = this.getVisibility(elem)
    if (visibility) {
      modifiers.push(visibility)
    }
    if (elem.isStatic === true) {
      modifiers.push('static')
    }
    if (elem.isAbstract === true) {
      modifiers.push('abstract')
    }
    if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
      modifiers.push('final')
    }
    if (elem.concurrency === type.UMLBehavioralFeature.CCK_CONCURRENT) {
      modifiers.push('synchronized')
    }
    // transient
    // strictfp
    // const
    // native
    return modifiers
  }

  /**
   * Collect super classes of a given element
   * @param {type.Model} elem
   * @return {Array.<type.Model>}
   */
  getSuperClasses (elem) {
    var generalizations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLGeneralization && rel.source === elem)
    })
    return generalizations.map(function (gen) { return gen.target })
  }

  /**
   * Collect super interfaces of a given element
   * @param {type.Model} elem
   * @return {Array.<type.Model>}
   */
  getSuperInterfaces (elem) {
    var realizations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLInterfaceRealization && rel.source === elem)
    })
    return realizations.map(function (gen) { return gen.target })
  }

  /**
   * Return type expression
   * @param {type.Model} elem
   * @param {Array.<String>} imports Used to collect import declarations
   * @return {string}
   */
  getType (elem, imports, curPackage) {
    var _type = 'void'
    var typeElem = null
    
    // type name
    if (elem instanceof type.UMLAssociationEnd) {
      if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
        typeElem = elem.reference
        // inner types need add owner's name as prefix
        _type = getElemPath(typeElem, imports, curPackage)
      }      
    } else {
      if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {        
        typeElem = elem.type
        // inner types need add owner's name as prefix
        _type = getElemPath(typeElem, imports, curPackage)
      } else if ((typeof elem.type === 'string') && elem.type.length > 0) {
        _type = elem.type
      }
    }
    
    // multiplicity
    if (elem.multiplicity) {
      if (['0..*', '1..*', '*'].includes(elem.multiplicity.trim())) {
        if (elem.isOrdered === true) {
          _type = 'List<' + _type + '>'
        } else {
          _type = 'Set<' + _type + '>'
        }
      } else if (elem.multiplicity !== '1' && elem.multiplicity.match(/^\d+$/)) { // number
        _type += '[]'
      }
    }
    return _type
  }

  /**
   * Write Doc
   * @param {StringWriter} codeWriter
   * @param {string} text
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeDoc (codeWriter, text, options, imports, curPackage) {
    var i, len, lines
    if (options.javaDoc && (typeof text === 'string')) {
      lines = text.trim().split('\n')
      codeWriter.writeLine('/**')
      for (i = 0, len = lines.length; i < len; i++) {
        codeWriter.writeLine(' * ' + lines[i])
      }
      codeWriter.writeLine(' */')
    }
  }

  /**
   * Write Package Declaration
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writePackageDeclaration (codeWriter, elem, options, imports, curPackage) {
    var packagePath = null
    if (elem._parent) {
      packagePath = elem._parent.getPath(this.baseModel).map(function (e) { return e.name }).join('.')
    }
    if (packagePath) {
      codeWriter.writeLine('package ' + packagePath + ';')
    }
  }

  /**
   * Write Constructor
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeConstructor (codeWriter, elem, options, imports, curPackage) {
    if (elem.name.length > 0) {
      var terms = []
      // Doc
      this.writeDoc(codeWriter, 'Default constructor', options, imports, curPackage)
      // Visibility
      var visibility = this.getVisibility(elem)
      if (visibility) {
        terms.push(visibility)
      }
      terms.push(elem.name + '()')
      codeWriter.writeLine(terms.join(' ') + ' {')
      codeWriter.writeLine('}')
    }
  }

  /**
   * Write Member Variable
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeMemberVariable (codeWriter, elem, options, imports, curPackage) {
    if (elem.name.length > 0) {
      var terms = []
      // doc
      this.writeDoc(codeWriter, elem.documentation, options, imports, curPackage)
      // modifiers
      var _modifiers = this.getModifiers(elem)
      if (_modifiers.length > 0) {
        terms.push(_modifiers.join(' '))
      }
      // type
      terms.push(this.getType(elem, imports, curPackage))
      // name
      terms.push(elem.name)
      // initial value
      if (elem.defaultValue && elem.defaultValue.length > 0) {
        terms.push('= ' + elem.defaultValue)
      }
      codeWriter.writeLine(terms.join(' ') + ';')
    }
  }

  /**
   * Write Method
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {type.Model} owner
   * @param {Object} options
   * @param {boolean} skipBody
   * @param {boolean} skipParams
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeMethod (codeWriter, elem, owner, options, skipBody, skipParams, imports, curPackage) {
    if (elem.name.length > 0) {
      var terms = []
      var params = elem.getNonReturnParameters()
      var returnParam = elem.getReturnParameter()

      // doc
      var doc = elem.documentation.trim()

      // Erase Javadoc @param and @return
      var i
      var lines = doc.split('\n')
      doc = ''
      for (i = 0, len = lines.length; i < len; i++) {
        if (lines[i].lastIndexOf('@param', 0) !== 0 && lines[i].lastIndexOf('@return', 0) !== 0) {
          doc += '\n' + lines[i]
        }
      }

      params.forEach(function (param) {
        doc += '\n@param ' + param.name + ' ' + param.documentation
      })
      if (returnParam) {
        doc += '\n@return ' + returnParam.documentation
      }
      this.writeDoc(codeWriter, doc, options, imports, curPackage)

      // modifiers
      var _modifiers = this.getModifiers(elem)
      if (_modifiers.length > 0) {
        terms.push(_modifiers.join(' '))
      }

      // type
      if (returnParam) {
        terms.push(this.getType(returnParam, imports, curPackage))
      } else {
        if (elem.name === owner.name) {
          //constructor has no return
        }else{
          terms.push('void') 
        }
      }

      // name + parameters
      var paramTerms = []
      if (!skipParams) {
        var len
        for (i = 0, len = params.length; i < len; i++) {
          var p = params[i]
          var s = this.getType(p, imports, curPackage) + ' ' + p.name
          if (p.isReadOnly === true) {
            s = 'final ' + s
          }
          paramTerms.push(s)
        }
      }
      terms.push(elem.name + '(' + paramTerms.join(', ') + ')')

      // body
      if (skipBody === true || _modifiers.includes('abstract')) {
        codeWriter.writeLine(terms.join(' ') + ';')
      } else {
        codeWriter.writeLine(terms.join(' ') + ' {')
        codeWriter.indent()
        codeWriter.writeLine('// TODO implement here')

        // return statement
        if (returnParam) {
          var returnType = this.getType(returnParam, imports, curPackage)
          if (returnType === 'boolean') {
            codeWriter.writeLine('return false;')
          } else if (returnType === 'int' || returnType === 'long' || returnType === 'short' || returnType === 'byte') {
            codeWriter.writeLine('return 0;')
          } else if (returnType === 'float') {
            codeWriter.writeLine('return 0.0f;')
          } else if (returnType === 'double') {
            codeWriter.writeLine('return 0.0d;')
          } else if (returnType === 'char') {
            codeWriter.writeLine('return "0";')
          } else if (returnType === 'String') {
            codeWriter.writeLine('return "";')
          } else {
            codeWriter.writeLine('return null;')
          }
        }

        codeWriter.outdent()
        codeWriter.writeLine('}')
      }
    }
  }

  /**
   * Write Class
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeClass (codeWriter, elem, options, imports, curPackage) {
    var i, len
    var terms = []

    // Doc
    var doc = elem.documentation.trim()
    if (app.project.getProject().author && app.project.getProject().author.length > 0) {
      doc += '\n@author ' + app.project.getProject().author
    }
    this.writeDoc(codeWriter, doc, options, imports, curPackage)

    // Modifiers
    var _modifiers = this.getModifiers(elem)
    if (_modifiers.includes('abstract') !== true && elem.operations.some(function (op) { return op.isAbstract === true })) {
      _modifiers.push('abstract')
    }
    if (_modifiers.length > 0) {
      terms.push(_modifiers.join(' '))
    }

    // Class
    terms.push('class')
    terms.push(elem.name)

    // Extends
    var _extends = this.getSuperClasses(elem)
    if (_extends.length > 0) {
      terms.push('extends ' + getElemPath(_extends[0], imports, curPackage))
    }

    // Implements
    var _implements = this.getSuperInterfaces(elem)
    if (_implements.length > 0) {
      terms.push('implements ' + _implements.map(function (e) {return getElemPath(e, imports, curPackage)}).join(', '))
    }
    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.writeLine()
    codeWriter.indent()

    // Constructor
    this.writeConstructor(codeWriter, elem, options, imports, curPackage)
    codeWriter.writeLine()

    // Member Variables
    // (from attributes)
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options, imports, curPackage)
      codeWriter.writeLine()
    }
    // (from associations)
    var associations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLAssociation)
    })
    for (i = 0, len = associations.length; i < len; i++) {
      var asso = associations[i]
      if (asso.end1.reference === elem && asso.end2.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end2, options, imports, curPackage)
        codeWriter.writeLine()
      }
      if (asso.end2.reference === elem && asso.end1.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end1, options, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    // Methods
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], elem, options, false, false, imports, curPackage)
      codeWriter.writeLine()
    }

    // Extends methods
    if (_extends.length > 0) {
      for (i = 0, len = _extends[0].operations.length; i < len; i++) {
        _modifiers = this.getModifiers(_extends[0].operations[i])
        if (_modifiers.includes('abstract') === true) {
          this.writeMethod(codeWriter, _extends[0].operations[i], _extends[0], options, false, false, imports, curPackage)
          codeWriter.writeLine()
        }
      }
    }

    // Interface methods
    for (var j = 0; j < _implements.length; j++) {
      for (i = 0, len = _implements[j].operations.length; i < len; i++) {
        this.writeMethod(codeWriter, _implements[j].operations[i], _implements[j], options, false, false, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options, imports, curPackage)
        } else {
          this.writeClass(codeWriter, def, options, imports, curPackage)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write Interface
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeInterface (codeWriter, elem, options, imports, curPackage) {
    var i, len
    var terms = []

    // Doc
    this.writeDoc(codeWriter, elem.documentation, options, imports, curPackage)

    // Modifiers
    var visibility = this.getVisibility(elem)
    if (visibility) {
      terms.push(visibility)
    }

    // Interface
    terms.push('interface')
    terms.push(elem.name)

    // Extends
    var _extends = this.getSuperClasses(elem)
    if (_extends.length > 0) {
      terms.push('extends ' + _extends.map(function (e) { return getElemPath(e, imports, curPackage) }).join(', '))
    }
    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.writeLine()
    codeWriter.indent()

    // Member Variables
    // (from attributes)
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options, imports, curPackage)
      codeWriter.writeLine()
    }
    // (from associations)
    var associations = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel instanceof type.UMLAssociation)
    })
    for (i = 0, len = associations.length; i < len; i++) {
      var asso = associations[i]
      if (asso.end1.reference === elem && asso.end2.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end2, options, imports, curPackage)
        codeWriter.writeLine()
      }
      if (asso.end2.reference === elem && asso.end1.navigable === true) {
        this.writeMemberVariable(codeWriter, asso.end1, options, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    // Methods
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], elem, options, true, false, imports, curPackage)
      codeWriter.writeLine()
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options, imports, curPackage)
        } else {
          this.writeClass(codeWriter, def, options, imports, curPackage)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write Enum
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeEnum (codeWriter, elem, options, imports, curPackage) {
    var i, len
    var terms = []
    // Doc
    this.writeDoc(codeWriter, elem.documentation, options, imports, curPackage)

    // Modifiers
    var visibility = this.getVisibility(elem)
    if (visibility) {
      terms.push(visibility)
    }
    // Enum
    terms.push('enum')
    terms.push(elem.name)

    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.indent()

    // Literals
    for (i = 0, len = elem.literals.length; i < len; i++) {
      codeWriter.writeLine(elem.literals[i].name + (i < elem.literals.length - 1 ? ',' : ''))
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }

  /**
   * Write AnnotationType
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {Set.<String>} imports
   * @param {Object} curPackage
   */
  writeAnnotationType (codeWriter, elem, options, imports, curPackage) {
    var i, len
    var terms = []

    // Doc
    var doc = elem.documentation.trim()
    if (app.project.getProject().author && app.project.getProject().author.length > 0) {
      doc += '\n@author ' + app.project.getProject().author
    }
    this.writeDoc(codeWriter, doc, options, imports, curPackage)

    // Modifiers
    var _modifiers = this.getModifiers(elem)
    if (_modifiers.includes('abstract') !== true && elem.operations.some(function (op) { return op.isAbstract === true })) {
      _modifiers.push('abstract')
    }
    if (_modifiers.length > 0) {
      terms.push(_modifiers.join(' '))
    }

    // AnnotationType
    terms.push('@interface')
    terms.push(elem.name)

    codeWriter.writeLine(terms.join(' ') + ' {')
    codeWriter.writeLine()
    codeWriter.indent()

    // Member Variables
    for (i = 0, len = elem.attributes.length; i < len; i++) {
      this.writeMemberVariable(codeWriter, elem.attributes[i], options, imports, curPackage)
      codeWriter.writeLine()
    }

    // Methods
    for (i = 0, len = elem.operations.length; i < len; i++) {
      this.writeMethod(codeWriter, elem.operations[i], elem, options, true, true, imports, curPackage)
      codeWriter.writeLine()
    }

    // Extends methods
    var _extends = this.getSuperClasses(elem)
    if (_extends.length > 0) {
      for (i = 0, len = _extends[0].operations.length; i < len; i++) {
        _modifiers = this.getModifiers(_extends[0].operations[i])
        if (_modifiers.includes('abstract') === true) {
          this.writeMethod(codeWriter, _extends[0].operations[i], _extends[0], options, false, false, imports, curPackage)
          codeWriter.writeLine()
        }
      }
    }

    // Inner Definitions
    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
      var def = elem.ownedElements[i]
      if (def instanceof type.UMLClass) {
        if (def.stereotype === 'annotationType') {
          this.writeAnnotationType(codeWriter, def, options, imports, curPackage)
        } else {
          this.writeClass(codeWriter, def, options, imports, curPackage)
        }
        codeWriter.writeLine()
      } else if (def instanceof type.UMLInterface) {
        this.writeInterface(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      } else if (def instanceof type.UMLEnumeration) {
        this.writeEnum(codeWriter, def, options, imports, curPackage)
        codeWriter.writeLine()
      }
    }

    codeWriter.outdent()
    codeWriter.writeLine('}')
  }
}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate (baseModel, basePath, options) {
  var javaCodeGenerator = new JavaCodeGenerator(baseModel, basePath)
  javaCodeGenerator.generate(baseModel, basePath, options, null)
}

exports.generate = generate
