# GA4 measurement plan

## One property, three domains

Create one GA4 property and one Web data stream. Set the same `VITE_GA_MEASUREMENT_ID` for `calculator.app`, `time.calculator.app`, and `seo.calculator.app`. In GA4 Admin, configure cross-domain measurement for all three hostnames. This preserves a user journey across the first-party domains.

The React app initializes the Google tag once and configures its linker with these domains in `src/analytics/ga4.ts`.

## Events and dimensions

The frontend emits the following privacy-safe events. `result_summary` contains output *field names*, never entered values, health metrics, salary, or free-text content.

| Event | Parameters |
| --- | --- |
| `calculator_used` | `calculator_name`, `result_summary`, `domain_name=calculator` |
| `tool_used` | `tool_name`, `tool_category`, `result_summary`, `domain_name=time-tools|seo-tools` |
| `ad_impression` | `domain_name`, `ad_slot` |
| `ad_click` | `domain_name`, `ad_slot` |
| `affiliate_click` | `domain_name`, `partner` |

Register these event-scoped custom dimensions in **Admin → Custom definitions**: `domain_name`, `tool_name`, `calculator_name`, `tool_category`, `result_summary`, `ad_slot`, and `partner`. Do not register names that GA4 already supplies as predefined dimensions.

`user_region` should not be looked up in the browser or sent with an IP address. GA4 derives coarse geography itself. If a consented geo provider is required, enrich events server-side with a non-identifying region only, register `user_region` as an event-scoped dimension, and never send raw IP, address, or other precise location data to GA4.

## Conversions and revenue

Mark `affiliate_click` as a key event after validating it. Use the AdSense/GA4 product link for ad revenue; client-side `ad_click` cannot reliably observe clicks inside a cross-origin AdSense iframe and must not be used as an AdSense billing metric. The component records an impression after a slot is initialized and captures only container clicks where the browser exposes them.

For affiliates, use `TrackedAffiliateLink` so outbound links carry `rel="sponsored"` and fire `affiliate_click` before navigation.

## Dashboard

Create a Looker Studio report using the GA4 property:

1. Filter or break down visitors by `domain_name` for unique visitors per domain.
2. Add `tool_name` and `calculator_name` tables, sort by event count, limit to five.
3. Use GA4's average engagement time and engagement/bounce metrics for time on page and bounce rate.
4. Blend linked AdSense/affiliate revenue with page views and add `RPM = (Revenue * 1000) / Page views`.

Review consent mode, retention, and your privacy policy before enabling any production measurement ID.
