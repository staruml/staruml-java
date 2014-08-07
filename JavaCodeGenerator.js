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

// TODO: Generate AnnotationType
// TODO: Which type will be used for multiplicity? (e.g. Array, Vector, ArrayList, Set, ...)
// TODO: Generate "return ?" in Method
// TODO: Collection Type.
// TODO: Word Wrap in JavaDoc
// TODO: Abstract method do not have body
// TODO: Class should be "abstract" it has at least one abstract method
// TODO: Generate method returns $.Promise

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, staruml, type, document, java7 */

define(function (require, exports, module) {
    "use strict";

    var Repository = staruml.getModule("engine/Repository"),
        Engine     = staruml.getModule("engine/Engine"),
        FileSystem = staruml.getModule("filesystem/FileSystem"),
        FileUtils  = staruml.getModule("file/FileUtils"),
        UML        = staruml.getModule("uml/UML");

    var CodeGenUtils = require("CodeGenUtils");

    
    /**
     * Java Code Generator
     * @constructor
     */
    function JavaCodeGenerator(baseModel, basePath) {
    
        /** @member {Element} */
        this.baseModel = baseModel;
        
        /** @member {string} */
        this.basePath = basePath;
        
    }

    
    JavaCodeGenerator.prototype.getIndentString = function (options) {
        if (options.useTab) {
            return "\t";
        } else {
            var i, len, indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(" ");
            }
            return indent.join("");
        }
    }
    
    /**
     * Generate codes from a given element
     * @param {Element} elem
     * @param {string} path
     * @param {Object} options
     * @return {$.Promise}
     */
    JavaCodeGenerator.prototype.generate = function (elem, path, options) {
        var result = new $.Deferred(),
            self = this,
            fullPath,
            directory,
            codeWriter,
            file;
        
        if (elem instanceof type.UMLPackage) {            
            fullPath = path + "/" + elem.name,
            directory = FileSystem.getDirectoryForPath(fullPath);
            directory.create(function (err, stat) {
                if (!err) {
                    var i, len, child;
                    for (i = 0, len = elem.ownedElements.length; i < len; i++) {
                        child = elem.ownedElements[i];
                        self.generate(child, fullPath, options)
                    }
                } else {
                    console.log("[Java] Failed to make directory - " + path);
                }
            });
        } else if (elem instanceof type.UMLClass) {
            fullPath = path + "/" + elem.name + ".java";
            codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            codeWriter.writeLine("import java.util.ArrayList;");
            codeWriter.writeLine();
            this.writeClass(codeWriter, elem, options);

            file = FileSystem.getFileForPath(fullPath);
            FileUtils.writeText(file, codeWriter.getData(), true)
                .done(function () {
                })
                .fail(function (err) {
                    console.log("[Java] Failed to generate - " + fullPath);
                });;            
        } else if (elem instanceof type.UMLInterface) {
            fullPath = path + "/" + elem.name + ".java";
            codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            codeWriter.writeLine("import java.util.ArrayList;");
            codeWriter.writeLine();
            this.writeInterface(codeWriter, elem, options);

            file = FileSystem.getFileForPath(fullPath);
            FileUtils.writeText(file, codeWriter.getData(), true)
                .done(function () {
                })
                .fail(function (err) {
                    console.log("[Java] Failed to generate - " + fullPath);
                });;
        } else if (elem instanceof type.UMLEnumeration) {
            fullPath = path + "/" + elem.name + ".java";
            codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            this.writeEnum(codeWriter, elem, options);

            file = FileSystem.getFileForPath(fullPath);
            FileUtils.writeText(file, codeWriter.getData(), true)
                .done(function () {
                })
                .fail(function (err) {
                    console.log("[Java] Failed to generate - " + fullPath);
                });;
        }
        
        return result.promise();
    };
    
    
    /**
     * Return visibility
     * @param {Model} elem
     * @return {string}
     */
    JavaCodeGenerator.prototype.getVisibility = function (elem) {
        switch (elem.visibility) {
        case UML.VK_PUBLIC:    return "public";
        case UML.VK_PROTECTED: return "protected";
        case UML.VK_PRIVATE:   return "private";
        }
        return null;
    }

    /**
     * Collect modifiers of a given element.
     * @return {Array.<string>}
     */
    JavaCodeGenerator.prototype.getModifiers = function (elem) {
        var modifiers = [];
        var visibility = this.getVisibility(elem);
        if (visibility) {
            modifiers.push(visibility);
        }
        if (elem.isStatic === true) {
            modifiers.push("static");
        }
        if (elem.isAbstract === true) {
            modifiers.push("abstract");
        }
        if (elem.isFinalSpecification === true || elem.isLeaf === true) {
            modifiers.push("final");
        }
        // transient
        // volatile
        // strictfp
        // const
        // native
        // synchronized
        return modifiers;
    };

    /**
     * Collect super classes of a given element
     * @param {Core.Model} elem
     * @return {Array.<Model>}
     */
    JavaCodeGenerator.prototype.getSuperClasses = function (elem) {
        var generalizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem);
        });
        return _.map(generalizations, function (gen) { return gen.target; });
    };

    /**
     * Collect super interfaces of a given element
     * @param {Core.Model} elem
     * @return {Array.<Model>}
     */
    JavaCodeGenerator.prototype.getSuperInterfaces = function (elem) {
        var realizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem);
        });
        return _.map(realizations, function (gen) { return gen.target; });
    };

    /**
     * Return type expression
     * @param {Model} elem
     * @return {string}
     */
    JavaCodeGenerator.prototype.getType = function (elem) {
        var _type = "void";
        // type name
        if (elem instanceof type.UMLAssociationEnd) {
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
            }
        } else {
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
            } else if (_.isString(elem.type) && elem.type.length > 0) {
                _type = elem.type;
            }
        }
        // multiplicity
        if (elem.multiplicity) {
            if (_.contains(["0..*", "1..*", "*"], elem.multiplicity.trim())) {
                _type = "ArrayList<" + _type + ">";
            } else if (elem.multiplicity.match(/^\d+$/)) { // number
                _type += "[]";
            }
        }
        return _type;
    };
    
    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     */
    JavaCodeGenerator.prototype.writeDoc = function (codeWriter, text, options) {
        if (options.javaDoc && _.isString(text)) {
            var lines = text.trim().split("\n");
            codeWriter.writeLine("/**");
            for (var i = 0, len = lines.length; i < len; i++) {
                codeWriter.writeLine(" * " + lines[i]);
            }
            codeWriter.writeLine(" */");
        }
    };

    /**
     * Write Package Declaration
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writePackageDeclaration = function (codeWriter, elem, options) {
        var path = null;
        if (elem._parent) {
            path = _.map(elem._parent.getPath(this.baseModel), function (e) { return e.name; }).join(".");
        }
        if (path) {
            codeWriter.writeLine("package " + path + ";");
        }
    };

    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writeConstructor = function (codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];
            // Doc
            this.writeDoc(codeWriter, "Constructor", options);
            // Visibility
            var visibility = this.getVisibility(elem);
            if (visibility) {
                terms.push(visibility);
            }
            terms.push(elem.name + "()");
            codeWriter.writeLine(terms.join(" ") + " {");
            codeWriter.writeLine("}");
        }
    };

    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writeMemberVariable = function (codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];
            // doc
            this.writeDoc(codeWriter, elem.documentation, options);
            // modifiers
            var _modifiers = this.getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            // type
            terms.push(this.getType(elem));
            // name
            terms.push(elem.name);
            // initial value
            if (elem.defaultValue && elem.defaultValue.length > 0) {
                terms.push("= " + elem.defaultValue);
            }
            codeWriter.writeLine(terms.join(" ") + ";");
        }
    };

    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     * @param {boolean} skipBody
     */
    JavaCodeGenerator.prototype.writeMethod = function (codeWriter, elem, skipBody, options) {
        if (elem.name.length > 0) {
            var terms = [];
            var params = elem.getNonReturnParameters();
            var returnParam = elem.getReturnParameter();
            // doc
            var doc = elem.documentation.trim();
            _.each(params, function (param) {
                doc += "\n@param " + param.documentation;
            });
            if (returnParam) {
                doc += "\n@return " + returnParam.documentation;
            }
            this.writeDoc(codeWriter, doc, options);
            // modifiers
            var _modifiers = this.getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            // type
            if (returnParam) {
                terms.push(this.getType(returnParam));
            } else {
                terms.push("void");
            }
            // name + parameters
            var paramTerms = [];
            for (var i = 0, len = params.length; i < len; i++) {
                var p = params[i];
                var s = this.getType(p) + " " + p.name;
                if (p.isReadOnly === true) {
                    s = "final " + s;
                }
                paramTerms.push(s);
            }
            terms.push(elem.name + "(" + paramTerms.join(", ") + ")");
            if (skipBody === true) {
                codeWriter.writeLine(terms.join(" ") + ";");
            } else {
                codeWriter.writeLine(terms.join(" ") + " {");
                codeWriter.indent();
                codeWriter.writeLine("// PUT CODE HERE");
                codeWriter.outdent();
                codeWriter.writeLine("}");
            }
        }
    };

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writeClass = function (codeWriter, elem, options) {
        var terms = [];
        // Doc
        var doc = elem.documentation.trim();
        if (Repository.getProject().author && Repository.getProject().author.length > 0) {
            doc += "\n@author " + Repository.getProject().author;
        }
        this.writeDoc(codeWriter, doc, options);
        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(" "));
        }
        // Class
        terms.push("class");
        terms.push(elem.name);
        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _extends[0].name);
        }
        // Implements
        var _implements = this.getSuperInterfaces(elem);
        if (_implements.length > 0) {
            terms.push("implements " + _.map(_implements, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Constructor
        this.writeConstructor(codeWriter, elem, options);
        codeWriter.writeLine();

        // Member Variables
        // (from attributes)
        for (var i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (var i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], false, options);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (var i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                this.writeClass(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };


    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writeInterface = function (codeWriter, elem, options) {
        var terms = [];
        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);
        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        // Interface
        terms.push("interface");
        terms.push(elem.name);
        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _.map(_extends, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        // (from attributes)
        for (var i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (var i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], true, options);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (var i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                this.writeClass(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    JavaCodeGenerator.prototype.writeEnum = function (codeWriter, elem, options) {
        var terms = [];
        // Doc
        this.writeDoc(codeWriter, elem.documentation, options);
        
        // Modifiers
        var visibility = this.getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        // Enum
        terms.push("enum");
        terms.push(elem.name);

        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.indent();

        // Literals
        for (var i = 0, len = elem.literals.length; i < len; i++) {
            codeWriter.writeLine(elem.literals[i].name + (i < elem.literals.length-1 ? "," : ""));
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    };

    /*
     * options = {
     *   base: (model)
     *   path: "/User/niklaus/..."
     *   javaDoc: true,
     *   useTab: false,
     *   indentSpaces: 4,
     *   headerComment: true
     * }
     */
    function generate(baseModel, basePath, options) {
        var result = new $.Deferred();
        var javaCodeGenerator = new JavaCodeGenerator(baseModel, basePath);
        var i, len, elem;
        for (i = 0, len = baseModel.ownedElements.length; i < len; i++) {
            elem = baseModel.ownedElements[i];
            javaCodeGenerator.generate(elem, basePath, options);
        }
        return result.promise();
    }
    
    exports.generate = generate;

});