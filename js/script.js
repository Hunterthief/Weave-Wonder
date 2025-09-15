// Product configuration
const productsConfig = {
  tshirt: {
    name: "Classic T-Shirt",
    basePrice: 350,
    frontBackPrice: 20,
    colors: {
      black: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-1-thumb.jpeg',
        backImage: 'Tshirt/default-color-1-mockup-9.jpeg'
      },
      white: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-2-thumb.jpeg',
        backImage: 'Tshirt/default-color-2-mockup-9.jpeg'
      },
      gray: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-3-thumb.jpeg',
        backImage: 'Tshirt/default-color-3-mockup-9.jpeg'
      },
      blue: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-10-thumb.jpeg',
        backImage: 'Tshirt/default-color-10-mockup-9.jpeg'
      },
      red: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-11-thumb.jpeg',
        backImage: 'Tshirt/default-color-11-mockup-9.jpeg'
      },
      'light-blue': {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Tshirt/product-4-mockup-8-color-18-thumb.jpeg',
        backImage: 'Tshirt/default-color-18-mockup-9.jpeg'
      }
    },
    sizeChart: 'Tshirt/tshirt-size-table-on-egymerch.jpg'
  },
  "oversized-tshirt": {
    name: "Oversized T-Shirt",
    basePrice: 400,
    frontBackPrice: 20,
    colors: {
      black: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Tshirt/product-5-mockup-10-color-1-thumb.jpeg',
        backImage: 'Oversized Tshirt/default-color-1-mockup-11.jpeg'
      },
      white: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Tshirt/product-5-mockup-10-color-2-thumb.jpeg',
        backImage: 'Oversized Tshirt/default-color-2-mockup-11.jpeg'
      },
      gray: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Tshirt/product-5-mockup-10-color-10-thumb.jpeg',
        backImage: 'Oversized Tshirt/default-color-10-mockup-11.jpeg'
      },
      red: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Tshirt/product-5-mockup-10-color-11-thumb.jpeg',
        backImage: 'Oversized Tshirt/default-color-11-mockup-11.jpeg'
      },
      'light-blue': {
        sizes: ["M", "L"],
        frontImage: 'Oversized Tshirt/product-5-mockup-10-color-20-thumb.jpeg',
        backImage: 'Oversized Tshirt/default-color-20-mockup-11.jpeg'
      }
    },
    sizeChart: 'Oversized Tshirt/oversize-tshirt-size-table-on-egymerch.jpg'
  },
  longsleeve: {
    name: "Long Sleeve T-Shirt",
    basePrice: 200,
    frontBackPrice: 70,
    colors: {
      black: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Long sleeve Tshirt/product-6-mockup-12-color-1-thumb.jpeg',
        backImage: 'Long sleeve Tshirt/default-color-1-mockup-13.jpeg'
      },
      white: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Long sleeve Tshirt/product-6-mockup-12-color-2-thumb.jpeg',
        backImage: 'Long sleeve Tshirt/default-color-2-mockup-13.jpeg'
      },
      gray: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Long sleeve Tshirt/product-6-mockup-12-color-3-thumb.jpeg',
        backImage: 'Long sleeve Tshirt/default-color-3-mockup-13.jpeg'
      },
      red: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Long sleeve Tshirt/product-6-mockup-12-color-11-thumb.jpeg',
        backImage: 'Long sleeve Tshirt/default-color-11-mockup-13.jpeg'
      }
    },
    sizeChart: 'Long sleeve Tshirt/longsleeve-tshirt-size-table-on-egymerch.jpg'
  },
  "classic-sweatshirt": {
    name: "Classic Sweatshirt",
    basePrice: 250,
    frontBackPrice: 80,
    colors: {
      black: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Sweatshirt/product-7-mockup-14-color-1-thumb.jpeg',
        backImage: 'Classic Sweatshirt/default-color-1-mockup-15.jpeg'
      },
      white: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Sweatshirt/product-7-mockup-14-color-2-thumb.jpeg',
        backImage: 'Classic Sweatshirt/default-color-2-mockup-15.jpeg'
      },
      "light-blue": {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Sweatshirt/product-7-mockup-14-color-5-thumb.jpeg',
        backImage: 'Classic Sweatshirt/default-color-5-mockup-15.jpeg'
      },
      beige: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Sweatshirt/product-7-mockup-14-color-7-thumb.jpeg',
        backImage: 'Classic Sweatshirt/default-color-7-mockup-15.jpeg'
      },
      "olive-green": {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Sweatshirt/product-7-mockup-14-color-9-thumb.jpeg',
        backImage: 'Classic Sweatshirt/default-color-9-mockup-15.jpeg'
      }
    },
    sizeChart: 'Classic Sweatshirt/sweatshirt-size-table-on-egymerch.jpg'
  },
  "premium-hoodie": {
    name: "Premium Hoodie",
    basePrice: 300,
    frontBackPrice: 100,
    colors: {
      black: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Premium Hoodie/product-1-mockup-1-color-1-thumb.jpeg',
        backImage: 'Premium Hoodie/default-color-1-mockup-3.jpeg'
      },
      white: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Premium Hoodie/product-1-mockup-1-color-2-thumb.jpeg',
        backImage: 'Premium Hoodie/default-color-2-mockup-3.jpeg'
      },
      gray: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Premium Hoodie/product-1-mockup-1-color-3-thumb.jpeg',
        backImage: 'Premium Hoodie/default-color-3-mockup-3.jpeg'
      }
    },
    sizeChart: 'Premium Hoodie/premium-hoodie-size-table-on-egymerch.jpg'
  },
  "classic-hoodie": {
    name: "Classic Hoodie",
    basePrice: 280,
    frontBackPrice: 90,
    colors: {
      black: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-1-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-1-mockup-5.jpeg'
      },
      white: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-2-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-2-mockup-5.jpeg'
      },
      "light-blue": {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-5-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-5-mockup-5.jpeg'
      },
      beige: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-6-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-6-mockup-5.jpeg'
      },
      "olive-green": {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-7-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-7-mockup-5.jpeg'
      },
      red: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-9-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-9-mockup-5.jpeg'
      },
      magenta: {
        sizes: ["M", "L", "XL", "2XL", "3XL"],
        frontImage: 'Classic Hoodie/product-2-mockup-4-color-11-thumb.jpeg',
        backImage: 'Classic Hoodie/default-color-11-mockup-5.jpeg'
      }
    },
    sizeChart: 'Classic Hoodie/classic-hoodie-size-table-on-egymerch.jpg'
  },
  "oversized-hoodie": {
    name: "Oversized Hoodie",
    basePrice: 320,
    frontBackPrice: 110,
    colors: {
      black: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Hoodie/product-3-mockup-6-color-1-thumb.jpeg',
        backImage: 'Oversized Hoodie/default-color-1-mockup-7.jpeg'
      },
      white: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Hoodie/product-3-mockup-6-color-2-thumb.jpeg',
        backImage: 'Oversized Hoodie/default-color-2-mockup-7.jpeg'
      },
      "light-blue": {
        sizes: ["M", "L"],
        frontImage: 'Oversized Hoodie/product-3-mockup-6-color-5-thumb.jpeg',
        backImage: 'Oversized Hoodie/default-color-5-mockup-7.jpeg'
      },
      red: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Hoodie/product-3-mockup-6-color-9-thumb.jpeg',
        backImage: 'Oversized Hoodie/default-color-9-mockup-7.jpeg'
      },
      magenta: {
        sizes: ["M", "L"],
        frontImage: 'Oversized Hoodie/product-3-mockup-6-color-11-thumb.jpeg',
        backImage: 'Oversized Hoodie/default-color-11-mockup-7.jpeg'
      }
    },
    sizeChart: 'Oversized Hoodie/oversize-hoodie-size-table-on-egymerch.jpg'
  }
};

