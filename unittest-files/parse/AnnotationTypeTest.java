package com.mycompany.test;

@interface ClassPreamble {
    int _annotationConstant;
    String author();
    String lastModified() default "N/A";
}
