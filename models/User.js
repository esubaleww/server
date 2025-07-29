module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    student_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: DataTypes.STRING,
    profile_picture: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'verified', // Already verified via OTP
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'student',
    },
    date_created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return User;
};
