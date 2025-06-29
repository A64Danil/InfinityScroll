import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_DUMMYJSON_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end, page, limit }) =>
    `https://dummyjson.com/products?limit=${limit}&skip=${start}`,
  selectorId: 'REMOTE_LAZY_DUMMYJSON_API',
  subDir: 'products',
  forcedListLength: 40, // TODO: temportary
  // forcedListLength: 15, // TODO: temportary
  // forcedListLength: 194, // TODO: temportary
  templateString: ({ item, templateCb }) => {
    const {
      thumbnail = '',
      title = '',
      brand = '',
      website = '',
      industry = '',
      reviews = [],
    } = item;

    return `<li 
        class="REMOTE_LAZY_DUMMYJSON_API__listItem" 
        >
            <div class="imgWrapper">
                <img src="${thumbnail}" alt="">
            </div>
            <div class="contentWrapper">
        
              <p class="title">
                ${title} <em>(${brand})</em>
                </p>
              <p class="desc">
                <em>website:</em> ${website}  <em>(industry: ${industry})</em> 
              </p>
              
              <div class="reviewList">
              ${templateCb.reviewShower(reviews)}
              </div>
              
            </div>
    </li>`;
  },
  templateCb: {
    reviewShower(reviewsAray: []) {
      return reviewsAray
        ?.map(
          (el: Record<string, unknown>, i) => `<div class="review">
        <p>${el.reviewerName} <em>${el.reviewerEmail}</em> <strong>${el.rating} / 5</strong></p>
        <p>${el.comment}</p>
        <p><em>${el.date}</em></p>
</div>`
        )
        .join('');
    },
    anyOtherFunc() {},
  },
};

type Review = {
  rating: number;
  comment: string;
  date: string; // ISO 8601 формат даты
  reviewerName: string;
  reviewerEmail: string;
};

type Dimensions = {
  width: number;
  height: number;
  depth: number;
};

type Meta = {
  createdAt: string; // ISO 8601 формат даты
  updatedAt: string; // ISO 8601 формат даты
  barcode: string;
  qrCode: string;
};

type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: Dimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: Review[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: Meta;
  images: string[];
  thumbnail: string;
};
