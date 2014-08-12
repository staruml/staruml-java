package com.mycompany.test;

public interface InterfaceTest extends java.lang.Runnable, java.lang.Serializable {

    public static final int interfaceStaticField = 100;

    public CompositeContext createContext(ColorModel srcColorModel, ColorModel dstColorModel);

}
