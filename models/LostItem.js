module.exports = (sequelize, DataTypes) => {
    const LostItem = sequelize.define('LostItem', {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      location: DataTypes.STRING,
      date_lost: DataTypes.DATEONLY,
      image_url: DataTypes.STRING,
      category: DataTypes.STRING,
      lost_by: DataTypes.STRING,
      contact_info: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('unresolved', 'resolved'),
        defaultValue: 'unresolved',
      },
      date_lost: {
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
  
    return LostItem;
  };
  