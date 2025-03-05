import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_DUMMYJSON_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end, page, limit }) =>
    `https://dummyjson.com/products?limit=${limit}&skip=${start}`,
  selectorId: 'REMOTE_LAZY_DUMMYJSON_API',
  subDir: 'products',
  templateString: (element, listLength, elemNum, templateCb) => `<li 
        class="REMOTE_LAZY_DUMMYJSON_API__listItem" 
        >

            <div class="imgWrapper">
                <img src="${element?.thumbnail}" alt="">
            </div>
            <div class="contentWrapper">
        
              <p class="title">
                ${element?.title} <em>(${element?.brand})</em>
                </p>
              <p class="desc">
                <em>website:</em> ${element?.website}  <em>(industry: ${
    element?.industry
  })</em> 
              </p>
              
              <div class="reviewList">
              ${templateCb?.reviewShower(element?.reviews)}
              </div>
              
            </div>
    </li>`,
  templateCb: {
    reviewShower(reviewsAray: []) {
      return reviewsAray
        ?.map(
          (el, i) => `<div class="review">
        <p>${el?.reviewerName} <em>${el?.reviewerEmail}</em> <strong>${el?.rating} / 5</strong></p>
        <p>${el?.comment}</p>
        <p><em>${el?.date}</em></p>
</div>`
        )
        .join('');
    },
    anyOtherFunc() {},
  },
};

// <!--                ${this.templateCb.reviewShower(element.reviews)}-->
// <!--                 REMOTE_LAZY_DUMMYJSON_API_PROPS.templateCb.reviewShower(element.reviews)-->

//   ${REMOTE_LAZY_DUMMYJSON_API_PROPS.templateCb.reviewShower(
//                 element?.reviews
//               )}

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