// Shipping configuration
const shippingConfig = {
  "القاهرة": 45,
  "جيزة": 45,
  "الإسكندرية": 50,
  "الدقهلية": 50,
  "الشرقية": 50,
  "المنوفية": 50,
  "القليوبية": 50,
  "البحيرة": 50,
  "الغربية": 50,
  "بورسعيد": 55,
  "دمياط": 50,
  "الإسماعيلية": 55,
  "السويس": 55,
  "كفر الشيخ": 50,
  "الفيوم": 50,
  "بني سويف": 60,
  "مرسى مطروح": 130,
  "المنيا": 60,
  "أسيوط": 60,
  "سوهاج": 60,
  "قنا": 60,
  "الغردقة": 130,
  "شرم الشيخ": 130,
  "الأقصر": 65,
  "أسوان": 65,
  "الوادي الجديد": 130,
  "الدماهور": 50,
  "جيزة (المدن الجديدة)": 45,
  "شمال سيناء": 130,
  "العريش": 130,
  "البحر الأحمر": 130,
  "جنوب سيناء": 130
};

// Boundary configuration
const BOUNDARY = { TOP: 101, LEFT: 125, WIDTH: 150, HEIGHT: 150 };

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Setup design submission
  setupDesignSubmission();
  // Setup order form
  setupOrderForm();
});

