const { DataTypes } = require('sequelize');

function defineModels(sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [20, 60],
          msg: 'Name must be between 20 and 60 characters.'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Email address is already in use.'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address.'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
      validate: {
        len: {
          args: [0, 400],
          msg: 'Address cannot exceed 400 characters.'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'store_owner'),
      allowNull: false,
      defaultValue: 'user'
    }
  }, {
    timestamps: true
  });

  const Store = sequelize.define('Store', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [20, 60],
          msg: 'Store name must be between 20 and 60 characters.'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Store email is already in use.'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid store email address.'
        }
      }
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
      validate: {
        len: {
          args: [0, 400],
          msg: 'Store address cannot exceed 400 characters.'
        }
      }
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }
  }, {
    timestamps: true
  });

  const Rating = sequelize.define('Rating', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Stores',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Rating must be at least 1.'
        },
        max: {
          args: [5],
          msg: 'Rating cannot exceed 5.'
        }
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'storeId']
      }
    ]
  });

  // Declare associations
  Store.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
  User.hasOne(Store, { as: 'store', foreignKey: 'ownerId' });

  Rating.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Rating.belongsTo(Store, { as: 'store', foreignKey: 'storeId' });

  Store.hasMany(Rating, { as: 'ratings', foreignKey: 'storeId' });
  User.hasMany(Rating, { as: 'ratings', foreignKey: 'userId' });

  return { User, Store, Rating };
}

module.exports = { defineModels };
