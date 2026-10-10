window.initKalstudioProduct = function(scope){
if(scope.dataset.productInitialized)return;scope.dataset.productInitialized='true';
const waitlistEndpoint =
  "https://script.google.com/macros/s/AKfycbxOSZSKtpuNjGBv6cwxPQVlud6rKh5YY_RqeoCjCUebKK1DAxhqrtqlJgGGcR21Qn1L/exec";
const waitlistEndpointMode = "no-cors";

const waitlistForm = scope.querySelector("#" + "waitlist-form");
const formStatus = scope.querySelector("#" + "form-status");
const waitlistTitle = scope.querySelector("#" + "waitlist-title");
const conceptCards = scope.querySelectorAll(".concept-card");
const waitlistLinks = scope.querySelectorAll(".waitlist-link");
const waitlistSection = scope.querySelector("#" + "waitlist");
const conceptToggles = scope.querySelectorAll("[data-toggle]");
const conceptRows = scope.querySelectorAll(".concept-row");
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
  waitlistTitle.textContent = "Stay updated";
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {formStatus.textContent='Preview only — your email has not been submitted';return;}
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
    scope.dataset.ghostDirty='true';
    index = (nextIndex + buttons.length) % buttons.length;
    const button = buttons[index];
    // Keep the browser's responsive candidate selection when changing views.
    if (button.dataset.srcset) main.srcset = button.dataset.srcset;
    else main.removeAttribute('srcset');
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

  show(0);
  galleries.set(gallery, state);
}

scope.querySelectorAll("[data-gallery]").forEach((gallery) => {
  setupGallery(gallery);
});

conceptCards.forEach((concept) => {
  if (!concept.classList.contains("is-open")) {
    return;
  }
  const toggle = concept.querySelector(".concept-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
  }
  const hint = concept.querySelector(".concept-hint");
  if (hint) {
    hint.textContent = "Hide details";
  }
  const gallery = concept.querySelector("[data-gallery]");
  activeGalleryState = galleries.get(gallery) || activeGalleryState;
});

const detailAnimations = new WeakMap();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

conceptToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const concept = scope.querySelector("#" + toggle.dataset.toggle);
    if (!concept) return;
    const body = concept.querySelector('.concept-body');
    const opening = !concept.classList.contains('is-open');
    const hint = concept.querySelector('.concept-hint');
    const label = opening ? 'Hide details' : 'View details';

    // Start from the current frame so a quick reversal has no jump.
    const startHeight = body.getBoundingClientRect().height;
    const style = getComputedStyle(body);
    const startOpacity = Number(style.opacity);
    const startMargin = parseFloat(style.marginTop) || 0;
    detailAnimations.get(concept)?.cancel();
    body.style.height = `${startHeight}px`;
    body.style.opacity = String(startOpacity);
    body.style.marginTop = `${startMargin}px`;
    body.style.overflow = 'hidden';
    body.style.visibility = 'visible';

    concept.classList.toggle('is-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', `${label} for ${concept.querySelector('.concept-title')?.textContent.trim() || 'concept'}`);
    if (hint) hint.textContent = label;
    body.inert = !opening;

    if (opening) {
      const gallery = concept.querySelector('[data-gallery]');
      const galleryState = galleries.get(gallery);
      galleryState?.show(0);
      activeGalleryState = galleryState || activeGalleryState;
    }

    const clear = () => {
      body.style.height = '';
      body.style.opacity = '';
      body.style.marginTop = '';
      body.style.overflow = '';
      body.style.visibility = '';
      detailAnimations.delete(concept);
    };
    if (reducedMotion.matches || !body.animate || !concept.closest('.product-pinboard')) {
      clear();
      return;
    }

    const endHeight = opening ? body.scrollHeight : 0;
    const animation = body.animate([
      {height:`${startHeight}px`,opacity:startOpacity,marginTop:`${startMargin}px`},
      {height:`${endHeight}px`,opacity:opening?1:0,marginTop:opening?'24px':'0px'}
    ], {duration:opening?480:380,easing:'cubic-bezier(.22,.75,.24,1)',fill:'forwards'});
    detailAnimations.set(concept, animation);
    animation.onfinish = () => {
      if (detailAnimations.get(concept) !== animation) return;
      clear();
      animation.cancel();
    };
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
  if (scope.inert || scope.hidden || event.defaultPrevented || event.target.closest("input, textarea, select, [contenteditable], .site-slider")) return;
  if (!activeGalleryState) {
    return;
  }
  if (!galleryHintHidden) {
    scope.querySelectorAll("[data-gallery-hint]").forEach((hint) => {
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

};
if(document.querySelector('main .concept-card'))window.initKalstudioProduct(document.querySelector('main'));
