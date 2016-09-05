/*  
    Copyright (C) 2016 R.A. Sol  
    This file is part of Flexecute.

    Flexecute is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    Flexecute is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Flexecute.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    TODO 
    add more modes:
        normal terminal
        built in xargs

    detect Win or Unix env 
    save commands to preset list 
*/

var terminalEl = byID('terminal')
var Executor = (function() {
        var matches = [];
        var q = [];
        var mode = 'single-stdin';
        var program;
        var rootpath = "./"
        var foundAll = false;
        function reset() {
            i = 0;
            matches = [];
            queue = [];
            foundAll = false;
            stopProgram();
        }

        function stopProgram() {
            if (!program) return;
            program.stdin.end();
            program.kill();
            program = undefined;
        }

        function endOfQueue(){
            foundAll = true;
        }
        function processMatch(finished) {
            if (!program) return;
            let addr;
            while (addr = queue.shift()){
                program.stdin.write(addr+'\n');
            }
            if(foundAll) program.stdin.end();
        }
        function queue(match) {
            matches.push(match.slice());
            queue.push(match.slice());
            processMatch();
        }

        var cmdInput = byID('cmdinput');
        terminalEl.addEventListener('click',()=>cmdInput.focus());
        var lastWasSlash = false; //Emulate terminal multi line input after '\'
        cmdInput.addEventListener('keydown' ,(e)=>{
            if(e.keyCode == 13 && !lastWasSlash && cmdInput.innerHTML !== ''){
                command = cmdInput.innerText;
                cmdInput.innerHTML = ''
                
                stopProgram();
                run();
                e.preventDefault();
                return false;
            } 
            lastWasSlash = e.keyCode === 220; 
        })
        function run() {
            queue = matches.slice();
            if (mode === 'single-stdin') {
                program = cp.exec(command,{cwd:rootpath});
                new Execution(command,program);
                processMatch();
            }
        }
        function setRoot(path){
            rootpath = path;
        }

        var presetlist = byID('presets');
        var presetbtn = byID('showpreset');
        presetbtn.addEventListener('click',()=>{
            presetlist.style.display = ( presetlist.style.display == 'block') ? 'none':'block'
        })
        function addPresetCmd({filename,desc , cmd}){
            var fileEl = newEl('label','filename',filename);
            var cmdEl = newEl('pre','cmd',cmd) ;
            var descEl = newEl('div','desc',desc)
            var el = newEl('div','preset-option',[ fileEl,cmdEl,descEl ] );
            el.addEventListener('click',()=>{
                cmdInput.innerHTML = cmd;
                presetlist.style.display = 'none';
                cmdInput.focus();
                var range = document.createRange();
                range.selectNodeContents(cmdInput);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            })
            presets.appendChild(el);
        }

        //Get cmds from the command folder
        var cmddir = './cmds/unix/'
        fs.readdir(cmddir,(err,list)=>{
            if(err) return console.error(e);
            list.map((filename)=>{
                function error(e) {
                    console.error("Error loading ",filename,e);
                }
                fs.readFile(cmddir+filename,(err,content)=>{
                    if(err) return error(err);
                    var lines = content.toString().split('\n');
                    var desc = [] , cmd = ''
                    for (var line of lines){
                        if(line[0] == "#") desc.push(line.slice(1));
                        else if (line !== '' ) {
                            cmd = line; 
                            break;
                        }
                    }
                    if(!cmd) return error(new Error('missing content'))
                    addPresetCmd({filename:filename,cmd:cmd,desc:desc.join('\n')})
                })
            })
        });

        return {
            queue: queue,
            setRoot:setRoot,
            reset: reset,
            run: run,
            endOfQueue:endOfQueue
        }
    })();



//gives feedback on running process
var Execution = function(command,childprocess){
    var shouldScroll = terminalEl.scrollTop>=(terminalEl.scrollHeight-terminalEl.clientHeight);  
    var statusEl = newEl('i', "fa fa-spinner fa-pulse")
    var cmdEl = newEl('div',"cmd",[statusEl,newEl('span','prompt-token'),newEl('span',0,command)])
    var outputEl = newEl('code','output');
    var lineEl = newEl('div','line',[cmdEl,newEl('pre',0,outputEl)]);
    byID('executions').appendChild(lineEl);
    if(shouldScroll) terminalEl.scrollTop = terminalEl.scrollHeight;
    var pipeElements = childprocess.stdio.map((pipe,i)=>{
        if(!pipe) return;
        pipe.on('data',(data)=> {
            var shouldScroll = terminalEl.scrollTop>=(terminalEl.scrollHeight-terminalEl.clientHeight);  
            outputEl.appendChild(newEl('span','data-'+i,data))
            if(shouldScroll) terminalEl.scrollTop = terminalEl.scrollHeight;
        })
        pipe.on('error',(e)=> console.warn(command,e))
    })
    childprocess.on('error', (e, a) => console.error("Err",command, e, a));
    childprocess.on('exit', (code, a) => {
        if(code === 0) statusEl.className = 'fa fa-check';
        else statusEl.className = 'fa fa-exclamation-triangle'
    });
}


