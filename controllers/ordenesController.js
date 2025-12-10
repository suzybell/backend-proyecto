const db = require("../config/db");

// --------------------------------------------------
// 1. CREAR ORDEN (CHECKOUT)
// --------------------------------------------------
exports.crearOrden = async (req, res) => {
    const { usuario_id, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id } = req.body;

    try {
        // Obtener carrito
        const [carrito] = await db.query(
            "SELECT c.id, c.producto_id, c.cantidad, p.precio FROM carrito c INNER JOIN productos p ON p.id = c.producto_id WHERE c.usuario_id = ?",
            [usuario_id]
        );

        if (carrito.length === 0) {
            return res.status(400).json({ mensaje: "El carrito está vacío" });
        }

        // Calcular total
        let total = 0;
        carrito.forEach(item => {
            total += item.precio * item.cantidad;
        });

        // Crear orden
        const [orden] = await db.query(
            "INSERT INTO ordenes (usuario_id, total, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id) VALUES (?, ?, ?, ?, ?, ?)",
            [usuario_id, total, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id]
        );

        const orden_id = orden.insertId;

        // Insertar detalle
        for (const item of carrito) {
            await db.query(
                "INSERT INTO orden_detalle (orden_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
                [
                    orden_id,
                    item.producto_id,
                    item.cantidad,
                    item.precio,
                    item.precio * item.cantidad
                ]
            );
        }

        // Vaciar carrito
        await db.query("DELETE FROM carrito WHERE usuario_id = ?", [usuario_id]);

        res.json({
            mensaje: "Compra realizada con éxito",
            total,
            orden_id,
            estado: "pendiente"
        });

    } catch (error) {
        console.error("Error creando orden:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// --------------------------------------------------
// 2. LISTAR ÓRDENES POR USUARIO
// --------------------------------------------------
exports.listarOrdenes = async (req, res) => {
    const { usuario_id } = req.params;

    try {
        const [ordenes] = await db.query(
            "SELECT * FROM ordenes WHERE usuario_id = ? ORDER BY fecha DESC",
            [usuario_id]
        );

        res.json(ordenes);

    } catch (error) {
        res.status(500).json({ error: "Error al obtener órdenes" });
    }
};

// --------------------------------------------------
// 3. DETALLE DE UNA ORDEN
// --------------------------------------------------
exports.detalleOrden = async (req, res) => {
    const { orden_id } = req.params;

    try {
        // Obtener orden
        const [orden] = await db.query(
            "SELECT * FROM ordenes WHERE id = ?",
            [orden_id]
        );

        if (orden.length === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        // Obtener productos
        const [detalle] = await db.query(
            `SELECT od.*, p.nombre AS nombre_producto 
             FROM orden_detalle od
             INNER JOIN productos p ON p.id = od.producto_id
             WHERE od.orden_id = ?`,
            [orden_id]
        );

        res.json({
            orden: orden[0],
            productos: detalle
        });

    } catch (error) {
        res.status(500).json({ error: "Error al obtener detalle de la orden" });
    }
};
