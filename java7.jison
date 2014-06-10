%token ABSTRACT ASSERT
%token BOOLEAN BREAK BYTE
%token CASE CATCH CHAR CLASS CONST CONTINUE
%token DEFAULT DO DOUBLE
%token ELSE ENUM EXTENDS
%token FINAL FINALLY FLOAT FOR
%token IF
%token GOTO
%token IMPLEMENTS IMPORT INSTANCEOF INT INTERFACE
%token LONG
%token NATIVE NEW
%token PACKAGE PRIVATE PROTECTED PUBLIC
%token RETURN
%token SHORT STATIC STRICTFP SUPER SWITCH SYNCHRONIZED
%token THIS THROW THROWS TRANSIENT TRY VOID VOLATILE WHILE

%token IntegerLiteral FloatingPointLiteral BooleanLiteral CharacterLiteral StringLiteral NullLiteral

%token LPAREN RPAREN LBRACE RBRACE LBRACK RBRACK SEMI COMMA DOT

%token ASSIGN GT LSHIFT LT BANG TILDE QUESTION COLON EQUAL LE GE NOTEQUAL AND OR INC DEC ADD SUB MUL DIV BITAND BITOR CARET MOD
%token ADD_ASSIGN SUB_ASSIGN MUL_ASSIGN DIV_ASSIGN AND_ASSIGN OR_ASSIGN XOR_ASSIGN MOD_ASSIGN LSHIFT_ASSIGN RSHIFT_ASSIGN URSHIFT_ASSIGN

%token AT ELLIPSIS

%token Identifier

%token TEMPLATE

%token EOF

%left LSHIFT TEMPLATE

%left MOD
%left MUL DIV
%left ADD SUB

%right ASSIGN ADD_ASSIGN SUB_ASSIGN MUL_ASSIGN DIV_ASSIGN AND_ASSIGN OR_ASSIGN XOR_ASSIGN RSHIFT_ASSIGN URSHIFT_ASSIGN LSHIFT_ASSIGN MOD_ASSIGN

%start compilationUnit


%%
compilationUnit
    :	packageDeclaration EOF
        {
            return {
                "node": "CompilationUnit",
                "package": $1
            };
        }
    |   packageDeclaration importDeclarations EOF
        {
            return {
                "node": "CompilationUnit",
                "package": $1,
                "imports": $2
            };
        }
    |   packageDeclaration importDeclarations typeDeclarations EOF
        {
            return {
                "node": "CompilationUnit",
                "package": $1,
                "imports": $2,
                "types": $3
            };
        }
    |	packageDeclaration typeDeclarations EOF
        {
            return {
                "node": "CompilationUnit",
                "package": $1,
                "types": $2
            };
        }
    |	importDeclarations typeDeclarations EOF
        {
            return {
                "node": "CompilationUnit",
                "imports": $1,
                "types": $2
            };
        }
    |	typeDeclarations EOF
        {
            return {
                "node": "CompilationUnit",
                "types": $1
            };
        }
    |   SEMI
    ;

packageDeclaration
    :	annotationl packageDeclaration
        {
            $2["annotations"] = $1;
            $$ = $2;
        }
    |   packageDeclaration
        {
            $$ = $1;
        }
    ;

packageDeclaration
    :   PACKAGE qualifiedName SEMI
        {
            $$ = {
                "node": "Package",
                "name": $2
            };
        }
    ;

importDeclarations
    :   importDeclaration
        {
            $$ = [ $1 ];
        }
    |   importDeclarations importDeclaration
        {
            $1.push($2);
            $$ = $1;
        }
    ;

importDeclaration
    :   IMPORT STATIC qualifiedName DOT MUL SEMI
        {
            $3["name"] = $3["name"] + ".*";
            $$ = $3;
        }
    |   IMPORT STATIC qualifiedName SEMI
        {
            $$ = $3;
        }
    |	IMPORT qualifiedName DOT MUL SEMI
        {
            $2["name"] = $2["name"] + ".*";
            $$ = $2;
        }
    |   IMPORT qualifiedName SEMI
        {
            $$ = $2;
        }
    ;

typeDeclarations
    :   typeDeclarationWithPrefixes
        {
            $$ = [ $1 ];
        }
    |   typeDeclarations typeDeclarationWithPrefixes
        {
            $1.push($2);
            $$ = $1;
        }
    ;

typeDeclarationWithPrefixes
    :   annotationl modifierL typeDeclaration
        {
            $3["annotations"] = $1;
            $3["modifiers"] = $2;
            $$ = $3;
        }
    |   modifierL annotationl typeDeclaration
        {
            $3["annotations"] = $2;
            $3["modifiers"] = $1;
            $$ = $3;
        }
    |   modifierL typeDeclaration
        {
            $2["modifiers"] = $1;
            $$ = $2;
        }
    |   annotationl typeDeclaration
        {
            $2["annotations"] = $1;
            $$ = $2;
        }
    |   typeDeclaration
        {
            $$ = $1;
        }
    ;

