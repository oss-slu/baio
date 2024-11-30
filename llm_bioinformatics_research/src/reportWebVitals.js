/**
 * @file reportWebVitals.js
 * @description Utility file for measuring and reporting web performance metrics using the `web-vitals` library.
 *
 * Purpose:
 * - Tracks core web vitals such as CLS (Cumulative Layout Shift), FID (First Input Delay),
 *   FCP (First Contentful Paint), LCP (Largest Contentful Paint), and TTFB (Time to First Byte).
 * - Allows integration with analytics tools or custom logging for performance monitoring.
 *
 * Key Functions:
 * - `reportWebVitals(onPerfEntry)`: Invokes callback functions for each web vital metric.
 *
 * Usage:
 * - Import and use in `index.js` to enable performance tracking.
 * - Pass a callback function (e.g., for logging or sending data to an analytics endpoint) to `reportWebVitals`.
 *
 */

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
