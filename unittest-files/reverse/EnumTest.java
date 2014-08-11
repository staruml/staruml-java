package com.mycompany.packagetest;

public enum EnumTest {
    // Enum Constants
    ENUM_CONSTANT1(false),
    ENUM_CONSTANT2(true),
    ENUM_CONSTANT3(true);

    // Enum Field
    private final boolean enumField ;

    // Enum Constructor
    EnumTest(boolean enumField) {
        this.enumField = enumField ;
    }

    // Enum Method
    public boolean enumMethod() {
        return this.enumField ;
    }
}
