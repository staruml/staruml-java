package com.mycompany.test;

// Generic Class
public class GenericClassTest<E, T> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    // Field
    private OrderedPair<String, Box<Integer>> p = new OrderedPair<>("primes", new Box<Integer>());

    // Constructor and Method
    public Vector(Collection<? extends E> c) {}
    public Enumeration<E> elements() {}

}
