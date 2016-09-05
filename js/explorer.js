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

const cp = require('child_process')
const readline = require('readline');

var splitAtSlash = new RegExp('([^\/]+(\/|$))', 'g');

var worker;
var RootNode , rootpath = './';
var activePattern = [];

// Creates a tree. New nodes are generated when required by addMatch.
var Node = function(name) {
    this.name = name;
    this.children = new Map();
    this.match = false;
    this.subMatches = 0;
    this.subMatchesEl = newEl("span", 'subcount');
    this.infoElement = newEl("div", 'info', this.name, () => {
        this.DOMelement.classList.toggle('collapsed');
    });
    this.containerElement = newEl("div", 'container');
    this.infoElement.appendChild(this.subMatchesEl);
    this.DOMelement = newEl('div', 'node', [this.infoElement, this.containerElement]);
}
Node.prototype.get = function(basename) {
    let child = this.children.get(basename);
    if (child) return child;
    child = new Node(basename);
    this.containerElement.appendChild(child.DOMelement);
    this.children.set(basename, child);
    return child;
}
Node.prototype.addMatch = function(address) {
    if (address.length == 0) {
        this.match = true;
        this.infoElement.classList.add("match");
    } else {
        this.subMatches += 1;
        this.subMatchesEl.innerHTML = "{" + this.subMatches + "}"
        this.containerElement.classList.add('partial')
        this.get(address[0]).addMatch(address.slice(1));
        this.DOMelement.style.order = this.subMatches;
    }
}
Node.prototype.setMsg = function(address, msg) {
    if (address.length == 0) {
        this.containerElement.innerHTML = msg;
        this.DOMelement.classList.add('msg');
    } else this.get(address[0]).setMsg(address.slice(1))

}
Node.prototype.reset = function() {
    this.match = false;
    this.subMatches = 0;
    this.infoElement.className = 'info';
    this.containerElement.className = 'container';
    this.subMatchesEl.innerHTML = "";
    for (let c of this.children.values())
        c.reset();
}



function str2RegExp(val) {
    if (val[0] != '/' || val[val.length - 1] != '/') throw new Error("Bad Regexp ");
    return new RegExp(val.slice(1, val.length - 1));
}

var StatusEl = function() {
    var el = byID('search-status');
    el.innerHTML = ''
    var timer
    var reset = function() {
        timer = new Date();
        el.innerHTML = '';
        append(el, [newEl('i', "fa fa-spinner fa-pulse"),
            newEl('button', 0, 'cancel', () => {
                el.innerHTML = 'Cancled';
                worker.kill();
            })
        ]);
    }
    var error = function(str) {
        el.innerHTML = '';
        el.appendChild(newEl('i', 'fa fa-exclamation-triangle'));
        el.innerHTML += str;
    }
    var finish = function(n) {
        el.innerHTML = '';
        el.appendChild(newEl('i', 'fa fa-check'));
        el.innerHTML += n + (n == 1 ? " match" : " matches") + " in " + ((new Date()) - timer) + "ms";
    }
    return {
        reset: reset,
        error: error,
        finish: finish
    };
}();



function setPattern(pattern) {
    if(worker) worker.kill();
    StatusEl.reset();
    RootNode.reset();
    Executor.reset();
    activePattern = pattern;
    worker = cp.spawn('node', [process.cwd() + '/js/finder.js'], { cwd: rootpath, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
    worker.stderr.on('data', (d) => console.error("Error", d.toString()));
    worker.on('error', (e, a) => console.error("Err", e, a));
    worker.on('exit', (exitcode, a) => {
        if (exitcode) StatusEl.error();
        console.log("Exit", pattern, exitcode, a)
    });;

    const readline = require('readline');

    var rl = readline.createInterface({
        input: worker.stdout
    });
    var p = newEl('div');
    var i = 0;
    document.body.appendChild(p);
    rl.on('line', (line) => {
        if (line[0] !== ".") {
            worker.kill();
            StatusEl.finish(RootNode.subMatches);
            Executor.endOfQueue();
            return;
        }
        var address = line.slice(2).match(splitAtSlash);
        RootNode.addMatch(address);
        Executor.queue(line);
    })
    worker.send({ pattern: pattern.map(String) });
}






function setup(path) {
    rootpath = path;
    RootNode = new Node("/");
    RootNode.infoElement.style.display = "none";
    RootNode.DOMelement.id = 'root';

    var explorer = byID('explorer');
    explorer.innerHTML = ''
    explorer.appendChild(RootNode.DOMelement);
    Executor.setRoot(path);

}
var rootinput = byID('rootinput');
rootinput.addEventListener('input', (e) => {
    var path = rootinput.innerHTML

    try {
        var dirlist = fs.readdirSync(path);
        rootinput.classList.add('valid');
        rootinput.classList.remove('error');
        console.log(path);
        setup(path);
        setPattern(activePattern);
    } catch (e) {
        rootinput.classList.add('error');
        rootinput.classList.remove('valid');
    }

});

setup('./');



var patternInput = (function() {
    var el = newEl('span', 'inputs');
    byID('pattern').innerHTML = '';
    byID('pattern').appendChild(el);

    function update() {
        let nodes = el.childNodes,
            pattern = [],
            valid = true;
        if (nodes[nodes.length - 1].value) addinput('');
        nodes[nodes.length - 1].className = 'new';
        for (var i = 0; i < nodes.length - 1; i++) {
            let val = nodes[i].value;
            if (!val) {
                el.removeChild(nodes[i]);
                (nodes[i - 1] || nodes[i]).focus();
            } else {
                nodes[i].className = 'ok';
                if (val[0] == '/') {
                    try { pattern.push(str2RegExp(val)); } catch (e) {
                        valid = false;
                        nodes[i].className = 'error';
                    }
                } else pattern.push(val);
            }
        }
        if (valid && pattern.length != 0) setPattern(pattern)

    }

    function addinput(str) {
        let inputEl = newEl('input', 0, str, { 'input': update });
        inputEl.className = 'new';
        el.appendChild(inputEl);
    }
    addinput('**/');
    addinput('/\.js$/');
    update();
})();