typeDeclaration
    :   classDeclaration
    |   interfaceDeclaration
    |   enumDeclaration
    |   annotationTypeDeclaration
    |   SEMI
    ;

classDeclaration
    :   CLASS Identifier classInheritance interfaceImplentation classBody
        {
            $$ = {
                "node": "Class",
                "name": $2,
                "extends": $3,
                "implements": $4,
                "body": $5
            };
        }
    |   CLASS Identifier typeParameters classInheritance interfaceImplentation classBody
        {
            $$ = {
                "node": "Class",
                "name": $2,
                "typeParameters": $3,
                "extends": $4,
                "implements": $5,
                "body": $6
            };
        }
    ;

classInheritance
    :   %empty /* empty */
        {
            $$ = null;
        }
    |   EXTENDS type
        {
            $$ = $2;
        }
    ;

interfaceImplentation
    :   %empty /* empty */
        {
            $$ = [];
        }
    |   IMPLEMENTS typeList
        {
            $$ = $2;
        }
    ;

typeParameters
    :   TEMPLATE
        {
            $$ = $1;
        }
    ;

enumDeclaration
    :   ENUM Identifier interfaceImplentation enumBody
        {
            $$ = {
                "node": "Enum",
                "name": $2,
                "implements": $3,
                "body": $4
            };
        }
    ;

enumBody
    :   LBRACE RBRACE
    |   LBRACE enumBodyDeclaration RBRACE
        {
            $$ = $2;
        }
    ;

enumBodyDeclaration
    :   enumConstants
        {
            $$ = $1;
        }
    |   enumConstants COMMA
        {
            $$ = $1;
        }
    |   enumConstants SEMI
        {
            $$ = $1;
        }
    |   enumConstants COMMA SEMI
        {
            $$ = $1;
        }
    |   enumConstants SEMI classBodyDeclarationl
        {
            $$ = $1.concat($3);
        }
    |   enumConstants COMMA SEMI classBodyDeclarationl
        {
            $$ = $1.concat($4);
        }
    ;

enumConstants
    :   annotations Identifier enumConstantArguments enumConstantClassBody
        {
            $$ = [
                {
                    "node": "EnumConstant",
                    "annotations": $1,
                    "name": $2,
                    "arguments": $3,
                    "body": $4
                }
            ];
        }
    |   enumConstants COMMA annotations Identifier enumConstantArguments enumConstantClassBody
        {
            $1.push(
                {
                    "node": "EnumConstant",
                    "annotations": $3,
                    "name": $4,
                    "arguments": $5,
                    "body": $6
                }
            );
            $$ = $1;
        }
    ;

enumConstantArguments
    :   %empty /* empty */
    |   arguments
    ;
enumConstantClassBody
    :   %empty /* empty */
    |   classBody
    ;

interfaceDeclaration
    :   INTERFACE Identifier optionalTypeParameters interfaceBody
        {
            $$ = {
                "node": "Interface",
                "name": $2,
                "typeParameters": $3,
                "body": $4
            };
        }
    |   INTERFACE Identifier optionalTypeParameters EXTENDS typeList interfaceBody
        {
            $$ = {
                "node": "Interface",
                "name": $2,
                "typeParameters": $3,
                "extends": $5,
                "body": $6
            };
        }
    ;

typeList
    :   type
        {
            $$ = [ $1 ];
        }
    |   typeList COMMA type
        {
            $1.push($3);
            $$ = $1;
        }
    ;

optionalTypeParameters
    :   %empty
    |   typeParameters
        {
            $$ = $1;
        }
    ;
classBody
    :   LBRACE  RBRACE
        {
            $$ = [];
        }
    |   LBRACE classBodyDeclarationl RBRACE
        {
            $$ = $2;
        }
    ;

/*Can be zero or more*/
classBodyDeclarations
    :   %empty /* empty */
    |   classBodyDeclarationl
    ;

classBodyDeclarationl
    :   classBodyDeclaration
        {
            $$ = [ $1 ];
        }
    |   classBodyDeclarationl classBodyDeclaration
        {
            $1.push($2);
            $$ = $1;
        }
    ;

classStaticBlock
    :   STATIC block
    |   block     /* check openjdk/jdk/src/share/classes/com/sun/java/util/jar/pack/Package.java:62 */
    ;

interfaceBody
    :   LBRACE RBRACE
    |   LBRACE interfaceBodyDeclarationl RBRACE
        {
            $$ = $2;
        }
    ;

interfaceBodyDeclarations
    :   %empty /* empty */
    |   interfaceBodyDeclarationl
        {
            $$ = $1;
        }
    ;

interfaceBodyDeclarationl
    :   interfaceBodyDeclaration
        {
            $$ = [ $1 ];
        }
    |   interfaceBodyDeclarationl interfaceBodyDeclaration
        {
            $1.push($2);
            $$ = $1;
        }
    ;

