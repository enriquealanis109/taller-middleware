import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express(); //Crea la aplicacion
const PORT = 3000; //Puerto donde se va a escuchar

app.use(express.json()); //Middleware global, convierte el JSON que llega en el body a un objeto

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
}

const listaPorductos: Producto[] = [
  { id: 1, nombre: "Laptop", precio: 15000, stock: 10, activo: true },
  { id: 2, nombre: "Mouse", precio: 350, stock: 50, activo: true },
  { id: 3, nombre: "Teclado", precio: 800, stock: 30, activo: true },
  { id: 4, nombre: "Monitor", precio: 4200, stock: 15, activo: true },
  { id: 5, nombre: "Audífonos", precio: 1200, stock: 25, activo: true },
];
//Middleware para poder eliminar
const verifIcarRol = (rolMinimo: "MODERADOR" | "ADMIN") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rol = req.headers["x-rol"];
    if (!rol || (rolMinimo === "ADMIN" && rol !== "ADMIN")) {
      res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado, se requiere rol de Admin",
      });
      return;
    }
    next();
  };
};
//Middlere para validacion de datos
const validarProducto = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { nombre, precio } = req.body;

  if (!nombre) {
    res.status(400).json({ error: "El nombre es obligatorio." });
    return;
  }
  if (!precio || precio <= 0) {
    res.status(400).json({ error: "El precio debe ser mayor a 0." });
    return;
  }
  next();
};

//GET
app.get("/api/productos", function (req: Request, res: Response) {
  res.status(200).json({
    ok: true,
    mensaje: "Lista de Productos",
    total: listaPorductos.length,
    data: listaPorductos,
  });
});

//GET Buscar por ID
app.get("/api/productos/:id", function (req: Request, res: Response) {
  const idBuscando = Number(req.params.id);
  const prodEncontrado = listaPorductos.find((e) => e.id === idBuscando);
  if (!prodEncontrado) {
    return res.status(404).json({
      ok: false,
      mensaje: `El producto con el id ${idBuscando} no existe!!!`,
    });
  }
  res.status(200).json({
    ok: true,
    data: prodEncontrado,
  });
});

app.post(
  "/api/productos",
  validarProducto,
  function (req: Request, res: Response) {
    const { nombre, precio, stock } = req.body;

    let nuevoProd: Producto = {
      id: listaPorductos.length + 1,
      nombre,
      precio,
      stock,
      activo: true,
    };
    listaPorductos.push(nuevoProd);
    res.status(201).json({
      ok: true,
      mensaje: `El producto ${nombre} fue registrado con éxito!!`,
      data: nuevoProd,
    });
  },
);

app.put(
  "/api/productos/:id",
  validarProducto,
  function (req: Request, res: Response) {
    const idBuscando = Number(req.params.id);
    const prodModificado = listaPorductos.find((e) => e.id === idBuscando);
    const { nombre, precio, stock, activo } = req.body;
    if (!prodModificado) {
      return res.status(404).json({
        ok: false,
        mensaje: `El producto con el id ${idBuscando} no existe!!!`,
      });
    }
    prodModificado.nombre = nombre;
    prodModificado.precio = precio;
    prodModificado.stock = stock;
    prodModificado.activo = activo;
    res.status(200).json({
      ok: true,
      mensaje: `El producto: ${nombre} fue actualizado con éxito!!`,
      data: prodModificado,
    });
  },
);

//Hard delete
app.delete(
  "/api/productos/hard/:id",
  verifIcarRol("ADMIN"),
  function (req: Request, res: Response) {
    const idBuscando = Number(req.params.id);
    const prodEliminado = listaPorductos.findIndex((e) => e.id === idBuscando);
    if (prodEliminado === -1) {
      return res.status(404).json({
        ok: false,
        mensaje: `El producto con el id ${idBuscando} no existe!!!`,
      });
    }
    listaPorductos.splice(prodEliminado, 1);
    res.status(200).json({
      ok: true,
      mensaje: "El producto fue eliminado con éxito!!",
    });
  },
);

//Soft dekete
app.patch(
  "/api/productos/soft/:id",
  verifIcarRol("MODERADOR"),
  function (req: Request, res: Response) {
    const idBuscando = Number(req.params.id);
    const prodEncontrado = listaPorductos.find((e) => e.id === idBuscando);
    if (!prodEncontrado) {
      return res.status(404).json({
        ok: false,
        mensaje: `El producto con el id ${idBuscando} no existe!!!`,
      });
    }
    prodEncontrado.activo = false;
    res.status(200).json({
      ok: true,
      mensaje: `El producto ${prodEncontrado.nombre} fue desactivado`,
      data: prodEncontrado,
    });
  },
);

//Middleware de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err.message);
  res.status(500).json({ ok: false, error: "Error interno del servidor" });
});

app.listen(PORT, function () {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});
