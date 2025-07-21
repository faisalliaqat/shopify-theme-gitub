const routes = window.routes;

// Utility function to fetch data with AJAX
async function fetchCartData(url, method = "GET", bodyData = null) {
  const options = {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
  if (bodyData) options.body = JSON.stringify(bodyData);

  const response = await fetch(url, options);
  return await response.json();
}

// Open Cart Drawer Function
function openCartDrawer() {
  const cartDrawer = document.querySelector(".unit-cart-drawer");
  cartDrawer.classList.add("unit-cart-drawer--active");
  document.body.classList.remove('modal--open', 'modal-quickview--open', 'overflow-hidden');
 initSwiper();
  variantSelection();
}

// Close Cart Drawer Function
function closeCartDrawer() {
  document.querySelector(".unit-cart-drawer").classList.remove("unit-cart-drawer--active");
  // document.body.style.overflow = "scroll"; // Uncomment if needed
}

// Update Cart Item Count Function
async function updateCartItemCount(count = 0) {
  const cart = await fetchCartData(`${routes.cart_url}`);
  const itemCount = count !== 0 ? count : cart.item_count;
  document.querySelectorAll('.cart-count-bubble').forEach(el => {
    el.textContent = itemCount;
    el.classList.toggle('empty_cart', itemCount <= 0);
  });
}

// Update Cart Drawer Function
async function updateCartDrawer() {
  const res = await fetch(`${routes.cart_url}?section_id=cart-drawer-updated`);
  const html = document.createElement("div");
  html.innerHTML = await res.text();
  document.querySelector('.unit-cart-drawer').innerHTML = html.querySelector(".unit-cart-drawer").innerHTML;

  
  addCartDrawerListeners();
  addCartUpsellListeners2();
  removeCartDrawerListeners();
  addCartUpsellListeners();
  variantSelection();
  initSwiper();
  // stkyTotal(); // Uncomment if needed
}



// Add Event Listeners for Cart Drawer
function addCartDrawerListeners() {
  document.querySelectorAll('.unit-cart-drawer-quantity-selector button').forEach(button => {
    button.addEventListener("click", async () => {
      button.querySelector('.icon').classList.add('hidden');
      button.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const rootItem = button.closest('[data-line-item-key]');
      const key = rootItem.getAttribute("data-line-item-key");
      const currentQuantity = Number(button.parentElement.querySelector('input').value);
      const isUp = button.classList.contains('unit-cart-drawer-quantity-selector-plus');
      const newQuantity = isUp ? currentQuantity + 1 : Math.max(currentQuantity - 1, 0);

      const cart = await fetchCartData(`${routes.cart_update_url}`, 'POST', { updates: { [key]: newQuantity } });
      await updateCartItemCount(cart.item_count);
      await updateCartDrawer();

      button.querySelector('.icon').classList.remove('hidden');
      button.querySelector('.loading-overlay__spinner').classList.add('hidden');
      initSwiper();
    });
  });

  document.querySelector(".unit-cart-drawer-box").addEventListener("click", (e) => e.stopPropagation());

  document.querySelectorAll(".unit-cart-drawer-header-right-close, .unit-cart-drawer").forEach(el => {
    el.addEventListener("click", closeCartDrawer);
  });
}

// Remove Cart Item Function
function removeCartDrawerListeners() {
  document.querySelectorAll('.unit-cart-drawer-item-main-flex-right button').forEach(button => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const rootItem = button.closest('[data-line-item-key]');
      const key = rootItem.getAttribute("data-line-item-key");

      const cart = await fetchCartData(`${routes.cart_update_url}`, 'POST', { updates: { [key]: 0 } });
      await updateCartItemCount(cart.item_count);
      await updateCartDrawer();
      initSwiper();
    });
  });
}

// Add Upsell Listeners
function addCartUpsellListeners() {
  document.querySelectorAll('.add.unit-upsale-add').forEach(button => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      button.querySelector('span').classList.add('hidden');
      button.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const key = button.getAttribute("data-variant-id");
      const cart = await fetchCartData(`${routes.cart_update_url}`, 'POST', { updates: { [key]: 1 } });
      await updateCartItemCount(cart.item_count);
      await updateCartDrawer();

      button.querySelector('span').classList.remove('hidden');
      button.querySelector('.loading-overlay__spinner').classList.add('hidden');
      initSwiper();
    });
  });
}