classBodyDeclaration
    :   SEMI
    |   annotationl modifierL classMemberDeclaration
        {
            $3["annotations"] = $1;
            $3["modifiers"] = $2;
            $$ = $3;
        }
    |   modifierL annotationl classMemberDeclaration
        {
            $3["annotations"] = $2;
            $3["modifiers"] = $1;
            $$ = $3;
        }
    |   modifierL classMemberDeclaration
        {
            $2["modifiers"] = $1;
            $$ = $2;
        }
    |   annotationl classMemberDeclaration
        {
            $2["annotations"] = $1;
            $$ = $2;
        }
    |   classMemberDeclaration
    |   classStaticBlock
    ;

staticBlock
    : %empty /* empty */
    | STATIC block
    ;

modifier
    :   STATIC
    |   FINAL
    |   ABSTRACT
    |   STRICTFP
    |   TRANSIENT
    |   VOLATILE
    |   PUBLIC
    |   PRIVATE
    |   PROTECTED
    |   NATIVE
    |   SYNCHRONIZED
    ;

modifierL
    :   modifier
        {
            $$ = [ $1 ];
        }
    |   modifierL modifier
        {
            $1.push($2);
            $$ = $1;
        }
    ;

modifiers
    :   %empty /* empty */
    |   modifierL
    ;

classMemberDeclaration
    :   /* Methods */
        VOID Identifier formalParameters arrayDimensionBracks throwsList block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "parameters": $3,
                "throws": $5
            };
        }
    |   VOID Identifier formalParameters arrayDimensionBracks block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "parameters": $3
            };
        }
    |   VOID Identifier formalParameters block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "parameters": $3
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks throwsList block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "arrayDimension": $4,
                "parameters": $3,
                "throws": $5
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "arrayDimension": $4,
                "parameters": $3
            };
        }
    |   type Identifier formalParameters block
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "parameters": $3
            };
        }
    |   VOID Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "parameters": $3,
                "throws": $5
            };
        }
    |   VOID Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "parameters": $3
            };
        }
    |   VOID Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": { "node": "Type", "name": "void" },
                "parameters": $3
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "arrayDimension": $4,
                "parameters": $3,
                "throws": $5
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "arrayDimension": $4,
                "parameters": $3
            };
        }
    |   type Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "name": $2,
                "type": $1,
                "parameters": $3
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks throwsList block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "parameters": $4
            };
        }
    |   typeParameters VOID Identifier formalParameters block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks throwsList block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "arrayDimension": $5,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "arrayDimension": $5,
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters block
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "parameters": $4
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "parameters": $4
            };
        }
    |   typeParameters VOID Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": { "node": "Type", "name": "void" },
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "arrayDimension": $5,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "arrayDimension": $5,
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "name": $3,
                "type": $2,
                "parameters": $4
            };
        }

    /* Fields */
    |   type variableDeclarators SEMI
        {
            $$ = {
                "node": "Field",
                "type": $1,
                "variables": $2
            };
        }

    /* Constructor */
    |   Identifier formalParameters throwsList block
        {
            $$ = {
                "node": "Constructor",
                "name": $1,
                "parameters": $2,
                "throws": $3
            };
        }
    |   typeParameters Identifier formalParameters throwsList block
        {
            $$ = {
                "node": "Constructor",
                "name": $2,
                "parameters": $3,
                "throws": $4
            };
        }

    /* Inner class, enum, interface or annotation type */
    |   classDeclaration
    |   interfaceDeclaration
    |   enumDeclaration
    |   annotationTypeDeclaration
    ;


throwsList
    : %empty /* empty */
    |   THROWS qualifiedNameList
        {
            $$ = $2;
        }
    ;

interfaceBodyDeclaration
    :   annotationl modifierL interfaceMemberDeclaration
        {
            $3["annotations"] = $1;
            $3["modifiers"] = $2;
            $$ = $3;
        }
    |   modifierL annotationl interfaceMemberDeclaration
        {
            $3["annotations"] = $2;
            $3["modifiers"] = $1;
            $$ = $3;
        }
    |   annotationl interfaceMemberDeclaration
        {
            $2["annotations"] = $1;
            $$ = $2;
        }
    |   modifierL interfaceMemberDeclaration
        {
            $2["modifiers"] = $1;
            $$ = $2;
        }
    |   interfaceMemberDeclaration
        {
            $$ = $1;
        }
    |   SEMI
    ;

