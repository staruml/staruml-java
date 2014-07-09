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


// TODO: Make as class (e.g. JavaCodeGenerator)
// TODO: Write Test Cases
// TODO: Apply options

define(function (require, exports, module) {
    "use strict";

    var Repository = staruml.getModule("engine/Repository"),
        Engine     = staruml.getModule("engine/Engine"),
        FileSystem = staruml.getModule("filesystem/FileSystem"),
        UML        = staruml.getModule("uml/UML");

    /**
     * Return visibility
     * @param {Model} elem
     * @return {string}
     */
    function getVisibility(elem) {
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
    function getModifiers(elem) {
        var modifiers = [];
        var visibility = getVisibility(elem);
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
    }

    /**
     * Collect super classes of a given element
     * @param {Core.Model} elem
     * @return {Array.<Model>}
     */
    function getSuperClasses(elem) {
        var generalizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem);
        });
        return _.map(generalizations, function (gen) { return gen.target; });
    }

    /**
     * Collect super interfaces of a given element
     * @param {Core.Model} elem
     * @return {Array.<Model>}
     */
    function getSuperInterfaces(elem) {
        var realizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem);
        });
        return _.map(realizations, function (gen) { return gen.target; });
    }

    /**
     * Return type expression
     * @param {Model} elem
     * @return {string}
     */
    function getType(elem) {
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
                _type += "[" + elem.multiplicity + "]";
            }
        }
        return _type;
    }

    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     */
    function writeDoc(codeWriter, text) {
        if (_.isString(text)) {
            var lines = text.trim().split("\n");
            codeWriter.writeLine("/**");
            for (var i = 0, len = lines.length; i < len; i++) {
                codeWriter.writeLine(" * " + lines[i]);
            }
            codeWriter.writeLine(" */");
        }
    }

    /**
     * Write Package Declaration
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writePackageDeclaration(codeWriter, elem) {
        var base = getBaseModel(),
            path = null;
        if (elem._parent) {
            path = _.map(elem._parent.getPath(base), function (e) { return e.name; }).join(".");
        }
        if (path) {
            codeWriter.writeLine("package " + path + ";");
        }
    }

    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writeConstructor(codeWriter, elem) {
        if (elem.name.length > 0) {
            var terms = [];
            // Doc
            writeDoc(codeWriter, "Constructor");
            // Visibility
            var visibility = getVisibility(elem);
            if (visibility) {
                terms.push(visibility);
            }
            terms.push(elem.name + "()");
            codeWriter.writeLine(terms.join(" ") + " {");
            codeWriter.writeLine("}");
        }
    }

    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writeMemberVariable(codeWriter, elem) {
        if (elem.name.length > 0) {
            var terms = [];
            // doc
            writeDoc(codeWriter, elem.documentation);
            // modifiers
            var _modifiers = getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            // type
            terms.push(getType(elem));
            // name
            terms.push(elem.name);
            // initial value
            if (elem.defaultValue && elem.defaultValue.length > 0) {
                terms.push("= " + elem.defaultValue);
            }
            codeWriter.writeLine(terms.join(" ") + ";");
        }
    }

    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     * @param {boolean} skipBody
     */
    function writeMethod(codeWriter, elem, skipBody) {
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
            writeDoc(codeWriter, doc);
            // modifiers
            var _modifiers = getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            // type
            if (returnParam) {
                terms.push(getType(returnParam));
            } else {
                terms.push("void");
            }
            // name + parameters
            var paramTerms = [];
            for (var i = 0, len = params.length; i < len; i++) {
                var p = params[i];
                var s = getType(p) + " " + p.name;
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
    }

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writeClass(codeWriter, elem) {
        var terms = [];
        // Doc
        var doc = elem.documentation.trim();
        if (Repository.getProject().author && Repository.getProject().author.length > 0) {
            doc += "\n@author " + Repository.getProject().author;
        }
        writeDoc(codeWriter, doc);
        // Modifiers
        var _modifiers = getModifiers(elem);
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(" "));
        }
        // Class
        terms.push("class");
        terms.push(elem.name);
        // Extends
        var _extends = getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _extends[0].name);
        }
        // Implements
        var _implements = getSuperInterfaces(elem);
        if (_implements.length > 0) {
            terms.push("implements " + _.map(_implements, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Constructor
        writeConstructor(codeWriter, elem);
        codeWriter.writeLine();

        // Member Variables
        // (from attributes)
        for (var i = 0, len = elem.attributes.length; i < len; i++) {
            writeMemberVariable(codeWriter, elem.attributes[i]);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                writeMemberVariable(codeWriter, asso.end2);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                writeMemberVariable(codeWriter, asso.end1);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (var i = 0, len = elem.operations.length; i < len; i++) {
            writeMethod(codeWriter, elem.operations[i]);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (var i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                writeClass(codeWriter, def);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                writeInterface(codeWriter, def);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                writeEnum(codeWriter, def);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    }


    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writeInterface(codeWriter, elem) {
        var terms = [];
        // Doc
        writeDoc(codeWriter, elem.documentation);
        // Modifiers
        var visibility = getVisibility(elem);
        if (visibility) {
            terms.push(visibility);
        }
        // Interface
        terms.push("interface");
        terms.push(elem.name);
        // Extends
        var _extends = getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push("extends " + _.map(_extends, function (e) { return e.name; }).join(", "));
        }
        codeWriter.writeLine(terms.join(" ") + " {");
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        // (from attributes)
        for (var i = 0, len = elem.attributes.length; i < len; i++) {
            writeMemberVariable(codeWriter, elem.attributes[i]);
            codeWriter.writeLine();
        }
        // (from associations)
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                writeMemberVariable(codeWriter, asso.end2);
                codeWriter.writeLine();
            } else if (asso.end2.reference === elem && asso.end1.navigable === true) {
                writeMemberVariable(codeWriter, asso.end1);
                codeWriter.writeLine();
            }
        }

        // Methods
        for (var i = 0, len = elem.operations.length; i < len; i++) {
            writeMethod(codeWriter, elem.operations[i], true);
            codeWriter.writeLine();
        }

        // Inner Definitions
        for (var i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                writeClass(codeWriter, def);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLInterface) {
                writeInterface(codeWriter, def);
                codeWriter.writeLine();
            } else if (def instanceof type.UMLEnumeration) {
                writeEnum(codeWriter, def);
                codeWriter.writeLine();
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine("}");
    }

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {Element} elem
     */
    function writeEnum(codeWriter, elem) {
        var terms = [];
        // Doc
        writeDoc(codeWriter, elem.documentation);
        // Modifiers
        var visibility = getVisibility(elem);
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
    }

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
    function generate(options) {
        var i, len;
        for (i = 0, len = options.base.ownedElements.length; i < len; i++) {
            var elem = options.base.ownedElements[i];
            if (elem instanceof type.UMLPackage) {
                var dir = options.path + "/" + elem.name;
                FileSystem.makeDir(dir, 0, function (err) {
                    if (err === FileSystem.NO_ERROR) {
                        generate(elem, dir);
                    } else {
                        console.log("[Java] Failed to make directory - " + dir);
                    }
                });
            } else if (elem instanceof type.UMLClass) {
                var file = options.path + "/" + elem.name + ".java";
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
                var file = options.path + "/" + elem.name + ".java";
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
                var file = options.path + "/" + elem.name + ".java";
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

    exports.writePackageDeclaration = writePackageDeclaration;
    exports.writeClass              = writeClass;
    exports.writeInterface          = writeInterface;
    exports.writeEnum               = writeEnum;
    exports.generate                = generate;

});