function setupDesignSubmission() {
  // Product type selection
  const productTypeSelect = document.getElementById('product-type');
  const colorOptionsContainer = document.getElementById('color-options');
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const frontView = document.getElementById('front-view');
  const backView = document.getElementById('back-view');
  const frontPreview = document.getElementById('front-preview');
  const backPreview = document.getElementById('back-preview');

  // Initial setup
  updateColorOptions('tshirt');

  // Product type change
  productTypeSelect.addEventListener('change', (e) => {
    const newProductType = e.target.value;
    updateColorOptions(newProductType);
    // Only update the base images, don't reset the design
    updateProductImage(document.querySelector('.color-option.selected')?.dataset.color);
  });

  // Color selection
  colorOptionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      updateProductImage(e.target.dataset.color);
    }
  });

  // Front design upload
  document.getElementById('front-design').addEventListener('change', (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        // Clear existing design
        frontLayer.innerHTML = '';

        // Create design image
const img = document.createElement('img');
img.src = event.target.result;
img.className = 'design-image';
img.draggable = true;

// Wait for image to load to get natural dimensions
img.onload = function() {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const layerWidth = BOUNDARY.WIDTH;   // 150
  const layerHeight = BOUNDARY.HEIGHT; // 150

  // Calculate scale to fit inside boundary while preserving aspect ratio
  const scale = Math.min(layerWidth / naturalWidth, layerHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  // Center the image in the layer
  const left = (layerWidth - width) / 2;
  const top = (layerHeight - height) / 2;

  // Apply size and position — NO stretching!
  img.style.width = width + 'px';
  img.style.height = height + 'px';
  img.style.position = 'absolute';
  img.style.top = top + 'px';
  img.style.left = left + 'px';
  img.style.transform = 'translate(0, 0)';

  // Store original dimensions for later use in resizable()
  img.setAttribute('data-original-width', naturalWidth);
  img.setAttribute('data-original-height', naturalHeight);
};

// Add to layer
frontLayer.appendChild(img); // or backLayer.appendChild(img);

        // Add to layer
        frontLayer.appendChild(img);

        // Show preview
        frontPreview.innerHTML = '';
        frontPreview.innerHTML = `<img src="${event.target.result}" class="preview-image">`;
        frontPreview.classList.remove('hidden');

        // Add boundary buttons
        addBoundaryButtons(frontLayer);

        // Make draggable and resizable with boundaries
        interact('.design-image').draggable({
          inertia: true,
          modifiers: [
            interact.modifiers.restrictRect({
              restriction: {
                top: 0,
                left: 0,
                width: BOUNDARY.WIDTH,
                height: BOUNDARY.HEIGHT
              },
              endOnly: true
            })
          ],
          listeners: {
            // ✅ Set initial offset when drag starts
            start: function (event) {
              const target = event.target;
              const rect = target.getBoundingClientRect();
              const clientX = event.clientX;
              const clientY = event.clientY;

              // Calculate how far the click was from the top-left of the image
              const offsetX = clientX - rect.left;
              const offsetY = clientY - rect.top;

              target.setAttribute('data-offset-x', offsetX);
              target.setAttribute('data-offset-y', offsetY);
            },

            // ✅ Use offset to drag smoothly — no more jumping!
            move: function (event) {
              const target = event.target;
              const layer = target.closest('.design-layer');
              const layerRect = layer.getBoundingClientRect();

              const clientX = event.clientX;
              const clientY = event.clientY;

              // Get saved offset
              const offsetX = parseFloat(target.getAttribute('data-offset-x')) || 0;
              const offsetY = parseFloat(target.getAttribute('data-offset-y')) || 0;

              // Calculate position relative to layer's top-left
              const x = clientX - layerRect.left - offsetX;
              const y = clientY - layerRect.top - offsetY;

              // Apply transform — THIS IS WHAT download.js WILL READ
              target.style.transform = `translate(${x}px, ${y}px)`;

              // Store for debugging (optional)
              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
            }
          }
        });

        interact('.design-image').resizable({
  edges: { left: true, right: true, top: true, bottom: true },
  modifiers: [
    interact.modifiers.restrictSize({
      restriction: {
        min: { width: 50, height: 50 },
        max: { width: BOUNDARY.WIDTH, height: BOUNDARY.HEIGHT }
      }
    })
  ],
  listeners: {
    // Store original dimensions on resize start
    start: function (event) {
      const target = event.target;
      const naturalWidth = parseFloat(target.getAttribute('data-original-width')) || target.offsetWidth;
      const naturalHeight = parseFloat(target.getAttribute('data-original-height')) || target.offsetHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      target.setAttribute('data-aspect-ratio', aspectRatio);
    },

    // Maintain aspect ratio during resize
    move: function (event) {
      const target = event.target;
      let width = parseFloat(target.getAttribute('data-width')) || target.offsetWidth;
      let height = parseFloat(target.getAttribute('data-height')) || target.offsetHeight;

      // Apply delta
      width += event.deltaRect.width;
      height += event.deltaRect.height;

      // Get stored aspect ratio
      const aspectRatio = parseFloat(target.getAttribute('data-aspect-ratio'));

      // If resizing from left/right (horizontal), adjust height proportionally
      if (Math.abs(event.deltaRect.width) > Math.abs(event.deltaRect.height)) {
        // Width changed more → base height on width
        height = width / aspectRatio;
      } else {
        // Height changed more → base width on height
        width = height * aspectRatio;
      }

      // Enforce min/max boundaries
      width = Math.max(50, Math.min(BOUNDARY.WIDTH, width));
      height = Math.max(50, Math.min(BOUNDARY.HEIGHT, height));

      // Apply new size
      target.style.width = width + 'px';
      target.style.height = height + 'px';
      target.setAttribute('data-width', width);
      target.setAttribute('data-height', height);
    }
  }
});

        interact('.design-image').on('resizeend', (event) => {
          const target = event.target;
          target.style.transform = 'none';
        });
         updateOrderSummary();
      };
      reader.readAsDataURL(file);
    }
  });

  // Back design upload
  document.getElementById('back-design').addEventListener('change', (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        // Clear existing design
        backLayer.innerHTML = '';

        // Create design image
        const img = document.createElement('img');
        img.src = event.target.result;
        img.className = 'design-image';
        img.draggable = true;

        // Set initial position and reset transform
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.transform = 'none';

        // Add to layer
        backLayer.appendChild(img);

        // Show preview
        backPreview.innerHTML = '';
        backPreview.innerHTML = `<img src="${event.target.result}" class="preview-image">`;
        backPreview.classList.remove('hidden');

        // Add boundary buttons
        addBoundaryButtons(backLayer);

        // Make draggable and resizable with boundaries
        interact('.design-image').draggable({
          inertia: true,
          modifiers: [
            interact.modifiers.restrictRect({
              restriction: {
                top: 0,
                left: 0,
                width: BOUNDARY.WIDTH,
                height: BOUNDARY.HEIGHT
              },
              endOnly: true
            })
          ],
          listeners: {
            // ✅ Set initial offset when drag starts
            start: function (event) {
              const target = event.target;
              const rect = target.getBoundingClientRect();
              const clientX = event.clientX;
              const clientY = event.clientY;

              // Calculate how far the click was from the top-left of the image
              const offsetX = clientX - rect.left;
              const offsetY = clientY - rect.top;

              target.setAttribute('data-offset-x', offsetX);
              target.setAttribute('data-offset-y', offsetY);
            },

            // ✅ Use offset to drag smoothly — no more jumping!
            move: function (event) {
              const target = event.target;
              const layer = target.closest('.design-layer');
              const layerRect = layer.getBoundingClientRect();

              const clientX = event.clientX;
              const clientY = event.clientY;

              // Get saved offset
              const offsetX = parseFloat(target.getAttribute('data-offset-x')) || 0;
              const offsetY = parseFloat(target.getAttribute('data-offset-y')) || 0;

              // Calculate position relative to layer's top-left
              const x = clientX - layerRect.left - offsetX;
              const y = clientY - layerRect.top - offsetY;

              // Apply transform — THIS IS WHAT download.js WILL READ
              target.style.transform = `translate(${x}px, ${y}px)`;

              // Store for debugging (optional)
              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
            }
          }
        });

        interact('.design-image').resizable({
  edges: { left: true, right: true, top: true, bottom: true },
  modifiers: [
    interact.modifiers.restrictSize({
      restriction: {
        min: { width: 50, height: 50 },
        max: { width: BOUNDARY.WIDTH, height: BOUNDARY.HEIGHT }
      }
    })
  ],
  listeners: {
    // Store original dimensions on resize start
    start: function (event) {
      const target = event.target;
      const naturalWidth = target.naturalWidth || target.offsetWidth;
      const naturalHeight = target.naturalHeight || target.offsetHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      target.setAttribute('data-aspect-ratio', aspectRatio);
    },

    // Maintain aspect ratio during resize
    move: function (event) {
      const target = event.target;
      let width = parseFloat(target.getAttribute('data-width')) || target.offsetWidth;
      let height = parseFloat(target.getAttribute('data-height')) || target.offsetHeight;

      // Apply delta
      width += event.deltaRect.width;
      height += event.deltaRect.height;

      // Get stored aspect ratio
      const aspectRatio = parseFloat(target.getAttribute('data-aspect-ratio'));

      // If resizing from left/right (horizontal), adjust height proportionally
      if (Math.abs(event.deltaRect.width) > Math.abs(event.deltaRect.height)) {
        // Width changed more → base height on width
        height = width / aspectRatio;
      } else {
        // Height changed more → base width on height
        width = height * aspectRatio;
      }

      // Enforce min/max boundaries
      width = Math.max(50, Math.min(BOUNDARY.WIDTH, width));
      height = Math.max(50, Math.min(BOUNDARY.HEIGHT, height));

      // Apply new size
      target.style.width = width + 'px';
      target.style.height = height + 'px';
      target.setAttribute('data-width', width);
      target.setAttribute('data-height', height);
    }
  }
});

        interact('.design-image').on('resizeend', (event) => {
          const target = event.target;
          target.style.transform = 'none';
        });
        updateOrderSummary();
      };
      reader.readAsDataURL(file);
    }
  });
}

