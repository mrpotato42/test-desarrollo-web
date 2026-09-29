const carouselProducts = [
  {
    id: "astronauta",
    name: "Astronauta mármol",
    detail: "Para llevar la calma al espacio",
    image: "../public/amongus.png",
    alt: "Juguete sensorial con forma de astronauta en tonos azules y negros",
  },
  {
    id: "redondo",
    name: "Redondo arcoíris",
    detail: "Un arcoíris en la palma de tu mano",
    image: "../public/round.png",
    alt: "Juguete sensorial redondo con franjas de colores",
  },
  {
    id: "cuadrado",
    name: "Cuadrado arcoíris",
    detail: "El clásico de todos los días",
    image: "../public/square.png",
    alt: "Juguete sensorial cuadrado con franjas de colores",
  },
];

class ProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.currentPage = 0;
    this.onClick = this.onClick.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  connectedCallback() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.innerHTML = `
      <div class="product-carousel__toolbar">
        <div class="product-carousel__arrows" aria-label="Controles del carrusel">
          <button class="product-carousel__arrow" type="button" data-carousel-action="previous" aria-label="Productos anteriores">
            <span aria-hidden="true">‹</span>
          </button>
          <button class="product-carousel__arrow" type="button" data-carousel-action="next" aria-label="Productos siguientes">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <ul class="product-carousel__track" tabindex="0" aria-label="Lista de productos"></ul>
      <div class="product-carousel__pagination" aria-label="Páginas del carrusel"></div>
    `;

    this.track = this.querySelector(".product-carousel__track");
    this.pagination = this.querySelector(".product-carousel__pagination");
    this.previousButton = this.querySelector('[data-carousel-action="previous"]');
    this.nextButton = this.querySelector('[data-carousel-action="next"]');

    this.renderProducts();
    this.addEventListener("click", this.onClick);
    this.track.addEventListener("scroll", this.onScroll, { passive: true });

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(this.track);
    } else {
      window.addEventListener("resize", this.onResize);
    }

    this.refresh();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.onResize);
    this.track?.removeEventListener("scroll", this.onScroll);
    this.removeEventListener("click", this.onClick);
  }

  renderProducts() {
    const slides = carouselProducts.map((product, index) => {
      const slide = document.createElement("li");
      slide.className = "product-carousel__slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "producto");
      slide.setAttribute("aria-label", `${index + 1} de ${carouselProducts.length}`);

      const article = document.createElement("article");
      article.className = "product-carousel__card";

      const imageWrap = document.createElement("div");
      imageWrap.className = "product-carousel__image-wrap";

      const image = document.createElement("img");
      image.className = "product-carousel__image";
      if (product.imageClass) {
        image.classList.add(product.imageClass);
      }
      image.src = product.image;
      image.alt = product.alt;
      image.loading = "lazy";
      imageWrap.append(image);

      const name = document.createElement("h3");
      name.className = "product-carousel__name";
      name.textContent = product.name;

      const detail = document.createElement("p");
      detail.className = "product-carousel__detail";
      detail.textContent = product.detail;

      const addButton = document.createElement("button");
      addButton.className = "product-carousel__button";
      addButton.type = "button";
      addButton.dataset.productId = product.id;
      addButton.textContent = "Añadir";

      article.append(imageWrap, name, detail, addButton);
      slide.append(article);
      return slide;
    });

    this.track.replaceChildren(...slides);
  }

  refresh() {
    const firstSlide = this.track.firstElementChild;
    if (!firstSlide) {
      return;
    }

    const slideWidth = firstSlide.getBoundingClientRect().width;
    this.visibleCount = Math.max(1, Math.round(this.track.clientWidth / slideWidth));
    const pageCount = Math.ceil(carouselProducts.length / this.visibleCount);
    this.pageStarts = Array.from({ length: pageCount }, (_, page) => (
      page === pageCount - 1
        ? Math.max(0, carouselProducts.length - this.visibleCount)
        : page * this.visibleCount
    ));
    this.currentPage = Math.min(this.currentPage, pageCount - 1);
    this.pageOffsets = this.pageStarts.map((startIndex) => {
      const slide = this.track.children[startIndex];
      return this.track.scrollLeft
        + slide.getBoundingClientRect().left
        - this.track.getBoundingClientRect().left;
    });
    this.renderPagination();
    this.goToPage(this.currentPage, false);
  }

  renderPagination() {
    const buttons = this.pageStarts.map((startIndex, pageIndex) => {
      const button = document.createElement("button");
      button.className = "product-carousel__dot";
      button.type = "button";
      button.dataset.carouselPage = String(pageIndex);
      button.setAttribute(
        "aria-label",
        `Mostrar productos ${startIndex + 1} a ${Math.min(startIndex + this.visibleCount, carouselProducts.length)}`,
      );
      return button;
    });

    this.pagination.replaceChildren(...buttons);
    this.updateControls();
  }

  goToPage(page, smooth = true) {
    this.currentPage = Math.max(0, Math.min(page, this.pageStarts.length - 1));
    const slide = this.track.children[this.pageStarts[this.currentPage]];
    const left = this.track.scrollLeft
      + slide.getBoundingClientRect().left
      - this.track.getBoundingClientRect().left;

    this.track.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    this.updateControls();
  }

  updateControls() {
    this.previousButton.disabled = this.currentPage === 0;
    this.nextButton.disabled = this.currentPage === this.pageStarts.length - 1;

    this.pagination.querySelectorAll(".product-carousel__dot").forEach((button, index) => {
      const isCurrent = index === this.currentPage;
      button.classList.toggle("product-carousel__dot--current", isCurrent);
      if (isCurrent) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

  }

  onClick(event) {
    const actionButton = event.target.closest("[data-carousel-action]");
    if (actionButton?.dataset.carouselAction === "previous") {
      this.goToPage(this.currentPage - 1);
      return;
    }

    if (actionButton?.dataset.carouselAction === "next") {
      this.goToPage(this.currentPage + 1);
      return;
    }

    const pageButton = event.target.closest("[data-carousel-page]");
    if (pageButton) {
      this.goToPage(Number(pageButton.dataset.carouselPage));
    }
  }

  onScroll() {
    window.clearTimeout(this.scrollTimeout);
    this.scrollTimeout = window.setTimeout(() => {
      const nearestPage = this.pageOffsets
        .map((offset, index) => ({ index, distance: Math.abs(this.track.scrollLeft - offset) }))
        .sort((first, second) => first.distance - second.distance)[0];

      if (nearestPage && nearestPage.index !== this.currentPage) {
        this.currentPage = nearestPage.index;
        this.updateControls();
      }
    }, 80);
  }

  onResize() {
    this.currentPage = 0;
    this.refresh();
  }
}

customElements.define("product-carousel", ProductCarousel);