package com.mycompany.test;

import java.util.*;

public class AssociationTest {

    // Associations with multiplicity (*) and isOrdered = true
    public List<ClassTest> classList;
    public ArrayList<ClassTest> classArrayList;
    public LinkedList<ClassTest> classLinkedList;
    public Vector<ClassTest> classVector;
    
    // Associations with multiplicity (*) and isOrdered = false
    public Set<ClassTest> classSet;
    public HashSet<ClassTest> classHashSet;
    public SortedSet<ClassTest> classSortedSet;
    public NavigableSet<ClassTest> classNavigableSet;
    public TreeSet<ClassTest> classTreeSet;
    
}