interfaceMemberDeclaration
    :   type constDelarators SEMI
        {
            $$ = {
                "node": "Field",
                "type": $1,
                "variables": $2
            };
        }
    |   VOID Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "name": $2,
                "parameters": $3,
                "throws": $5
            };
        }
    |   VOID Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $4,
                "name": $2,
                "parameters": $3
            };
        }
    |   VOID Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "type": { "node": "Type", "name": "void" },
                "name": $2,
                "parameters": $3
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "type": $1,
                "arrayDimension": $4,
                "name": $2,
                "parameters": $3,
                "throws": $5
            };
        }
    |   type Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "type": $1,
                "arrayDimension": $4,
                "name": $2,
                "parameters": $3
            };
        }
    |   type Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "type": $1,
                "name": $2,
                "parameters": $3
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "name": $3,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters VOID Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": { "node": "Type", "name": "void" },
                "arrayDimension": $5,
                "name": $3,
                "parameters": $4
            };
        }
    |   typeParameters VOID Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": { "node": "Type", "name": "void" },
                "name": $3,
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks throwsList SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": $2,
                "arrayDimension": $5,
                "name": $3,
                "parameters": $4,
                "throws": $6
            };
        }
    |   typeParameters type Identifier formalParameters arrayDimensionBracks SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": $2,
                "arrayDimension": $5,
                "name": $3,
                "parameters": $4
            };
        }
    |   typeParameters type Identifier formalParameters SEMI
        {
            $$ = {
                "node": "Method",
                "typeParameters": $1,
                "type": $2,
                "name": $3,
                "parameters": $4
            };
        }
    |   classDeclaration
    |   interfaceDeclaration
    |   enumDeclaration
    |   annotationTypeDeclaration
    ;

constDeclaration
    :   constDelarators SEMI
    ;

constDelarators
    :   constantDeclarator
        {
            $$ = [ $1 ];
        }
    |   constDelarators COMMA constantDeclarator
        {
            $1.push($3);
            $$ = $1;
        }
    ;

constantDeclarator
    :   Identifier ASSIGN variableInitializer
        {
            $$ = {
                "node": "Variable",
                "name": $1,
                "initializer": $3
            };
        }
    |   Identifier arrayDimensionBrackl ASSIGN variableInitializer
        {
            $$ = {
                "node": "Variable",
                "name": $1,
                "arrayDimension": $2,
                "initializer": $4
            };
        }
    ;

variableDeclarators
    :   variableDeclarator
        {
            $$ = [ $1 ];
        }
    |   variableDeclarators COMMA variableDeclarator
        {
            $1.push($3);
            $$ = $1;
        }
    ;

variableDeclarator
    :   variableDeclaratorId
        {
            $$ = $1;
        }
    |   variableDeclaratorId ASSIGN variableInitializer
        {
            $1["initializer"] = $3;
            $$ = $1;
        }
    ;

variableDeclaratorId
    :   Identifier arrayDimensionBracks
        {
            $$ = {
                "node": "Variable",
                "name": $1,
                "arrayDimension": $2
            };
        }
    ;

variableInitializer
    :   arrayInitializer
    |   expression
    ;

arrayInitializer
    :   LBRACE RBRACE /*(variableInitializerL (",")? )?*/
    |   LBRACE variableInitializerL SEMI RBRACE
    |   LBRACE variableInitializerL RBRACE
    |   LBRACE variableInitializerL COMMA RBRACE
    ;

variableInitializerL
    :   variableInitializer
    |   variableInitializerL COMMA variableInitializer
    ;

enumConstantName
    :   qualifiedName
    ;

type
    :   qualifiedName arrayDimensionBracks
        {
            $$ = {
                "node": "Type",
                "name": $1,
                "arrayDimension": $2
            };
        }
    |   primitiveType arrayDimensionBracks
        {
            $$ = {
                "node": "Type",
                "name": $1,
                "arrayDimension": $2
            };
        }
    ;

arrayDimensionBracks
    :   %empty /* empty */
    |   arrayDimensionBrackl
        {
            $$ = $1;
        }
    ;

arrayDimensionBrackl
    :   arrayDimensionBrack
        {
            $$ = [ $1 ];
        }
    |   arrayDimensionBrackl arrayDimensionBrack
        {
            $1.push($2);
            $$ = $1;
        }
    ;

arrayDimensionBrack
    :   LBRACK RBRACK
        {
            $$ = "[]";
        }
    ;
classOrInterfaceType
    :   qualifiedName
    |   qualifiedName typeParameters
    ;

primitiveType
    :   BOOLEAN
    |   CHAR
    |   BYTE
    |   SHORT
    |   INT
    |   LONG
    |   FLOAT
    |   DOUBLE
    ;

typeArguments
    :   %empty /* empty */
    |   LT typeArgumentList GT
    ;

typeArgumentList
    :   typeArgument
    |   typeArgumentList COMMA typeArgument
    ;

typeArgument
    :   type
    |   QUESTION EXTENDS type
    |   QUESTION SUPER type
    ;

typeArgument_
    : %empty /* empty */
    |   EXTENDS type
    |   SUPER type
    ;

