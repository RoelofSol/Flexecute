

#Flexecute - alpha


Only usefull on unix machines atm.

To run 

	npm install -g electron 
	electron . 

#Description
A less powerfull 'find' alternative but with less flags and a simpler interface. 

Search for files with an easy syntax and visual feedback.
Then execute a custom or preset command with the matching filenames as stdin.


### If you know any usefull commands. Send them over!

# Pattern Syntax

    All folders end with '/'  
    if input starts with '/' -> RegExp 
    else String -> 
        *   => Any match 
        */  => Any folder
        **  => Everything 
        **/ => Recursive folder 
        _   =>  === string

#####ex:
	[ "test/" , "**/" , /\.js$/ ]  
	
In the folder test/ , find all files ending with '.js' 



## TODO 
* Clean up GUI
* Detect Win or Unix env 
* Add Win cmds
* Save commands to preset list 
* Add more execution modes:
       * normal terminal
       * built in xargs
       * batchfile argument


