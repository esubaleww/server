module.exports = (sequelize, DataTypes) => {
    const FoundItem = sequelize.define('FoundItem', {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      location: DataTypes.STRING,
      image_url: DataTypes.STRING,
      category: DataTypes.STRING,
      found_by: DataTypes.STRING,
      contact_info: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('unclaimed', 'claimed'),
        defaultValue: 'unclaimed',
      },
      date_found: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      user_id: {
        type: DataTypes.STRING,
        references: {
          model: 'User',
          key: 'student_id'
        }
      },      
    });
  
    return FoundItem;
  };
  