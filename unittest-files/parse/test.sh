#!/bin/bash

Files="";
for f in $(find "$PWD/java-testset" -name  '*.java')
do
echo $f
node "$PWD/java7.js"  "$f" ;
if [ $? -ne 0 ];
then
	echo "Error in execution at $f"
	printf "$f\n" >> failing_classes.txt
	Files="$Files:$f";
fi;

done

echo $Files