function updateColorOptions(productType) {
  const container = document.getElementById('color-options');
  container.innerHTML = '';
  const config = productsConfig[productType];
  if (!config) return;

  Object.keys(config.colors).forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.dataset.color = color;
    colorOption.style.backgroundColor = color === 'black' ? '#000' : 
                                      color === 'white' ? '#fff' : 
                                      color === 'gray' ? '#808080' : 
                                      color === 'blue' ? '#0000ff' : 
                                      color === 'red' ? '#ff0000' : 
                                      color === 'light-blue' ? '#87CEEB' : 
                                      color === 'beige' ? '#F5F5DC' : 
                                      color === 'olive-green' ? '#808000' : 
                                      color === 'magenta' ? '#FF00FF' : '#000';
    container.appendChild(colorOption);
  });

  // Select first color by default
  if (container.children.length > 0) {
    container.children[0].classList.add('selected');
    updateProductImage(container.children[0].dataset.color);
  }
}

function updateProductImage(color) {
  const productType = document.getElementById('product-type').value;
  const config = productsConfig[productType];
  if (!config || !config.colors[color]) return;

  const frontImageSrc = config.colors[color].frontImage;
  const backImageSrc = config.colors[color].backImage;

  document.getElementById('front-view').querySelector('.base-image').src = frontImageSrc;
  document.getElementById('back-view').querySelector('.base-image').src = backImageSrc;
}

