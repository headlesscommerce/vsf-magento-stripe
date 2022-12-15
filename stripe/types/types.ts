/** The unique client secret for stripe element payment */
export interface PaymentIntentClientSecret {
  client_secret: String
}
/** Contains client secret and appearance properties */
export interface PaymentIntentOptions {
  clientSecret: any
  appearance?: PaymentIntentOptionsAppearances;
}
/** Appearance properties for payment intent options */
export interface PaymentIntentOptionsAppearances {
  theme: String,
  variables: PaymentIntentOptionsAppearancesVariables
}
/** Variables properties for appearances */
export interface PaymentIntentOptionsAppearancesVariables {
  fontFamily: String,
  fontSizeBase: String,
  colorPrimary: String,
  colorBackground: String,
  colorText: String
}
/** The token for stripe payments */
export interface StripePaymentsToken {
  cc_stripejs_token: String;
}
/** Variables for stripe payment element events */
export interface StripeEvents {
  elementType: String,
  collapsed: Boolean,
  empty: Boolean,
  complete: Boolean,
  value: Object
}
