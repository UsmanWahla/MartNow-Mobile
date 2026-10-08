# Web customer frontend → mobile app

| Web customer experience              | Expo mobile implementation                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Marketplace home and store directory | Home tab with live store grid                                                                                      |
| Global store search                  | Search tab; filters store name, type, address, and slug                                                            |
| Store landing page                   | Store detail with branding, business information, directions, delivery details, featured items, and full catalogue |
| Product search/category/sort         | Store-local search, derived category chips, featured/newest/price sorting                                          |
| Product cards                        | Responsive animated two-to-five-column grid                                                                        |
| Product detail                       | Gallery, thumbnails, full-screen pinch/pan/double-tap zoom, variants, stock, unit conversion, and stepped quantity |
| Store cart                           | Cart tab with remembered cart store, quantity update, remove confirmation, and live totals                         |
| Customer checkout                    | Saved/new address, location search/current GPS/map pin, delivery provider, COD, delivery fee, and payable total    |
| Customer login/signup                | Secure mobile session with guarded return navigation                                                               |
| Customer profile                     | Account tab with profile editing                                                                                   |
| Password update                      | Password & Security stack screen                                                                                   |
| Address management                   | List/add/edit/delete/default address screens                                                                       |
| Order history                        | Orders tab with status filters and pagination, plus three recent orders inside Account                             |
| Order detail                         | Status timeline, store, items, delivery location/provider, payment, and totals                                     |

The web backend does not expose customer wishlist/favorites, reviews, coupons, or notification APIs. Those features are intentionally not mocked in the mobile app.