function resetDesign() {
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const frontPreview = document.getElementById('front-preview');
  const backPreview = document.getElementById('back-preview');

  frontLayer.innerHTML = '';
  backLayer.innerHTML = '';
  frontPreview.innerHTML = '';
  backPreview.innerHTML = '';
  frontPreview.classList.add('hidden');
  backPreview.classList.add('hidden');

  // Remove boundary buttons
  document.querySelectorAll('.boundary-button').forEach(btn => btn.remove());
}

function addBoundaryButtons(layer) {
  // Remove existing buttons
  const existingButtons = layer.querySelectorAll('.boundary-button');
  existingButtons.forEach(btn => btn.remove());

  // Create new buttons
  const buttons = [
    { className: 'top-button', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>' },
    { className: 'right-button', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>' },
    { className: 'bottom-button', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>' },
    { className: 'left-button', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>' }
  ];

  buttons.forEach(btn => {
    const button = document.createElement('div');
    button.className = `boundary-button ${btn.className}`;
    button.innerHTML = btn.icon;
    button.addEventListener('click', () => {
      const img = layer.querySelector('.design-image');
      if (!img) return;

      switch(btn.className) {
        case 'top-button':
          centerDesignVertically(layer, img);
          break;
        case 'right-button':
          centerDesignHorizontally(layer, img);
          break;
        case 'bottom-button':
          centerDesignVertically(layer, img);
          break;
        case 'left-button':
          centerDesignHorizontally(layer, img);
          break;
      }
    });
    layer.appendChild(button);
  });
}

function centerDesignHorizontally(layer, img) {
  if (!img) return;
  const layerWidth = layer.offsetWidth;
  const imgWidth = img.offsetWidth;
  const leftPosition = (layerWidth - imgWidth) / 2;
  img.style.left = leftPosition + 'px';
  img.style.transform = 'none';
}

function centerDesignVertically(layer, img) {
  if (!img) return;
  const layerHeight = layer.offsetHeight;
  const imgHeight = img.offsetHeight;
  const topPosition = (layerHeight - imgHeight) / 2;
  img.style.top = topPosition + 'px';
  img.style.transform = 'none';
}

function setupOrderForm() {
  const productTypeSelect = document.getElementById('product-type-order');
  const colorSelect = document.getElementById('color-order');
  const sizeOptionsContainer = document.getElementById('size-options');
  const governorateSelect = document.getElementById('governorate');
  const shippingCostElement = document.getElementById('shipping-cost');
  const productPriceElement = document.getElementById('product-price');
  const shippingCostSummary = document.getElementById('shipping-cost-summary');
  const totalPriceElement = document.getElementById('total-price');
  const sizeChartImg = document.querySelector('.size-chart img');

  // Populate product types
  Object.keys(productsConfig).forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = productsConfig[type].name;
    productTypeSelect.appendChild(option);
  });

  // Product type change
  productTypeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    if (!type) return;

    // Update color options
    colorSelect.innerHTML = '<option value="">Select Color</option>';
    const config = productsConfig[type];
    Object.keys(config.colors).forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      colorSelect.appendChild(option);
    });

    // Update size chart image
    sizeChartImg.src = config.sizeChart;
 // Add this after initializing the form
  document.getElementById('quantity').addEventListener('input', updateOrderSummary);
    // Update size options
    updateSizeOptions(type, 'black');
  });

  // Color change
  colorSelect.addEventListener('change', (e) => {
    const type = productTypeSelect.value;
    const color = e.target.value;
    if (!type || !color) return;
    updateSizeOptions(type, color);
  });

  // Governorate change
  governorateSelect.addEventListener('change', updateShippingCost);

  // Initial setup
  if (productTypeSelect.options.length > 0) {
    productTypeSelect.value = Object.keys(productsConfig)[0];
    productTypeSelect.dispatchEvent(new Event('change'));
  }

  // Order form submission
  document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Collect data
    const formData = {
      productType: productsConfig[productTypeSelect.value].name,
      color: colorSelect.value,
      size: document.querySelector('.size-option.selected')?.textContent || '',
      quantity: 1,
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      secondaryPhone: document.getElementById('secondary-phone').value,
      governorate: governorateSelect.value,
      address: document.getElementById('address').value,
      deliveryNotes: document.getElementById('delivery-notes').value,
      productPrice: parseFloat(productPriceElement.textContent),
      shippingCost: parseFloat(shippingCostElement.textContent),
      totalPrice: parseFloat(totalPriceElement.textContent)
    };

    // Send email
    sendOrderEmail(formData);
  });
}

