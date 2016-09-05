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

const fs = require('fs');
const byID = document.getElementById.bind(document);


function ObjectKeyValue(obj) {
    return Object.keys(obj).map((key) => [key, obj[key]]);
}

function newEl(type, className, innerHTML, eventListeners) {
    let x = document.createElement(type);
    if (className) {
        if (typeof className === 'string') {
            className.split(' ').forEach(function(clas) {
                x.classList.add(clas);
            })
        } else if (Array.isArray(className)) console.log("?");
        else ObjectKeyValue(className).forEach(([key, val]) => x[key] = val);
    }
    if (innerHTML) {
        if (typeof innerHTML === 'string') {
            x.innerHTML = escapeHtml(innerHTML);
            if (x.value !== undefined) x.value = innerHTML;
        } else if (Array.isArray(innerHTML)) append(x, innerHTML);
        else x.appendChild(innerHTML);
    }
    if (eventListeners) {
        if (eventListeners.apply) x.addEventListener('click', eventListeners);
        else ObjectKeyValue(eventListeners).forEach(([event, listener]) => x.addEventListener(event, listener));
    }
    return x
}

function append(parent, children) {
    children.forEach(parent.appendChild, parent);
}


function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, "&#x2F;")
}

function progressEl(){
    return newEl('div','spinner',[newEl('div','cube1'),newEl('div','cube2')])
}

