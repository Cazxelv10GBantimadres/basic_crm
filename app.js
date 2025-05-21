// === Estado de autenticación ===
auth.onAuthStateChanged(user => {
  const info = document.getElementById("user-info");
  info.textContent = user ? "Usuario: " + user.email : "No autenticado";
});

// === Notificaciones popup ===
function mostrarMensaje(texto, tipo = "info") {
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
  setTimeout(() => msg.remove(), 4000);
}

// === Función antispam ===
function throttleAction(callback, delay = 5000) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= delay) {
      lastRun = now;
      callback.apply(this, args);
    } else {
      mostrarMensaje("⚠️ Espera unos segundos antes de volver a intentarlo.", "info");
    }
  };
}

// === Registro/Login/Logout ===
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => mostrarMensaje("✅ Registro exitoso", "success"))
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById("user-info").textContent = "Usuario: " + user.user.email;
      mostrarMensaje("✅ Sesión iniciada", "success");
    })
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("user-info").textContent = "Sesión cerrada";
    mostrarMensaje("🔒 Has cerrado sesión", "info");
  });
}

function recuperarContrasena() {
  const email = document.getElementById("email").value.trim();
  if (!email) return mostrarMensaje("Ingresa tu correo para recuperar contraseña.", "error");

  auth.sendPasswordResetEmail(email)
    .then(() => mostrarMensaje("📧 Revisa tu correo para restablecer tu contraseña.", "success"))
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

// === Cliente ===
function registrarCliente() {
  const nombre = document.getElementById("cliente-nombre").value.trim();
  const contacto = document.getElementById("cliente-contacto").value.trim();
  const direccion = document.getElementById("cliente-direccion").value.trim();
  const observaciones = document.getElementById("cliente-obs").value.trim();

  if (!nombre || !contacto)
    return mostrarMensaje("Faltan campos obligatorios (nombre, contacto)", "error");

  db.collection("clientes").add({
    nombre, contacto, direccion, observaciones,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    mostrarMensaje("✅ Cliente registrado", "success");
    ["cliente-nombre", "cliente-contacto", "cliente-direccion", "cliente-obs"].forEach(id => document.getElementById(id).value = "");
  }).catch(err => mostrarMensaje("Error al guardar cliente: " + err.message, "error"));
}

// === Venta ===
function registrarVenta() {
  const clienteId = document.getElementById("venta-cliente").value.trim();
  const productos = document.getElementById("venta-productos").value.trim();
  const monto = parseFloat(document.getElementById("venta-monto").value);
  const fecha = document.getElementById("venta-fecha").value;
  const medioPago = document.getElementById("venta-medio").value.trim();

  if (!clienteId || !productos || isNaN(monto) || !fecha || !medioPago)
    return mostrarMensaje("Completa todos los campos de venta.", "error");

  db.collection("ventas").add({
    clienteId, productos, monto, fecha, medioPago,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    mostrarMensaje("✅ Venta registrada", "success");
    ["venta-cliente", "venta-productos", "venta-monto", "venta-fecha", "venta-medio"].forEach(id => document.getElementById(id).value = "");
  }).catch(err => {
    console.error("Error al registrar venta:", err);
    mostrarMensaje("Error al guardar venta: " + err.message, "error");
  });
}

// === Reporte visual ===
function generarReporte() {
  db.collection("ventas").orderBy("timestamp", "desc").get().then(snapshot => {
    let total = 0;
    let texto = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.monto;
      texto += `Cliente: ${data.clienteId} | Monto: $${data.monto} | Fecha: ${data.fecha}\n`;
    });
    texto += `\n🧾 TOTAL VENDIDO: $${total.toFixed(2)}`;
    document.getElementById("reporte-output").textContent = texto;
  }).catch(err => {
    mostrarMensaje("Error al generar reporte: " + err.message, "error");
  });
}

// === Descargar PDF directamente ===
async function descargarPDF() {
  const snapshot = await db.collection("ventas").orderBy("timestamp", "desc").get();
  let total = 0;
  let texto = "📦 Historial de Ventas:\n\n";
  snapshot.forEach(doc => {
    const d = doc.data();
    total += d.monto;
    texto += `Cliente: ${d.clienteId}\nProducto: ${d.productos}\nMonto: $${d.monto}\nFecha: ${d.fecha}\n\n`;
  });
  texto += `\nTOTAL VENDIDO: $${total.toFixed(2)}`;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text(texto, 10, 30); // <- Aumentamos margen Y
  doc.save("reporte_ventas.pdf");
}

// === Versiones antispam ===
const registroSeguro = throttleAction(register, 5000);
const loginSeguro = throttleAction(login, 5000);
const registrarClienteSeguro = throttleAction(registrarCliente, 4000);
const registrarVentaSeguro = throttleAction(registrarVenta, 4000);
const generarReporteSeguro = throttleAction(generarReporte, 4000);
const descargarPDFSeguro = throttleAction(descargarPDF, 3000);
