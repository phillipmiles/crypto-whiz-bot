new Trade('DOGE-PERP', 'long',)

class Trade

class SpotTrade

class MarginTrade

class Position ???


class Market {
  constructor(id, type) {
    this.id = id;
    this.type = type; // future or spot
  }
}


class Trade {
  constructor(market, positionType,) {
    this.market = market;
    this.positionType = positionType; // short or long

  }
}


module.exports = Trade;