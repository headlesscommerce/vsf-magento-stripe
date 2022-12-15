import { StripePaymentsToken } from '~/stripe/types/types';

export interface PaymentMethodInput {
    braintree?: InputMaybe<BraintreeInput>;
    braintree_cc_vault?: InputMaybe<BraintreeCcVaultInput>;
    /** Payment method code */
    code: Scalars['String'];
    /** Required input for PayPal Hosted pro payments */
    hosted_pro?: InputMaybe<HostedProInput>;
    klarna?: InputMaybe<KlarnaInput>;
    /** Required input for Payflow Express Checkout payments */
    payflow_express?: InputMaybe<PayflowExpressInput>;
    /** Required input for PayPal Payflow Link and Payments Advanced payments */
    payflow_link?: InputMaybe<PayflowLinkInput>;
    /** Required input type for PayPal Payflow Pro and Payment Pro payments */
    payflowpro?: InputMaybe<PayflowProInput>;
    /** Required input type for PayPal Payflow Pro vault payments */
    payflowpro_cc_vault?: InputMaybe<VaultTokenInput>;
    /** Required input for Express Checkout and Payments Standard payments */
    paypal_express?: InputMaybe<PaypalExpressInput>;
    /** Purchase order number */
    purchase_order_number?: InputMaybe<Scalars['String']>;
    /** Stripe payments token */
    stripe_payments?: StripePaymentsToken;
  }