qualifiedNameList
    :   qualifiedName
        {
            $$ = [ $1 ];
        }
    |   qualifiedNameList COMMA qualifiedName
        {
            $1.push($3);
            $$ = $1;
        }
    ;

formalParameters
    :   LPAREN RPAREN
        {
            $$ = [];
        }
    |   LPAREN formalParameterList RPAREN
        {
            $$ = $2;
        }
    ;

formalParameterList
    :   usualParameterList
        {
            $$ = $1;
        }
    |   usualParameterList COMMA lastFormalParameter
        {
            $1.push($3);
            $$ = $1;
        }
    |   lastFormalParameter
        {
            $$ = [ $1 ];
        }
    ;

usualParameterList
    :   usualParameter
        {
            $$ = [ $1 ];
        }
    |   usualParameterList COMMA usualParameter
        {
            $1.push($3);
            $$ = $1;
        }
    ;


variableModifiers
    :   FINAL annotationl
        {
            $$ = [ $1 ];
        }
    |   annotationl
    |   FINAL
        {
            $$ = [ $1 ];
        }
    |   annotationl FINAL
        {
            $$ = [ $2 ];
        }
    ;

variableModifierL
    :   variableModifier
        {
            $$ = [ $1 ];
        }
    |   variableModifierL variableModifier
        {
            $1.push($2);
            $$ = $1;
        }
    ;

variableModifier
    :   FINAL
        {
            $$ = $1;
        }
    |   annotations
    ;

usualParameter
    :   variableModifiers type variableDeclaratorId
        {
            $$ = {
                "node": "Parameter",
                "type": $2,
                "variable": $3,
                "modifiers": $1
            };
        }
    |   type variableDeclaratorId
        {
            $$ = {
                "node": "Parameter",
                "type": $1,
                "variable": $2
            };
        }
    ;

lastFormalParameter
    :   variableModifiers type ELLIPSIS variableDeclaratorId
        {
            $$ = {
                "node": "Parameter",
                "type": $2,
                "variable": $4,
                "modifiers": $1
            };        
        }
    |   type ELLIPSIS variableDeclaratorId
        {
            $$ = {
                "node": "Parameter",
                "type": $1,
                "variable": $3
            };
        }
    ;

methodBody
    :   block
    ;

constructorBody
    :   block
    ;

qualifiedName
    :   Identifier
        {
            $$ = {
                "node": "QualifiedName",
                "name": $1
            };
        }
    |   Identifier typeParameters
        {
            $$ = {
                "node": "QualifiedName",
                "name": $1,
                "typeParameters": $2
            };
        }
    |   qualifiedName DOT Identifier
        {
            $$ = {
                "node": "QualifiedName",
                "name": $1.name + "." + $3
            };
        }
    |   qualifiedName DOT Identifier typeParameters
        {
            $$ = {
                "node": "QualifiedName",
                "name": $1.name + "." + $3,
                "typeParameters": $4
            };
        }
    ;

literal
    :   IntegerLiteral
    |   FloatingPointLiteral
    |   CharacterLiteral
    |   StringLiteral
    |   BooleanLiteral
    |   NullLiteral
    ;

/* ANNOTATIONS */

annotations
    :   %empty /* empty */
    |   annotationl
        {
            $$ = $1;
        }
    ;

annotationl
    :   annotation
        {
            $$ = [ $1 ];
        }
    |   annotationl annotation
        {
            $1.push($2);
            $$ = $1;
        }
    ;

annotation
    :   AT qualifiedName
        {
            $$ = {
                "node": "Annotation",
                "name": $2
            };
        }
    |   AT qualifiedName LPAREN elementValueList RPAREN
        {
            $$ = {
                "node": "Annotation",
                "name": $2,
                "values": $4
            };
        }
    |   AT qualifiedName LPAREN elementValuePairs RPAREN
        {
            $$ = {
                "node": "Annotation",
                "name": $2,
                "values": $4
            };
        }
    ;

annotationOptValues
    :   %empty /* empty */
    |   LPAREN annotationElement RPAREN
    ;

annotationElement
    :   %empty /* empty */
    |   elementValuePairs
    |   elementValue
    ;
annotationName
    :   qualifiedName
    ;

elementValuePairs
    :   elementValuePair
    |   elementValuePairs COMMA elementValuePair
    ;

elementValuePair
    :   Identifier ASSIGN elementValue
    ;

elementValue
    :   expression
    |   annotations
    |   LBRACE RBRACE /*(elementValue ("," elementValue)*)? (",")?*/
    |   LBRACE elementValueList RBRACE
    ;

elementValueArrayInitializer
    :   LBRACE RBRACE /*(elementValue ("," elementValue)*)? (",")?*/
    |   LBRACE elementValueList RBRACE
    ;

elementValueListOpt
    :   %empty /* empty */
    |   elementValueList
    ;

elementValueList
    :   elementValue
    |   elementValueList COMMA elementValue
    ;

