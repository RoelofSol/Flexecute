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
    spawned in a seperate process by explorer.js
    IMPORTANT 
    All folders always end with a '/'
*/
const fs = require('fs');
process.on('unhandledRejection', (reason, p) => {
    console.error("Error", p);
    console.error("ErrReason", reason)
});

function ObjectKeyValue(obj) {
    return Object.keys(obj).map((key) => [key, obj[key]]);
}

/*  takes a single token and a list of expressions (pattern)
    returns a list of matched pattern's , where a empty pattern indicates a match
    ex: 
        ('abc' , ['abc','something'])   -> [ ['something'] ]
        ('abc' , ['**','something'])    -> [ [] ['something']]
*/
function Matcher(value, pattern) {
    var expr = pattern[0]
    var rest = pattern.slice(1);
    if (!expr) return [];
    else if (expr === value) return [rest];
    else if (expr === "*") return [rest];
    else if (expr instanceof RegExp) {
        if (expr.test(value)) {
            return [rest];
        }
        return [];
    } else if (expr === "**") {
        return [
            [],
            ["**"]
        ];
    } else if (expr === "*/" && value.substr(-1) === "/") {
        return [rest];
    } else if (expr === "**/") {
        return Matcher(value, rest).concat([pattern.slice()]);
    }
    return [];
}

function testPatterns(token, patterns) {
    let matched = patterns.reduce((matches, pattern) => matches.concat(Matcher(token, pattern)), []);
    let subPatterns = matched.filter((m) => m.length !== 0);
    let isMatch = matched.length != 0 && (matched.length !== subPatterns.length);
    return {
        isMatch: isMatch,
        subPatterns: subPatterns
    }
}

function getChildren(path) {
    if (path.substr(-1) != "/") return [];
    return fs.readdirSync(path).map((v) => fs.lstatSync(path + v).isDirectory() ? v + "/" : v);
}

function findMatches(path, name, patterns) {
    let { isMatch, subPatterns } = testPatterns(name, patterns);
    isMatch = isMatch ? 1 : 0;
    if (isMatch) console.log(path);
    if (subPatterns.length == 0) return Promise.resolve(isMatch);
    return getChildren(path)
        .map((child) => findMatches(path + child, child, subPatterns.slice(0)))
        .reduce((a, b) => a + b, isMatch)
}


process.on('message', ({ pattern }) => initPatternMatcher(pattern));

function initPatternMatcher(pattern) {
    pattern = pattern.map((expr) => expr[0] == '/' ? new RegExp(expr.slice(1, expr.length - 1)) : expr)
    let initPattern = [
        ["*"].concat(pattern)
    ]
    var i = findMatches('./', './', initPattern)
    console.log('done');
}
