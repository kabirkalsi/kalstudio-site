const waitlistEndpoint = "";

const productLabels = {
  "concept-01": "Concept 01",
  "concept-02": "Concept 02",
  "concept-03": "Concept 03",
};

const waitlistForm = document.getElementById("waitlist-form");
const productSelect = document.getElementById("product-select");
const formStatus = document.getElementById("form-status");
const waitlistTitle = document.getElementById("waitlist-title");
const conceptCards = document.querySelectorAll(".concept-card");
const waitlistLinks = document.querySelectorAll(".waitlist-link");
const waitlistSection = document.getElementById("waitlist");
const conceptToggles = document.querySelectorAll("[data-toggle]");
const galleries = new Map();
let activeGalleryState = null;

function updateTitle(product) {
  if (!waitlistTitle) {
    return;
  }
  if (product && product !== "general" && productLabels[product]) {
    waitlistTitle.textContent = `Waitlist - ${productLabels[product]}`;
    return;
  }
  waitlistTitle.textContent = "Waitlist";
}

function highlightCard(product) {
  conceptCards.forEach((card) => {
    if (card.dataset.product === product) {
      card.classList.add("is-selected");
    } else {
      card.classList.remove("is-selected");
    }
  });
}

function updateUrl(product) {
  const url = new URL(window.location.href);
  if (product && product !== "general") {
    url.searchParams.set("product", product);
  } else {
    url.searchParams.delete("product");
  }
  history.replaceState({}, "", url);
}

function setSelectedProduct(product, options = {}) {
  const normalized = productLabels[product] ? product : "general";
  if (productSelect) {
    productSelect.value = normalized;
  }
  updateTitle(normalized);
  highlightCard(normalized);
  if (options.updateUrl) {
    updateUrl(normalized);
  }
}

const params = new URLSearchParams(window.location.search);
const initialProduct = params.get("product");

if (initialProduct) {
  setSelectedProduct(initialProduct);
  if (!window.location.hash && waitlistSection) {
    requestAnimationFrame(() => {
      waitlistSection.scrollIntoView({ behavior: "smooth" });
    });
  }
}

waitlistLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const product = link.dataset.productLink;
    setSelectedProduct(product, { updateUrl: true });
    if (waitlistSection) {
      const url = new URL(window.location.href);
      url.hash = "waitlist";
      history.replaceState({}, "", url);
      waitlistSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});

if (productSelect) {
  productSelect.addEventListener("change", () => {
    setSelectedProduct(productSelect.value, { updateUrl: true });
  });
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = "";
    }

    const formData = new FormData(waitlistForm);
    const payload = Object.fromEntries(formData.entries());

    if (!waitlistEndpoint) {
      if (formStatus) {
        formStatus.textContent =
          "Thanks! Add a waitlist endpoint in script.js to capture submissions.";
      }
      waitlistForm.reset();
      setSelectedProduct("general", { updateUrl: true });
      return;
    }

    try {
      if (formStatus) {
        formStatus.textContent = "Submitting...";
      }
      const response = await fetch(waitlistEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      if (formStatus) {
        formStatus.textContent = "You are on the list.";
      }
      waitlistForm.reset();
      setSelectedProduct("general", { updateUrl: true });
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = "Something went wrong. Please try again.";
      }
    }
  });
}

function setupGallery(gallery) {
  const main = gallery.querySelector(".gallery-main");
  const buttons = Array.from(gallery.querySelectorAll("[data-src]"));
  let index = 0;

  function show(nextIndex) {
    if (!main || buttons.length === 0) {
      return;
    }
    index = (nextIndex + buttons.length) % buttons.length;
    const button = buttons[index];
    main.src = button.dataset.src;
    main.alt = button.dataset.alt || "Concept image";
    buttons.forEach((item, i) => {
      item.classList.toggle("is-active", i === index);
    });
  }

  const state = {
    show,
    next() {
      show(index + 1);
    },
    prev() {
      show(index - 1);
    },
  };

  buttons.forEach((button, i) => {
    button.addEventListener("click", () => {
      activeGalleryState = state;
      show(i);
    });
  });

  gallery.addEventListener("click", (event) => {
    const control = event.target.closest("[data-dir]");
    if (!control) {
      return;
    }
    activeGalleryState = state;
    control.dataset.dir === "next" ? state.next() : state.prev();
  });

  gallery.addEventListener("mouseenter", () => {
    activeGalleryState = state;
  });

  show(0);
  galleries.set(gallery, state);
}

document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  setupGallery(gallery);
});

conceptToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.dataset.toggle;
    const concept = document.getElementById(targetId);
    if (!concept) {
      return;
    }
    const isOpen = concept.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      const gallery = concept.querySelector("[data-gallery]");
      activeGalleryState = galleries.get(gallery) || activeGalleryState;
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (!activeGalleryState) {
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    activeGalleryState.next();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    activeGalleryState.prev();
  }
});
