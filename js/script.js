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
        sizes
