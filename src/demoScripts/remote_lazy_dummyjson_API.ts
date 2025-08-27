import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_DUMMYJSON_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end, page, limit }) =>
    `https://dummyjson.com/products?limit=${limit}&skip=${start}`,
  selectorId: 'REMOTE_LAZY_DUMMYJSON_API',
  subDir: 'products',
  forcedListLength: 194, // TODO: temportary
  templateString: ({ item, templateCb }) => {
    const { thumbnail, title, brand, website, industry, reviews } = item;

    const imgSrc = !thumbnail || thumbnail === 'Loading' ? '' : thumbnail; // to avoid unnecessary loading

    return `<li 
        class="REMOTE_LAZY_DUMMYJSON_API__listItem" 
        >
            <div class="imgWrapper">
                <img src="${imgSrc}" alt="">
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
    reviewShower(reviewsAray = [{}]) {
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
