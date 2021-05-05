new Trade('DOGE-PERP', 'long');
var Market = /** @class */ (function () {
    function Market(id, type) {
        this.id = id;
        this.type = type; // future or spot
    }
    return Market;
}());
var Trade = /** @class */ (function () {
    function Trade(market, positionType) {
        this.market = market;
        this.positionType = positionType; // short or long
    }
    return Trade;
}());
module.exports = Trade;
