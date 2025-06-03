// === Estado de autenticación ===
auth.onAuthStateChanged(user => {
  const info = document.getElementById("user-info");
  info.textContent = user ? "Usuario: " + user.email : "No autenticado";
});

// === Notificación estilizada ===
function mostrarMensaje(texto, tipo = "info", duracion = 4000) {
  const colores = {
    info: "#6c63ff",
    success: "#28a745",
    error: "#dc3545"
  };

  let contenedor = document.getElementById("notificacion-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "notificacion-container";
    document.body.appendChild(contenedor);
  }

  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.background = colores[tipo];
  msg.style.color = "#fff";
  msg.style.padding = "10px 20px";
  msg.style.marginTop = "10px";
  msg.style.borderRadius = "8px";
  msg.style.fontWeight = "bold";
  msg.style.textAlign = "center";
  msg.style.fontSize = "16px";
  msg.style.animation = "slideFade 0.4s ease";
  contenedor.appendChild(msg);

  setTimeout(() => msg.remove(), duracion);
}

// === Generador de ID cliente único ===
function generarIDCliente() {
  return 'CLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// === Antispam ===
function throttleAction(callback, delay = 5000) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= delay) {
      lastRun = now;
      callback.apply(this, args);
    } else {
      mostrarMensaje("Espera unos segundos antes de volver a intentarlo.", "info");
    }
  };
}

// === Registro/Login/Logout ===
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => mostrarMensaje("Registro exitoso", "success"))
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById("user-info").textContent = "Usuario: " + user.user.email;
      mostrarMensaje("Sesión iniciada", "success");
    })
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("user-info").textContent = "Sesión cerrada";
    mostrarMensaje("Has cerrado sesión", "info");
  });
}