annotationTypeDeclaration
    :   AT INTERFACE Identifier annotationTypeBody
        {
            $$ = {
                "node": "AnnotationType",
                "name": $3,
                "body": $4
            };
        }
    |   AT INTERFACE Identifier EXTENDS typeList annotationTypeBody
        {
            $$ = {
                "node": "AnnotationType",
                "name": $3,
                "extends": $5,
                "body": $6
            };
        }        
    ;

annotationTypeBody
    :   LBRACE RBRACE
    |   LBRACE annotationTypeElementDeclarations RBRACE
        {
            $$ = $2;
        }
    ;


annotationTypeElementDeclarations
    :   annotationTypeElementDeclaration
        {
            $$ = [ $1 ];
        }
    |   annotationTypeElementDeclarations annotationTypeElementDeclaration
        {
            $1.push($2);
            $$ = $1;
        }
    ;

annotationTypeElementDeclaration
    :   modifierL annotationTypeElementRest
    |   annotationl annotationTypeElementRest
    |   annotationl modifierL annotationTypeElementRest
    |   modifierL annotationl annotationTypeElementRest
    |   annotationTypeElementRest
    |   SEMI /* this is not allowed by the grammar, but apparently allowed by the actual compiler*/
    ;

annotationTypeElementRest
    :   type annotationConstantRest SEMI
    |   typeParameters type annotationMethodRest SEMI
    |   type annotationMethodRest SEMI
    |   classDeclaration
    |   interfaceDeclaration
    |   enumDeclaration
    |   annotationTypeDeclaration
    ;

semiOpt
    :   %empty /* empty */
    |   SEMI
    ;

annotationMethodRest
    :   Identifier LPAREN RPAREN defaultValue
    |   Identifier LPAREN RPAREN
    ;

defaultValueOpt
    :   %empty /* empty */
    |   defaultValue
    ;
annotationConstantRest
    :   variableDeclarators
    ;

defaultValue
    :   DEFAULT elementValue
    ;

/* STATEMENTS / BLOCKS */

block
    :   LBRACE RBRACE
        
    |   LBRACE blockStatementList RBRACE
        
    ;

blockStatements
    :   %empty /* empty */
    |   blockStatementList
    ;

blockStatementList
    :   blockStatement
    |   blockStatementList blockStatement
    ;

blockStatement
    :   statement
    /*|   typeDeclaration */
    |   LBRACE RBRACE
        
    |   LBRACE blockStatementList RBRACE
        
    ;

localVariableDeclarationStatement
    :   localVariableDeclaration SEMI
    ;

localVariableDeclaration
    :   type variableDeclarators
    ;

assertExpression
    :   expression
    |   expression COLON expression
    ;

optionalElseStatement
    :   %empty /* empty */
    |   ELSE blockStatement
    ;

statement
    :   ASSERT assertExpression SEMI
    |   IF LPAREN expression RPAREN blockStatement optionalElseStatement
/*       % {console.log('IF block'); %} */
    |   FOR LPAREN forControl RPAREN blockStatement
    |   WHILE LPAREN expression RPAREN blockStatement
    |   DO blockStatement WHILE LPAREN expression RPAREN SEMI
    |   TRY block catchFinallyOrOnlyFinally
    |   TRY resourceSpecification block catchClauses
    |   TRY resourceSpecification block optionalFinallyBlock
    |   TRY resourceSpecification block catchClauses optionalFinallyBlock
    |   SWITCH LPAREN expression RPAREN LBRACE switchBlockStatementGroups emptySwitchLabels RBRACE
    |   SYNCHRONIZED LPAREN expression RPAREN block
    |   RETURN SEMI
    |   RETURN expression SEMI
    |   THROW expression SEMI
    |   BREAK optionalIdentifier SEMI
    |   CONTINUE optionalIdentifier SEMI
/*    |   SEMI*/
    |   Identifier COLON blockStatement
    |   expression SEMI
    |   typeDeclarationWithPrefixes /*Refer openjdk/hotspot/agent/src/share/classes/sun/jvm/hotspot/tools/PermStat.java:70 */
    |   variableDeclaratorsWithPrefixes
    /*|   LBRACE RBRACE
        { console.log('Found empty code block')}
    |   LBRACE blockStatementList RBRACE
        { console.log('Found code block')} */
    ;

variableDeclaratorsWithPrefixes
    :   annotationl modifierL localVariableDeclaration
    |   modifierL annotationl localVariableDeclaration
    |   modifierL localVariableDeclaration
    |   annotationl localVariableDeclaration
    |   localVariableDeclaration 
    ;

simpleExpressionStatement
    :   expression SEMI
    ;
optionalIdentifier
    :   %empty /* empty */
    |   Identifier
    ;

catchFinallyOrOnlyFinally
    :   catchClauses optionalFinallyBlock
    |   finallyBlock
    ;