function updateSizeOptions(type, color) {
  const container = document.getElementById('size-options');
  container.innerHTML = '';

  // Define inventory map: Product → Color → Sizes (as string)
  const inventory = {
    "premium-hoodie": {
      black: "M L 2XL",
      white: "3XL",
      gray: "XL"
    },
    "classic-hoodie": {
      black: "XL 3XL",
      white: "M L XL 3XL",
      "light-blue": "M L XL 2XL 3XL",
      magenta: "2XL",
      beige: "",
      "olive-green": "M L",
      red: ""
    },
    "oversized-hoodie": {
      black: "",
      white: "M L",
      "light-blue": "m",
      magenta: "",
      beige: "",
      "olive-green": "M L",
      red: "m l"
    },
    "tshirt": {
      black: "",
      white: "XL",
      gray: "L 2XL 3XL",
      blue: "XL",
      red: "M L XL 2XL 3XL",
      indigo: "",
      "light-blue": "2XL",
      "dark-light-blue": ""
    },
    "oversized-tshirt": {
      black: "",
      white: "",
      indigo: "",
      blue: "",
      red: "M L",
      "light-blue": "m l"
    },
    "longsleeve": {
      black: "XL",
      white: "M XL 3XL",
      red: "M L XL 2XL 3XL",
      gray: "M L XL 3XL"
    },
    "classic-sweatshirt": {
      black: "M 3XL",
      white: "M 2XL 3XL",
      "light-blue": "M XL 2XL 3XL",
      magenta: "M L XL 2XL 3XL",
      beige: "M L XL 3XL",
      "olive-green": "3XL"
    }
  };

  // Normalize product type and color for lookup
  const normalizedType = type.toLowerCase();
  const normalizedColor = color.toLowerCase();

  // Get available sizes as string, or empty if not found
  const sizeString = inventory[normalizedType]?.[normalizedColor] || "";

  // Split into array and clean up whitespace
  const sizeList = sizeString.trim().split(/\s+/);

  // If no sizes defined, show message
  if (!sizeList.length || (sizeList.length === 1 && !sizeList[0])) {
    container.innerHTML = '<div class="size-option disabled">No sizes available</div>';
    return;
  }

  // Create size options
  sizeList.forEach(size => {
    const sizeOption = document.createElement('div');
    sizeOption.className = 'size-option';
    sizeOption.textContent = size.toUpperCase(); // Display always uppercase

    // Determine stock status
    const isUpperCase = size === size.toUpperCase();
    const isLowerCase = size === size.toLowerCase();
    const isInStock = isUpperCase;
    const isLowStock = isLowerCase;
    const isOutOfStock = !isUpperCase && !isLowerCase; // shouldn't happen but safe

    // Apply classes based on stock level
   // Apply classes based on stock level
if (isOutOfStock) {
  sizeOption.classList.add('disabled');
} else if (isLowStock) {
  sizeOption.classList.add('low-stock');
} else if (isInStock) {
  sizeOption.classList.add('in-stock');
}

// Always set pointer events for disabled items
if (isOutOfStock) {
  sizeOption.style.pointerEvents = 'none';
  sizeOption.style.opacity = '0.5';
  sizeOption.style.textDecoration = 'line-through';
  sizeOption.style.color = '#999';
}

// Add click handler
sizeOption.addEventListener('click', () => {
  // Remove selected from all options
  document.querySelectorAll('.size-option').forEach(opt => {
    opt.classList.remove('selected');
  });

  // Only mark as selected if it's IN STOCK (uppercase)
  if (isInStock) {
    sizeOption.classList.add('selected');
  }

  updateOrderSummary();
});

    container.appendChild(sizeOption);
  });
// --- ADD LEGEND BELOW SIZE OPTIONS ---
const legendContainer = document.createElement('div');
legendContainer.className = 'size-legend';
legendContainer.innerHTML = `
  <small>
    <span class="legend-item in-stock">
      <span class="legend-color in-stock"></span>
      <strong>In Stock</strong> – Available
    </span> |
    <span class="legend-item low-stock">
      <span class="legend-color low-stock"></span>
      <strong>Low Stock</strong> – Limited
    </span> |
    <span class="legend-item disabled">
      <span class="legend-color disabled"></span>
      <strong>Out of Stock</strong> – Not Available
    </span>
  </small>
`;
legendContainer.style.textAlign = 'center';
legendContainer.style.marginTop = '0.5rem';
legendContainer.style.color = '#555';
legendContainer.style.fontSize = '0.85rem';
legendContainer.style.lineHeight = '1.6';
container.appendChild(legendContainer);
  // Auto-select first available (in-stock) size
  const firstAvailable = container.querySelector('.size-option:not(.disabled):not(.low-stock)');
  if (firstAvailable) {
    firstAvailable.click();
  } else {
    // If none are selectable, clear selection
    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
    updateOrderSummary();
  }
}

