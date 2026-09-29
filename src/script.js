const menuButton = document.querySelector(".site-header__toggle");
const navigation = document.querySelector(".site-header__navigation");
const cart = document.querySelector("shopping-cart");

menuButton.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isExpanded));
  menuButton.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
  navigation.classList.toggle("site-header__navigation--open", !isExpanded);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("site-header__navigation--open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
  }

  if (event.target.closest("shopping-cart")) {
    navigation.classList.remove("site-header__navigation--open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
  }
});

document.querySelectorAll("[data-product-id]").forEach((button) => {
  button.addEventListener("click", () => {
    cart.addItem(button.dataset.productId);
  });
});