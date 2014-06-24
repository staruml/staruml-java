package com.mycompany.test;

import java.util.ArrayList;
import java.lang.*;
import static java.awt.Color;
import static java.lang.Math.*;

@Author(name = "Benjamin Franklin", date = "3/27/2003")
public class ClassTest extends java.util.Vector implements java.lang.Runnable, java.lang.Serializable {

    // Visibility
    private int _privateField;
    protected int _protectedField;
    public int _publicField;
    int _packageField;

    // Array Types
    String[] StringArray;
    int[][] int2DimentionalArray;

    // Multiple Variables
    int a, b, c, d;

    // Field Modifiers
    static final transient volatile int _field;

    // Field Initializer
    int _fieldInt = 10;
    String _fieldString = "String Literal";
    char _fieldChar = 'c';
    boolean _fieldBoolean = true;
    Object _fieldNull = null;

    // Method
    public void test(int arg1, final String arg2) throws IllegalAccess, java.lang.Exception {}
    static final synchronized native strictfp void test2() {}
    abstract int test3() {}

    // Annotated Method
    @Deprecated
    void annotatedMethod() {}

    // Inner Class
    static class InnerClass {
    }

}
