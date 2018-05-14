Java Extension for StarUML
==========================

This extension for StarUML(http://staruml.io) support to generate Java code from UML model and to reverse Java code to UML model. Install this extension from Extension Manager of StarUML.

> __Note__
> This extensions do not provide perfect reverse engineering which is a test and temporal feature. If you need a complete reverse engineering feature, please check other professional reverse engineering tools.

> __Note__
> This extension is based on Java 1.7 Specification.

Java Code Generation
--------------------

1. Click the menu (`Tools > Java > Generate Code...`)
2. Select a base model (or package) that will be generated to Java.
3. Select a folder where generated Java source files will be placed.

Belows are the rules to convert from UML model elements to Java source codes.

### UMLPackage

* converted to _Java Package_ (as a folder).

### UMLClass

* converted to _Java Class_. (as a separate `.java` file)
* `visibility` to one of modifiers `public`, `protected`, `private` and none.
* `isAbstract` property to `abstract` modifier.
* `isFinalSpecialization` and `isLeaf` property to `final` modifier.
* Default constructor is generated.
* All contained types (_UMLClass_, _UMLInterface_, _UMLEnumeration_) are generated as inner type definition.
* Documentation property to JavaDoc comment.

### UMLAttribute

* converted to _Java Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `type` property to field type.
* `multiplicity` property to array type.
* `isStatic` property to `static` modifier.
* `isLeaf` property to `final` modifier.
* `defaultValue` property to initial value.
* Documentation property to JavaDoc comment.

### UMLOperation

* converted to _Java Methods_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to method identifier.
* `isAbstract` property to `abstract` modifier.
* `isStatic` property to `static` modifier.
* _UMLParameter_ to _Java Method Parameters_.
* _UMLParameter_'s name property to parameter identifier.
* _UMLParameter_'s type property to type of parameter.
* _UMLParameter_ with `direction` = `return` to return type of method. When no return parameter, `void` is used.
* _UMLParameter_ with `isReadOnly` = `true` to `final` modifier of parameter.
* Documentation property to JavaDoc comment.

### UMLInterface

* converted to _Java Interface_.  (as a separate `.java` file)
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* Documentation property to JavaDoc comment.

### UMLEnumeration

* converted to _Java Enum_.  (as a separate `.java` file)
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* _UMLEnumerationLiteral_ to literals of enum.

### UMLAssociationEnd

* converted to _Java Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `type` property to field type.
* If `multiplicity` is one of `0..*`, `1..*`, `*`, then collection type (`java.util.List<>` when `isOrdered` = `true` or `java.util.Set<>`) is used.
* `defaultValue` property to initial value.
* Documentation property to JavaDoc comment.

### UMLGeneralization

* converted to _Java Extends_ (`extends`).
* Allowed only for _UMLClass_ to _UMLClass_, and _UMLInterface_ to _UMLInterface_.

### UMLInterfaceRealization

* converted to _Java Implements_ (`implements`).
* Allowed only for _UMLClass_ to _UMLInterface_.


Java Reverse Engineering
------------------------

1. Click the menu (`Tools > Java > Reverse Code...`)
2. Select a folder containing Java source files to be converted to UML model elements.
3. `JavaReverse` model will be created in the Project.

Belows are the rules to convert from Java source code to UML model elements.

### Java Package

* converted to _UMLPackage_.

### Java Class

* converted to _UMLClass_.
* Class name to `name` property.
* Type parameters to _UMLTemplateParameter_.
* Access modifier `public`, `protected` and  `private` to `visibility` property.
* `abstract` modifier to `isAbstract` property.
* `final` modifier to `isLeaf` property.
* Constructors to _UMLOperation_ with stereotype `<<constructor>>`.
* All contained types (_UMLClass_, _UMLInterface_, _UMLEnumeration_) are generated as inner type definition.
* JavaDoc comment to Documentation.


### Java Field (to UMLAttribute)

* converted to _UMLAttribute_ if __"Use Association"__ is __off__ in Preferences.
* Field type to `type` property.

    * Primitive Types : `type` property has the primitive type name as string.
    * `T[]`(array), `java.util.List<T>`, `java.util.Set<T>` or its decendants: `type` property refers to `T` with multiplicity `*`.
    * `T` (User-Defined Types)  : `type` property refers to the `T` type.
    * Otherwise : `type` property has the type name as string.

* Access modifier `public`, `protected` and  `private` to `visibility` property.
* `static` modifier to `isStatic` property.
* `final` modifier to `isLeaf` and `isReadOnly` property.
* `transient` modifier to a Tag with `name="transient"` and `checked=true` .
* `volatile` modifier to a Tag with `name="volatile"` and `checked=true`.
* Initial value to `defaultValue` property.
* JavaDoc comment to Documentation.

### Java Field (to UMLAssociation)

* converted to (Directed) _UMLAssociation_ if __"Use Association"__ is __on__ in Preferences and there is a UML type element (_UMLClass_, _UMLInterface_, or _UMLEnumeration_) correspond to the field type.
* Field type to `end2.reference` property.

    * `T[]`(array), `java.util.List<T>`, `java.util.Set<T>` or its decendants: `reference` property refers to `T` with multiplicity `*`.
    * `T` (User-Defined Types)  : `reference` property refers to the `T` type.
    * Otherwise : converted to _UMLAttribute_, not _UMLAssociation_.

* Access modifier `public`, `protected` and  `private` to `visibility` property.
* JavaDoc comment to Documentation.

### Java Method

* converted to _UMLOperation_.
* Type parameters to _UMLTemplateParameter_.
* Access modifier `public`, `protected` and  `private` to `visibility` property.
* `static` modifier to `isStatic` property.
* `abstract` modifier to `isAbstract` property.
* `final` modifier to `isLeaf` property.
* `synchronized` modifier to `concurrency="concurrent"` property.
* `native` modifier to a Tag with `name="native"` and `checked=true`.
* `strictfp` modifier to a Tag with `name="strictfp"` and `checked=true`.
* `throws` clauses to `raisedExceptions` property.
* JavaDoc comment to Documentation.

### Java Interface

* converted to _UMLInterface_.
* Class name to `name` property.
* Type parameters to _UMLTemplateParameter_.
* Access modifier `public`, `protected` and  `private` to `visibility` property.
* JavaDoc comment to Documentation.

### Java Enum

* converted to _UMLEnumeration_.
* Enum name to `name` property.
* Type parameters to _UMLTemplateParameter_.
* Access modifier `public`, `protected` and  `private` to `visibility` property.
* Enum constants are converted to _UMLEnumerationLiteral_.
* JavaDoc comment to Documentation.

### Java AnnotationType

* converted to _UMLClass_ with stereotype `<<annotationType>>`.
* Annotation type elements to _UMLOperation_. (Default value to a Tag with `name="default"`).
* JavaDoc comment to Documentation.


---

Licensed under the MIT license (see LICENSE file).