function updateShippingCost() {
  const governorate = document.getElementById('governorate').value;
  const cost = shippingConfig[governorate] || 0;
  document.getElementById('shipping-cost').textContent = cost;
  document.getElementById('shipping-cost-summary').textContent = cost;
  updateOrderSummary();
}

function updateOrderSummary() {
  const productType = document.getElementById('product-type-order').value;
  const config = productsConfig[productType];
  if (!config) return;
  
  // Check if both front and back designs are uploaded
  const frontLayer = document.getElementById('front-layer');
  const backLayer = document.getElementById('back-layer');
  const hasFrontDesign = frontLayer.querySelector('.design-image') !== null;
  const hasBackDesign = backLayer.querySelector('.design-image') !== null;
  
  // Get quantity
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  
  // Only add frontBackPrice if both designs are uploaded
  const totalProductPrice = config.basePrice + (hasFrontDesign && hasBackDesign ? config.frontBackPrice : 0);
  
  document.getElementById('product-price').textContent = totalProductPrice * quantity;
  
  const governorate = document.getElementById('governorate').value;
  const shippingCost = shippingConfig[governorate] || 0;
  const totalPrice = (totalProductPrice + shippingCost) * quantity;
  
  document.getElementById('total-price').textContent = totalPrice;
  // ✅ NEW: Warn if selected size is low stock
  const selectedSize = document.querySelector('.size-option.selected');
  if (selectedSize && selectedSize.classList.contains('low-stock')) {
    alert("⚠️ Warning: This size is low in stock. Only limited quantities available.");
  }
}

function validateForm() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const governorate = document.getElementById('governorate').value;
  const address = document.getElementById('address').value;

  if (!name) {
    alert('Please enter your full name');
    return false;
  }

  if (!phone || phone.length !== 11 || !/^[0-9]{11}$/.test(phone)) {
    alert('Please enter a valid 11-digit Egyptian phone number');
    return false;
  }

  if (!governorate) {
    alert('Please select a governorate');
    return false;
  }

  if (!address) {
    alert('Please enter your exact address');
    return false;
  }

  return true;
}

function sendOrderEmail(data) {
  // In a real implementation, you would use EmailJS with your credentials
  // For demo purposes, we'll show an alert
  alert('Order submitted! In a real implementation, this would send an email to hassanwaelhh@proton.me');
  console.log('Order ', data);

  // Reset form
  document.getElementById('order-form').reset();
  document.getElementById('product-type-order').dispatchEvent(new Event('change'));
}
