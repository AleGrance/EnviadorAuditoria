module.exports = (sequelize, DataType) => {
  const Clientes_auditoria = sequelize.define(
    "Clientes_auditoria",
    {
      NRO_DOCUMENTO: {
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      NOMBRE: {
        type: DataType.STRING,
        allowNull: false,
      },
      APELLIDO: {
        type: DataType.STRING,
        allowNull: false,
      },
      RUC: {
        type: DataType.STRING,
        allowNull: true,
      },
      TELEFONO_UNO: {
        type: DataType.STRING,
        allowNull: true,
      },
      TELEFONO_DOS: {
        type: DataType.STRING,
        allowNull: true,
      },
      TELEFONO_TRES: {
        type: DataType.STRING,
        allowNull: true,
      },
      estado_envio: {
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { freezeTableName: true }
  );

  Clientes_auditoria.associate = (models) => {
    // Tiene una encuesta de auditoria asociada
    Clientes_auditoria.hasOne(models.Encuestas_auditoria, {
      foreignKey: {
        name: "NRO_DOCUMENTO",
        allowNull: true,
        defaultValue: 1,
      },
    });

    Clientes_auditoria.belongsTo(models.Users, {
      foreignKey: {
        name: "user_id",
        allowNull: true,
        defaultValue: 1,
      },
    });
  };
  return Clientes_auditoria;
};
