// Inicializar carrito desde localStorage o como arreglo vacío
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Función para agregar producto al carrito (con cantidad)
function agregarAlCarrito(id_producto, nombre, precio) {
  const index = carrito.findIndex(item => item.id_producto === id_producto);

  if (index !== -1) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({ id_producto, nombre, precio, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  alert(`${nombre} agregado al carrito`);
}

// Mostrar el carrito en carrito.html
function mostrarCarrito() {
  const contenedor = document.getElementById("contenedor-carrito");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  let total = 0;

  carrito.forEach((producto, index) => {
    const item = document.createElement("div");
    item.classList.add("item");

    const subtotal = producto.precio * producto.cantidad;
    total += subtotal;

    item.innerHTML = `
      <div class="info">
        <h2>${producto.nombre}</h2>
        <p>Cantidad: ${producto.cantidad}</p>
        <span class="precio">Subtotal: $${subtotal.toFixed(2)}</span>
      </div>
      <div class="acciones">
        <button class="eliminar" onclick="eliminarProducto(${index})">Eliminar</button>
      </div>
    `;

    contenedor.appendChild(item);
  });

  const totalElemento = document.getElementById("total");
  if (totalElemento) {
    totalElemento.textContent = `$${total.toFixed(2)}`;
  }
}

// Eliminar un producto completamente del carrito
function eliminarProducto(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarCarrito();
}

// Vaciar todo el carrito
function vaciarCarrito() {
  carrito = [];
  localStorage.removeItem("carrito");
  mostrarCarrito();
}

// Confirmar la compra y redirigir a validar pago
function confirmarCompra() {
  const direccion = prompt("Ingresa tu dirección de envío:");
  if (!direccion) return alert("Dirección requerida para continuar.");

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id_usuario) {
    return alert("Debes iniciar sesión para realizar una compra.");
  }

  fetch('http://localhost:3000/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carrito,
      direccion_envio: direccion,
      id_usuario: usuario.id_usuario
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.id_pedido) {
      localStorage.setItem('ultimoPedido', data.id_pedido);
      alert(data.mensaje || '¡Compra completada!');
      vaciarCarrito();
      window.location.href = "validar_pago.html";
    } else {
      alert("Error: No se recibió el ID del pedido.");
    }
  })
  .catch(err => {
    console.error('Error en la venta:', err);
    alert('Error al procesar la venta.');
  });
}

// Mostrar automáticamente si estamos en carrito.html
if (window.location.pathname.includes("carrito.html")) {
  mostrarCarrito();
}
