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
const lightbox = document.getElementById("lightbox");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxButtons = document.querySelectorAll("[data-lightbox-index]");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxSlides = Array.from(lightboxButtons).map((button) => {
  const img = button.querySelector("img");
  return {
    src: button.dataset.lightboxSrc || img?.src || "",
    alt: img?.alt || "Concept image",
  };
});
let lightboxIndex = 0;

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

function showLightboxIndex(index) {
  if (!lightboxImage || lightboxSlides.length === 0) {
    return;
  }
  const clamped = Math.max(0, Math.min(index, lightboxSlides.length - 1));
  lightboxIndex = clamped;
  const target = lightboxSlides[clamped];
  if (!target || !target.src) {
    return;
  }
  lightboxImage.src = target.src;
  lightboxImage.alt = target.alt;
}

function openLightbox(index) {
  if (!lightbox || !lightboxImage) {
    return;
  }
  lightbox.classList.add("is-active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");

  requestAnimationFrame(() => {
    showLightboxIndex(index);
    if (lightboxClose) {
      lightboxClose.focus();
    }
  });
}

function closeLightbox() {
  if (!lightbox) {
    return;
  }
  lightbox.classList.remove("is-active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-lightbox-open");
}

lightboxButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.lightboxIndex || 0);
    openLightbox(index);
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("is-active")) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showLightboxIndex(lightboxIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showLightboxIndex(lightboxIndex - 1);
  }
});
