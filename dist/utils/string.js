"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subStringBetween = void 0;
const subStringBetween = (str, subStrStart, subStrEnd) => {
    const startStrIndex = str.indexOf(subStrStart);
    if (startStrIndex === -1)
        return;
    const endStrIndex = str.indexOf(subStrEnd, startStrIndex + subStrStart.length);
    if (endStrIndex === -1)
        return;
    return str.substring(startStrIndex + subStrStart.length, endStrIndex);
};
exports.subStringBetween = subStringBetween;
