function secondsTo(duration, type) {
    if (type === 'minutes') {
        return duration * 60;
    }
}
module.exports = { secondsTo: secondsTo };
