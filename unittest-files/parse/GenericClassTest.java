package com.mycompany.test;

// Generic Class
public class GenericClassTest<E, T extends java.util.Collection> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    // Field
    private OrderedPair<String, Box<Integer>> p = new OrderedPair<>("primes", new Box<Integer>());
    private ClassTest classTestRef;

    // Constructor and Method
    public GenericClassTest(Collection<? extends E> c) {}
    public Enumeration<E> elements() {}
    public <T extends Product> void printAll(ArrayList<T> list) {}
}