optionalFinallyBlock
    :   %empty /* empty */
    |   finallyBlock
    ;
catchClauses
    :   catchClause
    |   catchClauses catchClause
    ;

catchClause
    :   CATCH LPAREN variableModifiers catchType Identifier RPAREN block
    |   CATCH LPAREN catchType Identifier RPAREN block
    ;

catchType
    :   qualifiedName
    |   catchType BITOR qualifiedName
    ;

finallyBlock
    :   FINALLY block
    ;

resourceSpecification
    :   LPAREN resources semiOpt RPAREN
    ;

resources
    :   resource
    |   resources SEMI resource
    ;

resource
    :   variableModifiers classOrInterfaceType variableDeclaratorId ASSIGN expression
    |   classOrInterfaceType variableDeclaratorId ASSIGN expression
    ;


switchBlockStatementGroups
    :   %empty /* empty */
    |   switchBlockStatementGroupL
    ;

switchBlockStatementGroupL
    :   switchBlockStatementGroup
    |   switchBlockStatementGroupL switchBlockStatementGroup
    ;

switchBlockStatementGroup
    :   switchLabelL blockStatementList
    |   switchLabelL
    ;

emptySwitchLabels
    :   %empty /* empty */
    |   switchLabelL
    ;

switchLabelL
    :   switchLabel
    |   switchLabelL switchLabel
    ;

switchLabel
    :   CASE expression COLON /* openjdk/jdk/src/share/classes/com/sun/java/util/jar/pack/BandStructure.java:2421 */
    /*|   CASE enumConstantName COLON*/
    |   DEFAULT COLON
    ;

forControl
    :   enhancedForControl
        
    |   forInit SEMI optionalExpression SEMI optionalForUpdate
    |   SEMI optionalExpression SEMI optionalForUpdate
    ;

optionalForInit
    :   %empty /* empty */
    |   forInit
    ;

optionalExpression
    :   %empty /* empty */
    |   expression
    ;

optionalForUpdate
    :   %empty /* empty */
    |   forUpdate
    ;

forInit
    :   variableDeclaratorsWithPrefixes
    |   expressionList
    ;

enhancedForControl
    :   modifierL type variableDeclaratorId COLON expression
    |   type variableDeclaratorId COLON expression
    ;

forUpdate
    :   expressionList
    ;

/* EXPRESSIONS */

parExpression
    :   LPAREN expression RPAREN
    ;

expressionList
    :   expression
    |   expressionList COMMA expression
    ;

optionalExpressionList
    :   %empty /* empty */
    |   expressionList
    ;
statementExpression
    :   expression
    ;

constantExpression
    :   expression
    ;

optionalNonWildcardTypeArguments
    :   %empty /* empty */
    |   nonWildcardTypeArguments
    ;

/* Postfix inc or dec */
incrementOrDecrement
    :   INC
    |   DEC
    ;

/* Prefix arithmetic unary operators */

plusMinusIncOrDec
    :   ADD
    |   SUB
    |   INC
    |   DEC
    ;

prefixTildeOrBang
    :   TILDE
    |   BANG
    ;

/* Binary operators */
mulDivOrMod
    :   MUL
    |   DIV
    |   MOD
    ;

addOrSub
    :   ADD
    |   SUB
    ;

bitShiftOperator
    :   LT LT           /* << left shift */
    |   GT GT GT        /* >>> unsigned right shift */
    |   GT GT           /* right shift */
    ;
lE_GE_LT_GT
    :   LE
    |   GE
    |   GT
    |   LT
    ;

equals_NotEqual
    :   EQUAL
    |   NOTEQUAL
    ;

assignmentToken
    :   ASSIGN
    |   ADD_ASSIGN
    |   SUB_ASSIGN
    |   MUL_ASSIGN
    |   DIV_ASSIGN
    |   AND_ASSIGN
    |   OR_ASSIGN
    |   XOR_ASSIGN
    |   RSHIFT_ASSIGN
    |   URSHIFT_ASSIGN
    |   LSHIFT_ASSIGN
    |   MOD_ASSIGN
    ;

newCreator
    :   NEW creator
    ;


