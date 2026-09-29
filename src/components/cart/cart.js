const cartProducts = {
  helado: {
    name: "Paleta arcoíris",
    image: "../public/background.png",
    alt: "Juguete sensorial con forma de paleta y colores del arcoíris",
  },
  cuadrado: {
    name: "Cuadrado arcoíris",
    image: "../public/square.png",
    alt: "Juguete sensorial cuadrado con franjas de colores",
  },
  astronauta: {
    name: "Astronauta mármol",
    image: "../public/amongus.png",
    alt: "Juguete sensorial con forma de astronauta en tonos azules y negros",
  },
  redondo: {
    name: "Redondo arcoíris",
    image: "../public/round.png",
    alt: "Juguete sensorial redondo con franjas de colores",
  },
};

const cartStorageKey = "popit-cart-v1";

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.onClick = this.onClick.bind(this);
    this.onDialogClick = this.onDialogClick.bind(this);
  }

  connectedCallback() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.innerHTML = `
      <button class="cart__trigger" type="button" aria-haspopup="dialog" aria-label="Abrir carrito, 0 productos">
        Carrito <span class="cart__count" aria-live="polite">0</span>
      </button>
      <dialog class="cart__dialog" aria-labelledby="cart-title">
        <div class="cart__panel">
          <header class="cart__header">
            <div>
              <p class="cart__eyebrow">Tu selección</p>
              <h2 class="cart__title" id="cart-title">Mi carrito</h2>
            </div>
            <button class="cart__close" type="button" data-cart-close aria-label="Cerrar carrito">×</button>
          </header>
          <p class="cart__status" role="status" aria-live="polite"></p>
          <p class="cart__empty">Tu carrito está vacío. Añade un producto para verlo aquí.</p>
          <ul class="cart__items" aria-label="Productos en el carrito"></ul>
          <footer class="cart__footer">
            <p class="cart__summary"></p>
            <button class="cart__clear" type="button" data-cart-clear>Vaciar carrito</button>
          </footer>
        </div>
      </dialog>
    `;

    this.trigger = this.querySelector(".cart__trigger");
    this.dialog = this.querySelector(".cart__dialog");
    this.itemsList = this.querySelector(".cart__items");
    this.emptyMessage = this.querySelector(".cart__empty");
    this.countLabel = this.querySelector(".cart__count");
    this.summary = this.querySelector(".cart__summary");
    this.status = this.querySelector(".cart__status");
    this.clearButton = this.querySelector(".cart__clear");

    // El diálogo se mueve al <body> para que no dependa de la visibilidad del menú móvil.
    document.body.append(this.dialog);

    this.items = this.loadItems();
    this.addEventListener("click", this.onClick);
    this.dialog.addEventListener("click", this.onClick);
    this.dialog.addEventListener("click", this.onDialogClick);
    this.render();
  }

  addItem(productId) {
    const product = cartProducts[productId];
    if (!product) {
      return;
    }

    const existingItem = this.items.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + 1, 99);
    } else {
      this.items.push({ id: productId, quantity: 1 });
    }

    this.saveItems();
    this.render();
    this.dialog.showModal();
    this.status.textContent = `${product.name} añadido al carrito.`;
  }

  loadItems() {
    try {
      const storedItems = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
      if (!Array.isArray(storedItems)) {
        return [];
      }

      return storedItems
        .filter((item) => cartProducts[item.id] && Number.isInteger(item.quantity) && item.quantity > 0)
        .map((item) => ({ id: item.id, quantity: Math.min(item.quantity, 99) }));
    } catch {
      return [];
    }
  }

  saveItems() {
    try {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(this.items));
    } catch {
      this.status.textContent = "No se pudo guardar el carrito en este navegador.";
    }
  }

  render() {
    const itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
    const productCount = this.items.length;
    this.countLabel.textContent = String(itemCount);
    this.trigger.setAttribute(
      "aria-label",
      `Abrir carrito, ${itemCount} ${itemCount === 1 ? "producto" : "productos"}`,
    );
    this.emptyMessage.hidden = productCount > 0;
    this.itemsList.hidden = productCount === 0;
    this.summary.textContent = productCount
      ? `${productCount} ${productCount === 1 ? "artículo" : "artículos"} | ${itemCount} ${itemCount === 1 ? "unidad" : "unidades"}`
      : "";

    const itemElements = this.items.map((item) => this.createItemElement(item));
    this.itemsList.replaceChildren(...itemElements);
    this.clearButton.disabled = productCount === 0;
  }

  createItemElement(item) {
    const product = cartProducts[item.id];
    const listItem = document.createElement("li");
    listItem.className = "cart__item";

    const image = document.createElement("img");
    image.className = "cart__item-image";
    image.src = product.image;
    image.alt = product.alt;
    image.loading = "lazy";

    const details = document.createElement("div");
    details.className = "cart__item-details";

    const name = document.createElement("h3");
    name.className = "cart__item-name";
    name.textContent = product.name;

    const controls = document.createElement("div");
    controls.className = "cart__item-controls";

    const decreaseButton = this.createControlButton("-", "decrease", item.id, "Disminuir cantidad");
    decreaseButton.disabled = item.quantity === 1;

    const quantity = document.createElement("span");
    quantity.className = "cart__item-quantity";
    quantity.textContent = String(item.quantity);
    quantity.setAttribute("aria-label", `Cantidad: ${item.quantity}`);

    const increaseButton = this.createControlButton("+", "increase", item.id, "Aumentar cantidad");
    increaseButton.disabled = item.quantity === 99;

    const removeButton = this.createControlButton("Quitar", "remove", item.id, `Quitar ${product.name}`);
    removeButton.classList.add("cart__item-remove");

    controls.append(decreaseButton, quantity, increaseButton, removeButton);
    details.append(name, controls);
    listItem.append(image, details);
    return listItem;
  }

  createControlButton(label, action, productId, accessibleName) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cart__control";
    button.dataset.cartAction = action;
    button.dataset.productId = productId;
    button.textContent = label;
    button.setAttribute("aria-label", accessibleName);
    return button;
  }

  onClick(event) {
    if (event.target.closest(".cart__trigger")) {
      this.dialog.showModal();
      return;
    }

    if (event.target.closest("[data-cart-close]")) {
      this.dialog.close();
      return;
    }

    if (event.target.closest("[data-cart-clear]")) {
      this.items = [];
      this.updateAfterChange("Carrito vacío.");
      return;
    }

    const control = event.target.closest("[data-cart-action]");
    if (!control) {
      return;
    }

    const item = this.items.find((cartItem) => cartItem.id === control.dataset.productId);
    if (!item) {
      return;
    }

    if (control.dataset.cartAction === "increase") {
      item.quantity = Math.min(item.quantity + 1, 99);
    } else if (control.dataset.cartAction === "decrease") {
      item.quantity = Math.max(item.quantity - 1, 1);
    } else if (control.dataset.cartAction === "remove") {
      this.items = this.items.filter((cartItem) => cartItem.id !== item.id);
    }

    this.updateAfterChange("Carrito actualizado.");
  }

  onDialogClick(event) {
    if (event.target === this.dialog) {
      this.dialog.close();
    }
  }

  updateAfterChange(message) {
    this.saveItems();
    this.render();
    this.status.textContent = message;
  }
}

customElements.define("shopping-cart", ShoppingCart);