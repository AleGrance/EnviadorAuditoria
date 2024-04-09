module.exports = (sequelize, DataType) => {
  const Encuestas_auditoria = sequelize.define(
    "Encuestas_auditoria",
    {
      id_Encuestas_auditoria: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      pregunta1: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta2: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta3: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta4: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta5: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta6: {
        type: DataType.STRING,
        allowNull: true
      },
      pregunta7: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta8: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta9: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta10: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta11: {
        type: DataType.STRING,
        allowNull: true
      },
      pregunta12: {
        type: DataType.STRING,
        allowNull: true
      },
      pregunta13: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta14: {
        type: DataType.STRING,
        allowNull: true
      },
      pregunta15: {
        type: DataType.STRING,
        allowNull: true
      },
      pregunta16: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta17: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta18: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta19: {
        type: DataType.STRING,
        allowNull: false
      },
      pregunta20: {
        type: DataType.STRING,
        allowNull: false
      },
    },
    { freezeTableName: true }
  );

  Encuestas_auditoria.associate = (models) => {
    // Pertenece a UN solo cliente
    Encuestas_auditoria.belongsTo(models.Clientes_auditoria, {
      foreignKey: {
        name: "NRO_DOCUMENTO",
        allowNull: false,
        defaultValue: 1,
        unique: true
      },
    });

    Encuestas_auditoria.belongsTo(models.Users, {
      foreignKey: {
        name: "user_id",
        allowNull: true,
        defaultValue: 1,
      },
    });

    

  };
  return Encuestas_auditoria;
};