expression
    :   parExpression
    |   qualifiedName
    /*|   qualifiedName LT expression */
    /*|   qualifiedName DOT CLASS*/
    |   qualifiedName DOT CLASS
    |   expression DOT qualifiedName
    |   expression DOT SUPER
    |   qualifiedName DOT SUPER
    |   qualifiedName DOT SUPER DOT expression
    |   expression DOT SUPER DOT expression
    |   expression DOT SUPER arguments
    |   expression DOT SUPER LPAREN RPAREN
    |   expression 
    |   qualifiedName DOT newCreator
    |   expression DOT newCreator /* openjdk/jdk/src/share/classes/com/sun/java/util/jar/pack/Attribute.java:487 */
    |   qualifiedName arrayDimensionBrackl DOT CLASS
    |   primitiveType DOT CLASS
    /*|   type DOT CLASS*/
    |   primitiveType arrayDimensionBrackl DOT CLASS
    |   qualifiedName DOT THIS
    |   expression DOT THIS
    |   expression DOT NEW optionalNonWildcardTypeArguments innerCreator
    |   qualifiedName DOT explicitGenericInvocation
    |   expression DOT qualifiedName 
    |   expression DOT typeParameters Identifier arguments
    |   expression LBRACK expression RBRACK
    |   qualifiedName LBRACK expression RBRACK
    |   expression arguments
    |   expression LPAREN RPAREN
    |   newCreator
    |   parExpression expression
    /*|   typeCast expression*/
    /*|   typeCast DOT qualifiedName*/
    |   expression incrementOrDecrement
    |   plusMinusIncOrDec expression
    |   prefixTildeOrBang expression
    |   expression mulDivOrMod expression
    |   expression addOrSub expression
    |   expression LSHIFT expression
    |   expression GT GT expression
    |   expression GT GT GT expression
    |   expression lE_GE_LT_GT expression
    |   expression INSTANCEOF type
    |   expression equals_NotEqual expression
    |   expression BITAND expression
    |   expression CARET expression
    |   expression BITOR expression
    |   expression AND expression
    |   expression OR expression
    |   expression QUESTION expression COLON expression
    |   expression assignmentToken expression
    |   THIS
    |   SUPER
    |   IntegerLiteral
    |   FloatingPointLiteral
    |   CharacterLiteral
    |   StringLiteral
    |   BooleanLiteral
    |   NullLiteral
    |   VOID DOT CLASS
    |   nonWildcardTypeArguments explicitGenericInvocationSuffixOrThisArgs
    ;

parExpression
    :   LPAREN primitiveType RPAREN
    |   LPAREN qualifiedName arrayDimensionBrackl RPAREN
    |   LPAREN qualifiedName typeParameters arrayDimensionBrackl RPAREN
    |   LPAREN qualifiedName typeParameters RPAREN
    |   LPAREN primitiveType arrayDimensionBrackl RPAREN
    |   LPAREN expression RPAREN /* All except this are type casts */
    /*|   parExpression*/
    /*|   LPAREN qualifiedName LSHIFT expression RPAREN
    |   LPAREN qualifiedName GT GT GT expression RPAREN
    |   LPAREN qualifiedName GT GT expression RPAREN*/
    ;

explicitGenericInvocationSuffixOrThisArgs
    :   explicitGenericInvocationSuffix
    |   THIS arguments
    ;

creator
    :   nonWildcardTypeArguments createdName classCreatorRest
    |   createdName arrayOrClassCreator
    ;

arrayOrClassCreator
    :   arrayCreatorRest
    |   classCreatorRest
    ;

createdName
    :   qualifiedName optionalTypeArgumentsOrDiamonds
    |   primitiveType
    ;

optionalTypeArgumentsOrDiamonds
    :   %empty /* empty */
    |   typeArgumentsOrDiamondList
    ;

typeArgumentsOrDiamondList
    :   typeArgumentsOrDiamond
    |   typeArgumentsOrDiamondList DOT Identifier  typeArgumentsOrDiamond
    ;

innerCreator
    :   Identifier optionalNonWildcardTypeArgumentsOrDiamond classCreatorRest
    ;

optionalNonWildcardTypeArgumentsOrDiamond
    :   %empty /* empty */
    |   nonWildcardTypeArgumentsOrDiamond
    ;
arrayCreatorRest
    :   LBRACK RBRACK arrayDimensionBracks arrayInitializer
    |   bracketedExpressions arrayDimensionBracks
    ;

bracketedExpressions
    :   LBRACK expression RBRACK
    |   bracketedExpressions LBRACK expression RBRACK
    ;

classCreatorRest
    :   arguments
    |   LPAREN RPAREN
    |   LPAREN RPAREN classBody
    |   arguments classBody
    ;

optionalClassBody
    :   %empty /* empty */
    |   classBody
    ;

explicitGenericInvocation
    :   nonWildcardTypeArguments explicitGenericInvocationSuffix
    ;

nonWildcardTypeArguments
    :  TEMPLATE
    ;

typeArgumentsOrDiamond
    :   LT GT
    |   typeParameters
    ;

nonWildcardTypeArgumentsOrDiamond
    :   LT GT
    |   nonWildcardTypeArguments
    ;

superSuffix
    :   arguments
    |   DOT Identifier
    |   DOT Identifier arguments
    ;

optionalArguments
    :   %empty /* empty */
    |   arguments
    ;

explicitGenericInvocationSuffix
    :   SUPER superSuffix
    |   Identifier arguments
    ;

arguments
    :   LPAREN RPAREN
    |   LPAREN expressionList RPAREN
    ;

optionalCOMMA
    :   %empty /* empty */
    |   COMMA
    ;