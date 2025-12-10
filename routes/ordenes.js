const express = require("express");
const router = express.Router();
const ordenesController = require("../controllers/ordenesController");

// Crear orden (checkout)
router.post("/crear", ordenesController.crearOrden);

// Listar órdenes por usuario
router.get("/:usuario_id", ordenesController.listarOrdenes);

// Ver detalle de una orden
router.get("/detalle/:orden_id", ordenesController.detalleOrden);

module.exports = router;
