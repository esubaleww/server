const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('lost_found', 'root', '@Es2#&*!', {
  host: 'localhost',
  dialect: 'mysql'
});

const User = require('./User')(sequelize, DataTypes);
const LostItem = require('./LostItem')(sequelize, DataTypes);
const FoundItem = require('./FoundItem')(sequelize, DataTypes);

module.exports = {
  sequelize,
  User,
  LostItem,
  FoundItem
};
