const waitlistEndpoint = "";

const productLabels = {
  "concept-01": "Concept 01",
  "concept-02": "Concept 02",
  "concept-03": "Concept 03",
};

const waitlistForm = document.getElementById("waitlist-form");
const productCheckboxes = Array.from(
  document.querySelectorAll('input[name="products"]')
);
const allProductsCheckbox = document.getElementById("product-all");
const selectedCount = document.getElementById("selected-count");
const formStatus = document.getElementById("form-status");
const waitlistTitle = document.getElementById("waitlist-title");
const conceptCards = document.querySelectorAll(".concept-card");
const waitlistLinks = document.querySelectorAll(".waitlist-link");
const waitlistSection = document.getElementById("waitlist");
const conceptToggles = document.querySelectorAll("[data-toggle]");
const galleries = new Map();
let activeGalleryState = null;
let galleryHintHidden = false;

function updateTitle(product) {
  if (!waitlistTitle) {
    return;
  }
  waitlistTitle.textContent = "Stay Updated";
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
  if (product && product !== "all") {
    url.searchParams.set("product", product);
  } else {
    url.searchParams.delete("product");
  }
  history.replaceState({}, "", url);
}

function setSelectedProduct(product, options = {}) {
  const normalized = productLabels[product] ? product : "all";
  if (productCheckboxes.length) {
    if (normalized === "all") {
      if (allProductsCheckbox) {
        allProductsCheckbox.checked = true;
      }
      productCheckboxes.forEach((checkbox) => {
        if (checkbox !== allProductsCheckbox) {
          checkbox.checked = false;
        }
      });
    } else {
      if (allProductsCheckbox) {
        allProductsCheckbox.checked = false;
      }
      productCheckboxes.forEach((checkbox) => {
        checkbox.checked = checkbox.value === normalized;
      });
    }
  }
  updateTitle(normalized);
  highlightCard(normalized);
  if (options.updateUrl) {
    updateUrl(normalized);
  }
}

function updateSelectedCount() {
  if (!selectedCount || productCheckboxes.length === 0) {
    return;
  }
  const selected = productCheckboxes.filter(
    (checkbox) => checkbox !== allProductsCheckbox && checkbox.checked
  );
  if (selected.length === 0) {
    selectedCount.textContent = "";
    return;
  }
  selectedCount.textContent = `Selected: ${selected.length}`;
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

updateSelectedCount();

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

if (productCheckboxes.length) {
  productCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox === allProductsCheckbox && checkbox.checked) {
        productCheckboxes.forEach((item) => {
          if (item !== allProductsCheckbox) {
            item.checked = false;
          }
        });
      } else if (checkbox !== allProductsCheckbox) {
        if (checkbox.checked && allProductsCheckbox) {
          allProductsCheckbox.checked = false;
        }
        const anySelected = productCheckboxes.some(
          (item) => item !== allProductsCheckbox && item.checked
        );
        if (!anySelected && allProductsCheckbox) {
          allProductsCheckbox.checked = true;
        }
      }
      updateSelectedCount();
    });
  });
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = "";
    }

    const formData = new FormData(waitlistForm);
    const payload = {};
    formData.forEach((value, key) => {
      if (payload[key] === undefined) {
        payload[key] = value;
      } else if (Array.isArray(payload[key])) {
        payload[key].push(value);
      } else {
        payload[key] = [payload[key], value];
      }
    });

    if (!waitlistEndpoint) {
      if (formStatus) {
        formStatus.textContent =
          "Thanks! Add a waitlist endpoint in script.js to capture submissions.";
      }
      waitlistForm.reset();
      setSelectedProduct("all", { updateUrl: true });
      updateSelectedCount();
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
      setSelectedProduct("all", { updateUrl: true });
      updateSelectedCount();
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
  const thumbs = Array.from(gallery.querySelectorAll(".gallery-thumbs img"));
  let index = 0;

  function show(nextIndex) {
    if (!main || buttons.length === 0) {
      return;
    }
    index = (nextIndex + buttons.length) % buttons.length;
    const button = buttons[index];
    main.src = button.dataset.src;
    main.alt = button.dataset.alt || "Concept image";
    thumbs.forEach((thumb) => {
      if (thumb.dataset.src && thumb.src !== thumb.dataset.src) {
        thumb.src = thumb.dataset.src;
      }
    });
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

  if (main && !main.src && main.dataset.src) {
    main.src = main.dataset.src;
  }
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
    const hint = concept.querySelector(".concept-hint");
    if (hint) {
      hint.textContent = isOpen ? "Hide details" : "View details";
    }
    if (isOpen) {
      const gallery = concept.querySelector("[data-gallery]");
      const galleryState = galleries.get(gallery);
      if (galleryState) {
        galleryState.show(0);
      }
      activeGalleryState = galleryState || activeGalleryState;
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (!activeGalleryState) {
    return;
  }
  if (!galleryHintHidden) {
    document.querySelectorAll("[data-gallery-hint]").forEach((hint) => {
      hint.classList.add("is-hidden");
    });
    galleryHintHidden = true;
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
