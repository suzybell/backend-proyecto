CREATE DATABASE script_backend;
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8;
USE `mydb`;

-- 1️⃣ Usuarios
CREATE TABLE Usuarios (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(100) NOT NULL,
  Apellido VARCHAR(100) NOT NULL,
  Email VARCHAR(150) NOT NULL UNIQUE,
  Contraseña VARCHAR(255) NOT NULL,
  Rol ENUM('cliente', 'admin') DEFAULT 'cliente',
  Fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idUsuario)
) ENGINE=InnoDB;

-- 2️⃣ Pedidos
CREATE TABLE Pedidos (
  idPedido INT NOT NULL AUTO_INCREMENT,
  Usuario_id INT NOT NULL,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Total DECIMAL(10,2) NOT NULL,
  Estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
  PRIMARY KEY (idPedido),
  FOREIGN KEY (Usuario_id) REFERENCES Usuarios(idUsuario)
) ENGINE=InnoDB;

-- 3️⃣ Productos
CREATE TABLE Productos (
  idProducto INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(150) NOT NULL,
  Descripcion TEXT,
  Precio DECIMAL(10,2) NOT NULL,
  Stock INT NOT NULL,
  imagen_url VARCHAR(255),
  Fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idProducto)
) ENGINE=InnoDB;

-- 4️⃣ Detalles_pedido
CREATE TABLE Detalles_pedido (
  idDetalle INT NOT NULL AUTO_INCREMENT,
  Pedido_id INT NOT NULL,
  Producto_id INT NOT NULL,
  Cantidad INT NOT NULL,
  Precio_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idDetalle),
  FOREIGN KEY (Pedido_id) REFERENCES Pedidos(idPedido),
  FOREIGN KEY (Producto_id) REFERENCES Productos(idProducto)
) ENGINE=InnoDB;


