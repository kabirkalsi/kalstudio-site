const waitlistEndpoint =
  "https://script.google.com/macros/s/AKfycbxOSZSKtpuNjGBv6cwxPQVlud6rKh5YY_RqeoCjCUebKK1DAxhqrtqlJgGGcR21Qn1L/exec";
const waitlistEndpointMode = "no-cors";

const waitlistForm = document.getElementById("waitlist-form");
const formStatus = document.getElementById("form-status");
const waitlistTitle = document.getElementById("waitlist-title");
const conceptCards = document.querySelectorAll(".concept-card");
const waitlistLinks = document.querySelectorAll(".waitlist-link");
const waitlistSection = document.getElementById("waitlist");
const conceptToggles = document.querySelectorAll("[data-toggle]");
const conceptRows = document.querySelectorAll(".concept-row");
const galleries = new Map();
let activeGalleryState = null;
let galleryHintHidden = false;

function resetWaitlistForm() {
  if (!waitlistForm) {
    return;
  }
  waitlistForm.reset();
}

waitlistLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});

if (waitlistTitle) {
  waitlistTitle.textContent = "Stay Updated";
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = "";
    }

    const formData = new FormData(waitlistForm);
    const successMessage = "Thank you! You're on the list.";

    if (!waitlistEndpoint) {
      if (formStatus) {
        formStatus.textContent = successMessage;
      }
      resetWaitlistForm();
      return;
    }

    try {
      if (formStatus) {
        formStatus.textContent = successMessage;
      }
      resetWaitlistForm();
      const response = await fetch(waitlistEndpoint, {
        method: "POST",
        mode: waitlistEndpointMode,
        body: formData,
      });

      if (waitlistEndpointMode !== "no-cors" && !response.ok) {
        throw new Error("Request failed");
      }
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = "Something went wrong. Please try again.";
      }
    }
  });
}

function setupGallery(gallery) {
  const main = gallery.querySelector(".gallery-main");
  const buttons = Array.from(
    gallery.querySelectorAll(".gallery-thumbs button[data-src]")
  );
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

conceptRows.forEach((row) => {
  row.addEventListener("click", (event) => {
    if (event.target.closest("button, a")) {
      return;
    }
    const card = row.closest(".concept-card");
    if (!card) {
      return;
    }
    const toggle = card.querySelector(".concept-toggle");
    if (toggle) {
      toggle.click();
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
