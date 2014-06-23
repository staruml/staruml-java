#!/bin/bash

jison "$PWD/java7.jison" "$PWD/java7.jisonlex"  -t -p lalr > jisonOutput.txt