// Variant Selection Function
function variantSelection() {
  document.querySelectorAll('.unit-upsale-main select').forEach(select => {
    select.addEventListener('change', () => {
      const parentDiv = select.closest('.unit-upsale-main');
      const btn = parentDiv.querySelector('.unit-upsale-add');
      btn.setAttribute('data-variant-id', select.value);
    });
  });
}

// Form Submission Handler
document.querySelectorAll('.product-form__submit').forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const form = btn.closest('form[action="/cart/add"]');
    const loadingSpinner = form.querySelector('.loading__spinner');
    const q_btn = form.querySelector('.hide_for_load');
    // if (loadingSpinner) {
    //   loadingSpinner.classList.remove('hidden');
    //   q_btn.classList.add('hidden');
    // }

    await fetch(`${routes.cart_add_url}`, { method: "POST", body: new FormData(form) });
    await updateCartDrawer();
    await updateCartItemCount();
    openCartDrawer();
    initSwiper();
    // if (loadingSpinner) {
    //   loadingSpinner.classList.add('hidden');
    //   q_btn.classList.remove('hidden');
    // }
  });
});

// Quick Add Button Handler
document.querySelectorAll('.quick-add__submit').forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const form = btn.closest('form');
    const loadingSpinner = form.querySelector('.quick-add__submit .loading__spinner');
    const q_btn = form.querySelector('.quick-add__submit .q_btn');

    // if (loadingSpinner) {
    //   loadingSpinner.classList.remove('hidden');
    //   q_btn.classList.add('hidden');
    // }

    if (form && form.action.endsWith('/cart/add')) {
      try {
        await fetch(`${routes.cart_add_url}`, { method: "POST", body: new FormData(form) });
        await updateCartDrawer();
        await updateCartItemCount();
        openCartDrawer();
      } catch (error) {
        console.error("Error updating cart:", error);
      }
      initSwiper();
      // if (loadingSpinner) {
      //   loadingSpinner.classList.add('hidden');
      //   q_btn.classList.remove('hidden');
      // }
    }
  });
});

// Cart Icon Handler
document.querySelectorAll('#cart-icon-bubble').forEach(a => {
  a.addEventListener('click', async (e) => {
    e.preventDefault();
    await updateCartDrawer();
    openCartDrawer();
    await updateCartItemCount();
    initSwiper();
  });
});



// Initialize Listeners on Page Load
addCartDrawerListeners();
removeCartDrawerListeners();
addCartUpsellListeners();
// addCartUpsellListeners2();






$(function() {
    $('body').on('click', '.unit-cart-drawer-header-right-close', function () {
      closeCartDrawer();
    });

  $('body').on('change', '.variant_selector_cart', function () {
    let varID = $(this).val();
    let parentELe = $(this).closest('.var_btn');
    $(this).find('option').each(function () {
      if ($(this).attr('value') == varID) {
        let salePrice = $(this).attr('data-price');
        let comparePrice = $(this).attr('data-compare-price');
        if (salePrice) {
          parentELe.siblings('.price-section').find('.actual-price').html(salePrice);
        }
        if (comparePrice) {
          parentELe.siblings('.price-section').find('.discount-price').html(comparePrice);
        }
      }
    })
  });

    $('body').on('change', '.variant_selector_cart_list', function () {
      let varID = $(this).val();
      let $this = $(this);
      $(this).find('option').each(function () {
        if ($(this).attr('value') == varID) {
          let salePrice = $(this).attr('data-price');
          let comparePrice = $(this).attr('data-compare-price');
          if (salePrice) {
            $this.siblings('.price-section').find('.actual-price').html(salePrice);
          }
          if (comparePrice) {
            $this.siblings('.price-section').find('.discount-price').html(comparePrice);
          }
        }
      })
    });

  
});