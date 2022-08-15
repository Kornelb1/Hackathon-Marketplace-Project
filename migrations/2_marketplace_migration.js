const MarketplaceMigration = artifacts.require("ProductMarketplace");

module.exports = function (deployer) {
  deployer.deploy(MarketplaceMigration);
};