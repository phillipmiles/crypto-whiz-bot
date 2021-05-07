"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsTo = exports.millisecondsTo = void 0;
const millisecondsTo = (duration, type) => {
    if (type === 'minutes') {
        return duration * 60000;
    }
    else {
        throw new Error('Unrecognised time deliminator.');
    }
};
exports.millisecondsTo = millisecondsTo;
const secondsTo = (duration, type) => {
    if (type === 'minutes') {
        return duration * 60;
    }
    else {
        throw new Error('Unrecognised time deliminator.');
    }
};
exports.secondsTo = secondsTo;
