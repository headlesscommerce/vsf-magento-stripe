# Stripe Payment Module for Vue Storefront 2

Stripe Payments integration using [vue-stripe](https://github.com/vue-stripe/vue-stripe) for [Vue Storefront with Magento 2](https://github.com/vuestorefront/magento2). Uses the Stripe Payment Element and supports 3D Secure.

## Requirements for Magento 2
On Magento's side its required to extend the official [Stripe Magento 2 module](https://marketplace.magento.com/stripe-stripe-payments.html) with some additional GraphQL features. 

In order for this Stripe Payment module to work the free [Magento 2 Stripe GraphQL module](https://github.com/headlesscommerce/magento-stripe-graphql) is needed.

## Integration to theme
Install the package `npm -i @headlesscommerce/vsf-magento-stripe` or `yarn add @headlesscommerce/vsf-magento-stripe`.

### Add Stripe Key 
Add `STRIPE_PUBLISHABLE_KEY={your key}` to your env. It should start like this: `pk_`

### Update VSF GraphQL types
Override the `modules/GraphQL/types.ts` ([file](https://github.com/vuestorefront/template-magento/blob/main/modules/GraphQL/types.ts)) by importing the `StripePaymentsToken` and then **adding** a `stripe_payments?: StripePaymentsToken;` field to the `PaymentMethodInput` interface.

```
import { StripePaymentsToken } from '@headlesscommerce/vsf-magento-stripe/stripe/types';
export  interface  PaymentMethodInput {
    ...
    /** Stripe payments token */
    stripe_payments?: StripePaymentsToken;
}
```

###  Include Stripe.js
In `modules/checkout/pages/Checkout.vue`([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/pages/Checkout.vue)) include the [stripe.js](https://stripe.com/docs/js) script in `head`.

```
head() {
  return {
    script: [
      {
        src: 'https://js.stripe.com/v3'
      }
    ],
  }
}
```

### Update processOrder in Checkout/Payment
In `modules/checkout/pages/Checkout/Payment.vue`([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/pages/Checkout/Payment.vue)) add a `ref` to the _VsfPaymentProvider_ component e.g:
 `<VsfPaymentProvider  ref="VsfPaymentProviderRef" @status="isPaymentReady = true" />`
 
Then access the `triggerStripe` from the `VsfPaymentProvider` component and add it to the `processOrder` function.

```
<template>
    <VsfPaymentProvider  ref="VsfPaymentProviderRef" @status="isPaymentReady = true" />
</template>
<script lang="ts">
    export default defineComponent({
      name: 'ReviewOrderAndPayment',
        setup() {
          const VsfPaymentProviderRef = ref(null);
          const  processOrder = async () => {
            const stripeStatus = await VsfPaymentProviderRef.value.triggerStripe();
            // Only return if stripe is the only payment method you wish to have
            if (!stripeStatus) return;
            ...
          };
        }
    });
</script>
```
### Add Stripe component to VsfPaymentProvider
In `modules/checkout/components/VsfPaymentProvider.vue` ([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/components/VsfPaymentProvider.vue))  import the Stripe component and override the _details_ slot of `SfRadio` component to add the Stripe component. 

```
<template>
    <SfRadio v-for="method in paymentMethods">
       <template #details>
         <Stripe ref="StripeRef" v-if="method.code === 'stripe_payments'" @status="paymentStatus" />
       </template>
    </SfRadio>
 </template>
 <script lang="ts">
    import { Stripe } from '@headlesscommerce/vsf-magento-stripe';
    export default defineComponent({
      name: 'VsfPaymentProvider',
        components: {
        ...
        Stripe
      },
    });
 </script>
```


### Set Stripe as payment method 
In `modules/checkout/components/VsfPaymentProvider.vue` ([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/components/VsfPaymentProvider.vue)) set a `ref` for the Stripe component then to validate and initiate the Stripe `setPaymentMethod` function.

```
export default defineComponent({
  name: 'VsfPaymentProvider',
  ...
  setup(_props, { emit }) {
    const StripeRef = ref(null);
    const definePaymentMethods = async (paymentMethodCode: string) => {
      if (paymentMethodCode !== 'stripe_payments') {
        // Avoid emitting just yet, see paymentStatus function
        emit('status', paymentMethodCode);
      }
      
      // Validate and initiate stripe setPaymentMethod function
      const triggerStripe = () => {
        if (selectedPaymentMethodCode.value == 'stripe_payments') {
          return StripeRef.value[0].setPaymentMethod();
        } else {
          return;
        }
      }
      const paymentStatus = () => {
        emit('status', 'true');
      };
    };
    return {
      ...
      paymentStatus,
      triggerStripe,
      StripeRef
    };
  },
```