function recuperarContrasena() {
  const email = document.getElementById("email").value.trim();
  if (!email) return mostrarMensaje("Ingresa tu correo para recuperar contraseña.", "error");
  auth.sendPasswordResetEmail(email)
    .then(() => mostrarMensaje("Revisa tu correo para restablecer tu contraseña.", "success"))
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

// === Registrar Cliente con validación de ID único ===
async function registrarCliente() {
  const nombre = document.getElementById("cliente-nombre").value.trim();
  const contacto = document.getElementById("cliente-contacto").value.trim();
  const direccion = document.getElementById("cliente-direccion").value.trim();
  const observaciones = document.getElementById("cliente-obs").value.trim();
  const idInput = document.getElementById("cliente-id");

  if (!nombre || !contacto) {
    return mostrarMensaje("Faltan campos obligatorios (nombre, contacto)", "error");
  }

  let clienteId = idInput.value.trim();

  if (!clienteId) {
    const confirmar = confirm("No ingresaste un ID de cliente. ¿Deseas generar uno automáticamente?");
    if (!confirmar) {
      return mostrarMensaje("Ingresa un ID cliente antes de continuar.", "error");
    }

    let intentos = 0;
    let idUnico = false;

    while (!idUnico && intentos < 5) {
      clienteId = generarIDCliente();
      const doc = await db.collection("clientes").doc(clienteId).get();
      if (!doc.exists) {
        idUnico = true;
      } else {
        intentos++;
      }
    }

    if (!idUnico) {
      return mostrarMensaje("No se pudo generar un ID único. Intenta nuevamente.", "error");
    }

    idInput.value = clienteId;
    try {
      await navigator.clipboard.writeText(clienteId);
      mostrarMensaje(`ID generado: ${clienteId} (copiado al portapapeles)`, "info", 10000);
    } catch {
      mostrarMensaje(`ID generado: ${clienteId}. No se pudo copiar automáticamente.`, "info", 10000);
    }
  }

  db.collection("clientes").doc(clienteId).set({
    clienteId,
    nombre,
    contacto,
    direccion,
    observaciones,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    mostrarMensaje("Cliente registrado", "success");
    ["cliente-id", "cliente-nombre", "cliente-contacto", "cliente-direccion", "cliente-obs"].forEach(id => {
      document.getElementById(id).value = "";
    });
  }).catch(err => mostrarMensaje("Error al guardar cliente: " + err.message, "error"));
}

// === Registrar Venta con validación de ID cliente existente ===
async function registrarVenta() {
  const clienteId = document.getElementById("venta-cliente").value.trim();
  const productos = document.getElementById("venta-productos").value.trim();
  const monto = parseFloat(document.getElementById("venta-monto").value);
  const fecha = document.getElementById("venta-fecha").value;
  const medioPago = document.getElementById("venta-medio").value.trim();

  if (!clienteId || !productos || isNaN(monto) || !fecha || !medioPago) {
    return mostrarMensaje("Completa todos los campos de venta.", "error");
  }

  try {
    const clienteDoc = await db.collection("clientes").doc(clienteId).get();
    if (!clienteDoc.exists) {
      return mostrarMensaje("El ID Cliente no existe en la base de datos.", "error");
    }

    await db.collection("ventas").add({
      clienteId,
      productos,
      monto,
      fecha,
      medioPago,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    mostrarMensaje("Venta registrada", "success");

    ["venta-cliente", "venta-productos", "venta-monto", "venta-fecha", "venta-medio"].forEach(id => {
      document.getElementById(id).value = "";
    });

  } catch (error) {
    mostrarMensaje("Error al guardar venta: " + error.message, "error");
  }
}

// === Generar Reporte Visual ===
async function generarReporte() {
  const ventasSnapshot = await db.collection("ventas").orderBy("timestamp", "desc").get();
  const clientesSnapshot = await db.collection("clientes").get();

  const clientesMap = {};
  clientesSnapshot.forEach(doc => clientesMap[doc.id] = doc.data());

  let total = 0;
  let texto = "HISTORIAL DE VENTAS\n\n";
  ventasSnapshot.forEach(doc => {
    const venta = doc.data();
    const cliente = clientesMap[venta.clienteId];
    total += venta.monto;

    texto += `ID Cliente: ${venta.clienteId}\n`;
    if (cliente) {
      texto += `Nombre: ${cliente.nombre}\nContacto: ${cliente.contacto}\nDirección: ${cliente.direccion}\n`;
    } else {
      texto += `Nombre: NO REGISTRADO\nContacto: -\nDirección: -\n`;
    }
    texto += `Producto: ${venta.productos}\nMonto: $${venta.monto.toLocaleString("es-CL")}\nFecha: ${venta.fecha}\n\n`;
  });
  texto += `TOTAL VENDIDO: $${total.toLocaleString("es-CL")}`;
  document.getElementById("reporte-output").textContent = texto;
}

// === Descargar PDF limpio ===
async function descargarPDF() {
  try {
    const ventasSnapshot = await db.collection("ventas").orderBy("timestamp", "desc").get();
    const clientesSnapshot = await db.collection("clientes").get();

    const clientesMap = {};
    clientesSnapshot.forEach(doc => clientesMap[doc.id] = doc.data());

    let total = 0;
    let texto = "HISTORIAL DE VENTAS\n\n";
    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      const cliente = clientesMap[venta.clienteId];
      total += venta.monto;

      texto += `ID Cliente: ${venta.clienteId}\n`;
      if (cliente) {
        texto += `Nombre: ${cliente.nombre}\nContacto: ${cliente.contacto}\nDirección: ${cliente.direccion}\n`;
      } else {
        texto += `Nombre: NO REGISTRADO\nContacto: -\nDirección: -\n`;
      }
      texto += `Producto: ${venta.productos}\nMonto: $${venta.monto.toLocaleString("es-CL")}\nFecha: ${venta.fecha}\n\n`;
    });

    texto += `TOTAL VENDIDO: $${total.toLocaleString("es-CL")}`;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(12);
    doc.text(texto, 10, 20);
    doc.save("reporte_ventas.pdf");
  } catch (err) {
    console.error("Error al generar PDF:", err);
    mostrarMensaje("No se pudo generar el PDF", "error");
  }
}

// === Funciones protegidas ===
const registroSeguro = throttleAction(register, 5000);
const loginSeguro = throttleAction(login, 5000);
const registrarClienteSeguro = throttleAction(registrarCliente, 4000);
const registrarVentaSeguro = throttleAction(registrarVenta, 4000);
const generarReporteSeguro = throttleAction(generarReporte, 4000);
const descargarPDFSeguro = throttleAction(descargarPDF, 4000);
