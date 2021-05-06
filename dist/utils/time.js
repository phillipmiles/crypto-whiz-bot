"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsTo = void 0;
const secondsTo = (duration, type) => {
    if (type === 'minutes') {
        return duration * 60;
    }
    else {
        throw new Error('Unrecognised time deliminator.');
    }
};
exports.secondsTo = secondsTo;
